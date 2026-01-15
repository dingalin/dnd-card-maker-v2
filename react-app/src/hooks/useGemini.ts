import { useState } from 'react';
import { Logger } from '../utils/Logger';
import { calculatePriceFromAIResult } from '../utils/pricing/ItemPricing';

const WORKER_URL = 'https://dnd-api-proxy.dingalin2000.workers.dev/';

interface GenerateItemParams {
    type: string;
    subtype?: string;
    rarity: string;
    level?: number;
    requiresAttunement?: boolean;
}

export function useGemini() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateItem = async (params: GenerateItemParams, password: string, customPrompt?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const { type, subtype, rarity } = params;

            // Infer level from rarity for better context
            const level = getLevelFromRarity(rarity);

            // Build prompt - use custom if provided
            const prompt = customPrompt || buildItemPrompt(type, subtype, rarity, level);

            // Call via Cloudflare Worker
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: password,
                    action: 'gemini-generate',
                    data: {
                        model: 'gemini-2.0-flash',
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.9,
                            maxOutputTokens: 4096,
                            responseMimeType: 'application/json'
                        }
                    }
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('סיסמה שגויה / Invalid password');
                }
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            const responseText = await response.text();
            Logger.debug('useGemini', 'Raw response preview', responseText.substring(0, 500));

            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseErr) {
                Logger.error('useGemini', 'Failed to parse API response', responseText);
                throw new Error(`API returned invalid JSON: ${responseText.substring(0, 200)}`);
            }

            if (data.error) {
                Logger.error('useGemini', 'API Error', data.error);
                throw new Error(data.error.message || 'Gemini API error');
            }

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                Logger.error('useGemini', 'Invalid response structure', JSON.stringify(data).substring(0, 500));
                throw new Error('Invalid response from Gemini API - no text content');
            }

            const text = data.candidates[0].content.parts[0].text;
            Logger.debug('useGemini', 'Gemini text response', text.substring(0, 300));

            // Parse JSON response - Robust extraction
            let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // Find just the JSON object if there's extra text
            const firstOpen = jsonStr.indexOf('{');
            const lastClose = jsonStr.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                jsonStr = jsonStr.substring(firstOpen, lastClose + 1);
            }

            Logger.debug('useGemini', 'Extracted JSON', jsonStr.substring(0, 300));

            let result;
            try {
                result = JSON.parse(jsonStr);
            } catch (parseErr) {
                Logger.error('useGemini', 'Failed to parse item JSON', jsonStr);
                throw new Error(`Invalid item JSON from Gemini: ${jsonStr.substring(0, 100)}`);
            }

            // 🛡️ PRICE CALCULATION: Use official D&D 5e pricing system
            // Calculate price based on type, rarity, and abilities
            const calculatedPrice = calculatePriceFromAIResult(
                result.typeHe || type,
                subtype || result.typeHe,
                result.rarityHe || rarity,
                result.abilityDesc || '',
                false // requiresAttunement - could be extracted from result
            );

            // Override AI-generated price with calculated price
            result.gold = calculatedPrice.toString();
            Logger.info('useGemini', 'Calculated official D&D price', {
                type: result.typeHe,
                rarity: result.rarityHe,
                calculatedPrice
            });

            if (!result.weaponDamage && result.typeHe === 'נשק') {
                // Default weapon damage for common subtypes
                result.weaponDamage = '1d8 חותך';
                Logger.warn('useGemini', 'Added fallback weaponDamage', result.weaponDamage);
            }

            if (!result.quickStats) {
                result.quickStats = result.weaponDamage ||
                    (result.armorClass ? `AC ${result.armorClass}` : '');
            }

            Logger.info('useGemini', 'Final result with official pricing', {
                name: result.name,
                weaponDamage: result.weaponDamage,
                gold: result.gold,
                quickStats: result.quickStats
            });

            setIsLoading(false);
            return result;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to generate item';
            setError(errorMessage);
            setIsLoading(false);
            throw new Error(errorMessage);
        }
    };

    return {
        generateItem,
        isLoading,
        error,
    };
}

function buildItemPrompt(type: string, subtype: string | undefined, rarity: string, level: number): string {
    // Extract English name from subtype like "Javelin (כידון)" -> "Javelin"
    let englishItemName = '';
    let hebrewItemName = '';
    if (subtype) {
        const match = subtype.match(/^([^(]+)\s*\(([^)]+)\)$/);
        if (match) {
            englishItemName = match[1].trim();
            hebrewItemName = match[2].trim();
        } else {
            englishItemName = subtype;
            hebrewItemName = subtype;
        }
    }

    // Build specific item description for prompt
    const itemDescription = englishItemName
        ? `a ${englishItemName} (${hebrewItemName} in Hebrew)`
        : `a ${type}`;

    return `You are a D&D 5e magical item creator. Generate a ${rarity} ${itemDescription} for level ${level} party.

IMPORTANT - THIS IS A ${englishItemName.toUpperCase() || type.toUpperCase()}:
- The item MUST be a ${englishItemName || type}
- The visual prompt MUST describe a ${englishItemName || type}
- For weapons: Include the weapon's specific appearance (blade shape, handle, etc.)

REQUIREMENTS:
- Rarity: ${rarity}
- Type: ${type}
- Specific Item: ${englishItemName || 'any'} (${hebrewItemName || 'כל סוג'})
- Level: ${level}

RARITY GUIDELINES:
- Common (נפוץ): 50-100gp, no magical abilities
- Uncommon (לא נפוץ): 100-500gp, +1 bonus or minor ability
- Rare (נדיר): 500-5000gp, +2 bonus or moderate ability
- Very Rare (נדיר מאוד): 5000-50000gp, +3 bonus or powerful ability
- Legendary (אגדי): 50000+gp, +4/+5 bonus, unique abilities

Return ONLY valid JSON with this EXACT structure (ALL fields are REQUIRED):
{
  "name": "Creative Hebrew name (2-3 words). MUST fit the item type (e.g. do not call a hammer a 'Shield', do not call a sword a 'Ring').",
  "typeHe": "Hebrew type (נשק/שריון/שיקוי/טבעת)",
  "rarityHe": "Hebrew rarity (נפוץ/לא נפוץ/נדיר/נדיר מאוד/אגדי)",
  "abilityName": "Hebrew ability name",
  "abilityDesc": "Hebrew ability description (max 50 words)",
  "description": "Hebrew flavor text (max 20 words)",
  "gold": "REQUIRED: Price as number string (e.g., '350')",
  "weaponDamage": "REQUIRED for weapons: Damage dice in Hebrew (e.g., '1d8+1 חותך'). For non-weapons use ''.",
  "armorClass": "REQUIRED for armor: AC number. For non-armor use null.",
  "quickStats": "Short stats summary (damage or AC) in Hebrew",
  "visualPrompt": "MUST describe a ${englishItemName || type}: English description for image generation (max 20 words) - describe this SPECIFIC weapon/item type"
}

CRITICAL RULES:
1. EVERY weapon MUST have "weaponDamage" with dice format (1d6, 1d8, etc.) + damage type in Hebrew
2. EVERY armor MUST have "armorClass" as a number
3. EVERY item MUST have "gold" as a price string
4. Price must be realistic for rarity (Common: 50-100, Uncommon: 100-500, etc.)
5. Use Hebrew for all text except visualPrompt
6. Damage types in Hebrew: חותך (slashing), דוקר (piercing), מוחץ (bludgeoning), אש (fire), קור (cold), ברק (lightning)
7. The visualPrompt MUST specifically describe a ${englishItemName || type} - not a generic weapon/item`;
}

function getLevelFromRarity(rarity: string): number {
    switch (rarity) {
        case 'נפוץ': return 1;
        case 'לא נפוץ': return 3;
        case 'נדיר': return 5;
        case 'נדיר מאוד': return 11;
        case 'אגדי': return 17;
        default: return 5;
    }
}
