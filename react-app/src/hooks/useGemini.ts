import { useState } from 'react';

const WORKER_URL = 'https://dnd-api-proxy.dingalin2000.workers.dev/';

interface GenerateItemParams {
    type: string;
    subtype?: string;
    rarity: string;
    level?: number;
}

export function useGemini() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateItem = async (params: GenerateItemParams, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const { type, subtype, rarity } = params;

            // Infer level from rarity for better context
            const level = getLevelFromRarity(rarity);

            // Build prompt
            const prompt = buildItemPrompt(type, subtype, rarity, level);

            // Call via Cloudflare Worker
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: password,
                    action: 'gemini-generate',
                    data: {
                        model: 'gemini-2.5-flash',
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
            console.log('[useGemini] Raw response:', responseText.substring(0, 500));

            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseErr) {
                console.error('[useGemini] Failed to parse API response:', responseText);
                throw new Error(`API returned invalid JSON: ${responseText.substring(0, 200)}`);
            }

            if (data.error) {
                console.error('[useGemini] API Error:', data.error);
                throw new Error(data.error.message || 'Gemini API error');
            }

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                console.error('[useGemini] Invalid response structure:', JSON.stringify(data).substring(0, 500));
                throw new Error('Invalid response from Gemini API - no text content');
            }

            const text = data.candidates[0].content.parts[0].text;
            console.log('[useGemini] Gemini text response:', text.substring(0, 300));

            // Parse JSON response - Robust extraction
            let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // Find just the JSON object if there's extra text
            const firstOpen = jsonStr.indexOf('{');
            const lastClose = jsonStr.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                jsonStr = jsonStr.substring(firstOpen, lastClose + 1);
            }

            console.log('[useGemini] Extracted JSON:', jsonStr.substring(0, 300));

            let result;
            try {
                result = JSON.parse(jsonStr);
            } catch (parseErr) {
                console.error('[useGemini] Failed to parse item JSON:', jsonStr);
                throw new Error(`Invalid item JSON from Gemini: ${jsonStr.substring(0, 100)}`);
            }

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
    return `You are a D&D 5e item creator. Generate a ${rarity} ${subtype || type} for level ${level} party.

REQUIREMENTS:
- Rarity: ${rarity}
- Type: ${type}
- Subtype: ${subtype || 'any'}
- Level: ${level}

RARITY GUIDELINES:
- Common: 50-100gp, no magical abilities
- Uncommon: 100-500gp, +1 bonus or minor ability
- Rare: 500-5000gp, +2 bonus or moderate ability
- Very Rare: 5000-50000gp, +3 bonus or powerful ability
- Legendary: 50000+gp, +4/+5 bonus, unique abilities

Return ONLY valid JSON with this structure:
{
  "name": "Creative Hebrew name (2-3 words, NO item type in name)",
  "typeHe": "Hebrew type (נשק/שריון/שיקוי/טבעת)",
  "rarityHe": "Hebrew rarity (נפוץ/לא נפוץ/נדיר/נדיר מאוד/אגדי)",
  "abilityName": "Hebrew ability name",
  "abilityDesc": "Hebrew ability description (max 50 words)",
  "description": "Hebrew flavor text (max 20 words)",
  "gold": "Price as number string (e.g., '350')",
  "weaponDamage": "Weapon damage if applicable (e.g., '1d8+1 חותך')",
  "armorClass": "AC number if armor, null otherwise",
  "quickStats": "Quick stats summary (leave empty for weapons/armor)",
  "visualPrompt": "English description for image generation (max 20 words)"
}

CRITICAL:
- Price must be realistic for rarity
- Use Hebrew for all text except visualPrompt
- Damage types in Hebrew: חותך (slashing), דוקר (piercing), מוחץ (bludgeoning), אש (fire), קור (cold), ברק (lightning)
- Keep it D&D 5e balanced`;
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
