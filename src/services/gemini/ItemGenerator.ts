/**
 * ItemGenerator - Handles AI-powered item generation for D&D cards
 * Extracted from GeminiService for better code organization
 */

import { API } from '../../config/index';
import { GeminiConfig } from '../../types/api';

// Cloudflare Worker URL for secure API access
const WORKER_URL = API.WORKER_URL;

interface RarityBoundaries {
    maxBonus?: number;
    minBonus?: number;
    allowedDamageTypes: string[];
    priceRange: string;
    spellLevelMax?: number;
    spellLevelMin?: number;
    allowedAbilities: string[];
    abilitiesHe: string[];
}

interface ItemGenerationResult {
    name: string;
    typeHe: string;
    rarityHe: string;
    abilityName: string;
    abilityDesc: string;
    description: string;
    gold: string;
    weaponDamage: string;
    damageType: null;
    armorClass: number | null;
    quickStats: string;
    visualPrompt: string;
    [key: string]: any;
}

/**
 * Generate item details using Gemini AI
 * Uses BOUNDARIES approach - AI has creative freedom within defined limits
 */
export async function generateItemDetails(
    geminiConfig: GeminiConfig,
    level: string | number,
    type: string,
    subtype: string,
    rarity: string,
    ability: string,
    contextImage: string | null = null,
    complexityMode: string = 'creative',
    locale: string = 'he'
): Promise<ItemGenerationResult> {
    const { apiKey, password, useWorker, baseUrl } = geminiConfig;
    const isHebrew = locale === 'he';
    const outputLanguage = isHebrew ? 'Hebrew' : 'English';

    let modeInstruction = "";

    // Mundane mode - non-magical basic items
    if (complexityMode === 'mundane') {
        modeInstruction = isHebrew ? `
        MODE: MUNDANE (Non-Magical)
        - CRITICAL: This item is NOT magical. It is a standard, non-magical piece of equipment.
        - NO magical abilities, NO special powers, NO enchantments.
        - The item is made of normal materials (steel, leather, wood, etc.)
        - For weapons: Use standard damage dice with NO bonuses.
        - For armor: Use standard AC values with NO bonuses.
        - Rarity MUST be: נפוץ (Common)
        - abilityName and abilityDesc should describe the CRAFTSMANSHIP, not magic.
        - Example abilityName: "עבודת יד מקצועית", "ייצור איכותי", "עיצוב קלאסי"
        - Example abilityDesc: "חרב זו עשויה מפלדה מחושלת היטב עם ידית עור נוחה. מתוחזקת היטב ומאוזנת."
        - quickStats should be ONLY the damage dice or AC value.
        ` : `
        MODE: MUNDANE (Non-Magical)
        - CRITICAL: This item is NOT magical. It is a standard, non-magical piece of equipment.
        - NO magical abilities, NO special powers, NO enchantments.
        - The item is made of normal materials (steel, leather, wood, etc.)
        - For weapons: Use standard damage dice with NO bonuses.
        - For armor: Use standard AC values with NO bonuses.
        - Rarity MUST be: Common
        - abilityName and abilityDesc should describe the CRAFTSMANSHIP, not magic.
        - Example abilityName: "Professional Craftsmanship", "Quality Make", "Classic Design"
        - Example abilityDesc: "This sword is made of well-tempered steel with a comfortable leather grip. Well-maintained and balanced."
        - quickStats should be ONLY the damage dice or AC value.
        `;
    } else if (complexityMode === 'simple') {
        modeInstruction = isHebrew ? `
        MODE: EXTREMELY SIMPLE (Stats Only)
        
        === DISTRIBUTION (IMPORTANT!) ===
        When generating weapons/armor in Simple Mode, follow this distribution:
        - 50% chance: PURE +X ITEM (JUST the bonus, NO other effects at all!)
        - 25% chance: +X with extra elemental damage (e.g., +1d6 fire)
        - 15% chance: +X with passive resistance
        - 10% chance: +X with simple active ability (1/day)
        
        === PURE +X ITEMS (PRIORITY!) ===
        A "Pure +X" weapon is a masterwork item with ONLY a numerical bonus:
        - abilityName: "אומנות מופת" / "חידוד קסום" / "איזון מושלם"
        - abilityDesc: "נשק זה מעניק +X להתקפה ולנזק." (THAT'S IT! Nothing else!)
        - quickStats: LEAVE EMPTY ("") for pure +X items! The bonus is already shown in damage.
        - weaponDamage: MUST include the bonus! e.g., "1d8+2 חותך" (NOT "1d8 חותך")
        - NO extra damage, NO resistances, NO spells, NO charges.
        
        Example Pure +2 Longsword:
        - name: "להב הדיוק"
        - abilityName: "חידוד קסום"
        - abilityDesc: "חרב זו מעניקה +2 להתקפות ולנזק."
        - weaponDamage: "1d8+2 חותך"
        - quickStats: "" (empty! bonus is already in damage line)
        
        === OTHER SIMPLE OPTIONS (Less Common) ===
        - Extra damage dice (e.g. +1d6 Fire)
        - Advantage on specific checks
        - Resistance to one damage type
        
        KEEP IT SHORT. PURE +X IS THE DEFAULT.
        ` : `
        MODE: EXTREMELY SIMPLE (Stats Only)
        
        === DISTRIBUTION (IMPORTANT!) ===
        When generating weapons/armor in Simple Mode, follow this distribution:
        - 50% chance: PURE +X ITEM (JUST the bonus, NO other effects at all!)
        - 25% chance: +X with extra elemental damage (e.g., +1d6 fire)
        - 15% chance: +X with passive resistance
        - 10% chance: +X with simple active ability (1/day)
        
        === PURE +X ITEMS (PRIORITY!) ===
        A "Pure +X" weapon is a masterwork item with ONLY a numerical bonus:
        - abilityName: "Masterwork Crafting" / "Magical Edge" / "Perfect Balance"
        - abilityDesc: "This weapon grants +X to attack and damage rolls." (THAT'S IT!)
        - quickStats: LEAVE EMPTY ("") for pure +X items! The bonus is already shown in damage.
        - weaponDamage: MUST include the bonus! e.g., "1d8+2 slashing" (NOT "1d8 slashing")
        - NO extra damage, NO resistances, NO spells, NO charges.
        
        Example Pure +2 Longsword:
        - name: "Precision Blade"
        - abilityName: "Magical Edge"
        - abilityDesc: "This sword grants +2 to attack and damage rolls."
        - weaponDamage: "1d8+2 slashing"
        - quickStats: "" (empty! bonus is already in damage line)
        
        === OTHER SIMPLE OPTIONS (Less Common) ===
        - Extra damage dice (e.g. +1d6 Fire)
        - Advantage on specific checks
        - Resistance to one damage type
        
        KEEP IT SHORT. PURE +X IS THE DEFAULT.
        `;
    } else {
        modeInstruction = `
        MODE: CREATIVE & UNIQUE
            - Focus on UNIQUE, interesting mechanics that tell a story.
        - Create custom active abilities with charges or cooldowns(e.g., "Once per day...").
        - Avoid boring flat + 1 bonuses unless necessary.
        - Make the item feel special and distinct.
        `;
    }

    // ============================================
    // BOUNDARIES APPROACH (Not Pre-Roll!)
    // AI gets creative freedom within defined limits
    // ============================================
    const boundariesInstruction = buildBoundariesInstruction(rarity, isHebrew);

    // Conditional prompt based on whether item is mundane or magical
    const itemDescription = complexityMode === 'mundane'
        ? `a standard, non - magical ${type} `
        : `a unique magic item`;

    let prompt = buildMainPrompt(
        itemDescription,
        outputLanguage,
        level,
        type,
        subtype,
        rarity,
        ability,
        complexityMode,
        modeInstruction,
        boundariesInstruction,
        isHebrew
    );

    if (contextImage) {
        prompt += `
      VISUAL CONTEXT PROVIDED:
      The user has provided an image(attached).Use this image as the primary inspiration for the item's appearance, theme, and flavor.
            - Describe the item based on what you see in the image.
      - If the image shows a specific material(e.g., bone, crystal, gold), use that.
      - If the image implies a specific element(e.g., fire, ice, necrotic), use that.
      `;
    }

    prompt += buildOutputStructure(isHebrew);

    const parts: any[] = [{ text: prompt }];

    if (contextImage) {
        try {
            const imageData = await processContextImage(contextImage);
            parts.push({
                inline_data: {
                    mime_type: imageData.mimeType,
                    data: imageData.base64Data
                }
            });
            console.log("ItemGenerator: Added visual context to prompt");
        } catch (e) {
            console.error("Failed to process context image:", e);
        }
    }

    const payload = {
        contents: [{
            parts: parts
        }],
        generationConfig: undefined // Explicitly undefined to match JS behavior where it wasn't present
    };

    try {
        console.log("Sending Gemini Request. Payload size:", JSON.stringify(payload).length);

        let data;

        if (useWorker) {
            data = await callViaWorker(password!, 'gemini-generate', {
                model: 'gemini-2.0-flash',
                contents: payload.contents,
                generationConfig: payload.generationConfig
            });
        } else {
            const response = await fetch(`${baseUrl}?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || "Gemini API request failed");
                } else {
                    const errorText = await response.text();
                    throw new Error(`Gemini API Failed (${response.status}): ${errorText}`);
                }
            }

            data = await response.json();
        }

        if (data.error) {
            console.error("Gemini API Error (via Worker):", data.error);
            throw new Error(`Gemini Error: ${data.error.message || JSON.stringify(data.error)} `);
        }

        if (!data.candidates || !data.candidates[0]) {
            console.error("Gemini Unexpected Response:", data);
            if (data.promptFeedback) {
                throw new Error(`Blocked by Safety Filters: ${JSON.stringify(data.promptFeedback)} `);
            }
            throw new Error("No candidates returned from Gemini. See console for full response.");
        }

        const text = data.candidates[0].content.parts[0].text;
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(jsonStr);

        // Validate and adjust price
        validateAndAdjustPrice(parsedResult, rarity);

        console.log('✨ AI generated item:', parsedResult.name, '| Price:', parsedResult.gold, 'GP');

        return parsedResult;
    } catch (error: any) {
        if (contextImage) {
            console.warn("Gemini API request failed with context image. Retrying without image...", error);
            return generateItemDetails(geminiConfig, level, type, subtype, rarity, ability, null, complexityMode, locale);
        }

        console.error("Text Generation Error:", error);
        throw new Error(error.message || "Failed to generate item details");
    }
}

// Helper function to call through Worker
async function callViaWorker(password: string, action: string, data: any) {
    let response;
    try {
        response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: password,
                action: action,
                data: data
            })
        });
    } catch (networkError) {
        console.error("Worker Network Error:", networkError);
        throw new Error(`Connection Failed. Is the Worker URL correct? (${WORKER_URL})`);
    }

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Incorrect Password (401). Please check your key.");
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            throw new Error(error.error || `Worker Error ${response.status}`);
        } else {
            const text = await response.text();
            if (text.includes('Access')) {
                throw new Error(`Cloudflare Access Blocked (Status ${response.status}). Check Settings.`);
            }
            throw new Error(`Worker Error ${response.status}: ${text.substring(0, 50)}...`);
        }
    }

    return response.json();
}

// Build boundaries instruction based on rarity
function buildBoundariesInstruction(rarity: string, isHebrew: boolean): string {
    const rarityBoundaries: { [key: string]: RarityBoundaries } = {
        'Common': {
            maxBonus: 0,
            allowedDamageTypes: [],
            priceRange: '50-100',
            spellLevelMax: 0,
            allowedAbilities: ['cosmetic', 'light'],
            abilitiesHe: ['קוסמטי (זוהר, שינוי צבע)', 'אור קל כנר']
        },
        'Uncommon': {
            maxBonus: 1,
            allowedDamageTypes: ['fire', 'cold', 'lightning', 'אש', 'קור', 'ברק'],
            priceRange: '250-450',
            spellLevelMax: 2,
            allowedAbilities: [
                'extra 1d4 elemental damage',
                'resistance to 1 damage type',
                'advantage on 1 type of check',
                '1/day spell (level 1-2)',
                'PURE +X (no ability at all)'
            ],
            abilitiesHe: [
                'נזק יסודי נוסף 1d4',
                'עמידות לסוג נזק אחד',
                'יתרון לסוג בדיקה אחד',
                'כישוף 1/יום (רמה 1-2)',
                'טהור +X (ללא יכולת)'
            ]
        },
        'Rare': {
            maxBonus: 2,
            allowedDamageTypes: ['fire', 'cold', 'lightning', 'radiant', 'necrotic', 'אש', 'קור', 'ברק', 'זוהר', 'נמק'],
            priceRange: '2000-4000',
            spellLevelMax: 4,
            allowedAbilities: [
                'extra 1d6 elemental damage',
                'resistance to 2 damage types',
                '1/day spell (level 3-4)',
                '1/day active ability (recharge at dawn)',
                'permanent passive (e.g., darkvision)',
                'PURE +X'
            ],
            abilitiesHe: [
                'נזק יסודי נוסף 1d6',
                'עמידות ל-2 סוגי נזק',
                'כישוף 1/יום (רמה 3-4)',
                'יכולת פעילה 1/יום (נטען בזריחה)',
                'פסיבי קבוע (כמו ראיית חושך)',
                'טהור +X'
            ]
        },
        'Very Rare': {
            maxBonus: 3,
            allowedDamageTypes: ['fire', 'cold', 'lightning', 'radiant', 'necrotic', 'force', 'psychic'],
            priceRange: '15000-30000',
            spellLevelMax: 6,
            allowedAbilities: [
                'extra 2d6 elemental damage',
                'immunity to 1 damage type',
                '3 charges/day spell (level 5-6)',
                'multiple passive effects',
                'powerful active ability',
                'PURE +X'
            ],
            abilitiesHe: [
                'נזק יסודי נוסף 2d6',
                'חסינות לסוג נזק אחד',
                '3 מטענים/יום כישוף (רמה 5-6)',
                'מספר אפקטים פסיביים',
                'יכולת פעילה חזקה',
                'טהור +X'
            ]
        },
        'Legendary': {
            minBonus: 4, // Note: Not used in template but present in object
            maxBonus: 5,
            allowedDamageTypes: ['any'],
            priceRange: '75000-150000',
            spellLevelMin: 6, // Note: Not used in template but present in object
            spellLevelMax: 9,
            allowedAbilities: [
                'MUST have +4 or +5 bonus - NO LESS!',
                'any powerful combinations',
                'sentient item (consciousness)',
                'multiple high-level spells (level 6-9 ONLY)',
                'unique game-changing ability',
                'legendary history/story',
                'immunity to 2+ damage types',
                'permanent flight or teleportation (30ft)',
                'auto-cast Shield/Absorb Elements when hit',
                'advantage on ALL saving throws',
                '+4 or +5 AC bonus PLUS additional magical properties'
            ],
            abilitiesHe: [
                'חובה +4 או +5 בונוס - לא פחות!',
                'שילובים חזקים כרצונך',
                'פריט בעל תודעה',
                'מספר כישופים ברמה גבוהה בלבד (דרגה 6-9)',
                'יכולת ייחודית משנת משחק',
                'היסטוריה אגדית',
                'חסינות ל-2+ סוגי נזק',
                'טיסה או טלפורטציה קבועה (30 רגל)',
                'כישוף מגן/ספיגת יסודות אוטומטי כשנפגע',
                'יתרון בכל גלגולי ההצלה',
                '+4 או +5 לדרג"ש בנוסף ליכולות קסומות נוספות'
            ]
        }
    };

    const bounds = rarityBoundaries[rarity] || rarityBoundaries['Uncommon'];

    return isHebrew ? `
    === גבולות יצירה (חובה לעמוד בהם!) ===
    נדירות: ${rarity}
    - בונוס מקסימלי לנשק/שריון: +${bounds.maxBonus}
    - סוגי נזק יסודי מותרים: ${bounds.allowedDamageTypes.length > 0 ? bounds.allowedDamageTypes.join(', ') : 'אין (פריט Common)'}
    - רמת כישוף מקסימלית: ${bounds.spellLevelMax}
    
    === תכונות/יכולות מותרות לנדירות הזו ===
    ${bounds.abilitiesHe.map(a => `• ${a}`).join('\n    ')}
    
    === חופש יצירתי ===
    בתוך הגבולות האלה, אתה חופשי ליצור!
    - תן שם יצירתי ומקורי
    - בחר נושא/תמה מעניינת
    - בחר יכולת אחת מהרשימה (או שילוב הגיוני)
    - או השאר "נשק טהור +X" בלי שום יכולת
    
    === תמחור (העריך בעצמך!) ===
    אחרי שיצרת את הפריט, העריך את שוויו:
    - טווח מחיר לנדירות הזו: ${bounds.priceRange} זהב
    - שקלל: חוזק היכולת, סוג הנזק (זוהר/כוח יקרים יותר), תדירות שימוש
    - נשק טהור +X בלי יכולת = יקר יותר בטווח
    - ⚠️ המחיר חייב להיות **עגול לעשרות** (למשל: 350, 2500)
    ` : `
    === CREATION BOUNDARIES (MUST follow!) ===
    Rarity: ${rarity}
    - Maximum weapon/armor bonus: +${bounds.maxBonus}
    - Allowed elemental damage types: ${bounds.allowedDamageTypes.length > 0 ? bounds.allowedDamageTypes.join(', ') : 'None (Common item)'}
    - Maximum spell level: ${bounds.spellLevelMax}
    
    === ALLOWED ABILITIES FOR THIS RARITY ===
    ${bounds.allowedAbilities.map(a => `• ${a}`).join('\n    ')}
    
    === CREATIVE FREEDOM ===
    Within these boundaries, you are FREE to create!
    - Give a creative, original name
    - Choose an interesting theme
    - Pick ONE ability from the list (or a logical combination)
    - Or keep it as a "PURE +X weapon" with no ability
    
    === PRICING (You decide!) ===
    After creating the item, evaluate its value:
    - Price range for this rarity: ${bounds.priceRange} GP
    - Consider: ability strength, damage type (radiant/force worth more), usage frequency
    - Pure +X with no ability = higher end of the range
    - ⚠️ Price MUST be **rounded to tens** (e.g., 350, 2500)
    `;
}

// Build main prompt
function buildMainPrompt(itemDescription: string, outputLanguage: string, level: string | number, type: string, subtype: string, rarity: string, ability: string, complexityMode: string, modeInstruction: string, boundariesInstruction: string, _isHebrew: boolean): string {
    return `
  You are a D & D 5e Dungeon Master.Create ${itemDescription} in ${outputLanguage}.

        Parameters:
        - Level / Power: ${level}
        - Main Type: ${subtype ? subtype : type} (Priority: ${subtype ? 'Strictly follow this subtype' : 'Follow Main Type'})
    - Category: ${type}
    - Rarity: ${rarity}
    - Special Theme / Ability: ${complexityMode === 'mundane' ? 'None - this is a plain, standard item' : (ability || 'Random cool theme')}
  
  ${modeInstruction}
  ${boundariesInstruction}
  
  CRITICAL INSTRUCTION:
    - You MUST strictly adhere to the provided 'Type' and 'Subtype'.
    
  RARITY & BALANCING STANDARDS (STRICTLY FOLLOW):
    === REALISTIC PRICE TIERS (D&D 5e Economy) ===
    | Rarity       | Gold Range    | Max Bonus | Notes |
    |--------------|---------------|-----------|-------|
    | Common       | 50-100        | +0        | Cosmetic/utility only |
    | Uncommon     | 101-500       | +1        | Pure +1 weapon: 350-500 GP |
    | Rare         | 501-5,000     | +2        | Pure +2 weapon: 2,000-4,000 GP |
    | Very Rare    | 5,001-50,000  | +3        | Pure +3 weapon: 15,000-30,000 GP |
    | Legendary    | 50,001+       | +4 or +5  | MUST have +4/+5! Unique artifacts |
    
    === ENFORCEMENT ===
    - Pure +1 weapon MUST cost 350-500 GP (not 100-200!)
    - NEVER give a +2 weapon if rarity is Uncommon.
    - Weapon categories (Simple/Martial) must match official PHB classification.
    - If in doubt, price HIGHER rather than lower.
    - Ensure the 'gold' value is realistic for the power level.

  - VISUAL PROMPT RULES:
    1. The 'visualPrompt' MUST start with the physical object description.
    2. NEGATIVE CONSTRAINTS:
    - If Type is 'Ring', do NOT describe a bottle, potion, weapon, or armor.
       - If Type is 'Potion', do NOT describe jewelry, weapons, or armor.
       - If Type is 'Armor', do NOT describe a shield or helmet unless explicitly asked.
       - If Type is 'Weapon', do NOT describe a potion or ring.
  
  - If Type is 'Potion'(or contains 'Potion'), the item MUST be a consumable liquid in a bottle / vial.
  - If Type is 'Ring'(or contains 'Ring'), it MUST be a finger ring.
  - If Type is 'Scroll', it MUST be a parchment scroll.
  - If the Subtype is 'Helmet', 'Belt', 'Boots', 'Cloak', or 'Amulet', CREATE THAT SPECIFIC ITEM.
  - If Type is 'Wondrous Item' and no specific subtype is given, it can be anything.
  - If the Type is 'Armor'(and not Shield / Helmet), you MUST create BODY ARMOR(Chest / Torso).
  - If the Type is 'Weapon', create a weapon.
    `;
}

// Build output structure
function buildOutputStructure(isHebrew: boolean): string {
    return `
  Return ONLY a JSON object with this exact structure(no markdown, just raw JSON):
  ${isHebrew ? `{
    "name": "STRICT RULES: 1-3 Hebrew words MAX. Use ONLY creative nicknames.",
    "typeHe": "Hebrew Type (e.g. נשק, שריון, שיקוי, טבעת)",
    "rarityHe": "Hebrew Rarity - Use these exact translations: Common=נפוץ, Uncommon=לא נפוץ, Rare=נדיר, Very Rare=נדיר מאוד, Legendary=אגדי, Artifact=ארטיפקט",
    "abilityName": "HEBREW Ability Name",
    "abilityDesc": "COMPLETE HEBREW mechanical description (max 50 words)",
    "description": "Hebrew Fluff Description (max 20 words)",
    "gold": "Estimated price in GP (number only, e.g. 500)",
    "weaponDamage": "COMPLETE damage string in HEBREW",
    "damageType": "Always null (deprecated)",
    "armorClass": "AC value (number) if armor, else null",
    "quickStats": "EXTREMELY CONCISE essence (1-3 words MAX)",
    "visualPrompt": "CRITICAL: A SHORT, CONCISE ENGLISH description (max 18 words) for image generation"
  }` : `{
    "name": "STRICT RULES: 1-3 English words MAX. Use ONLY creative nicknames.",
    "typeHe": "English Type (e.g. Weapon, Armor, Potion, Ring)",
    "rarityHe": "English Rarity - Use these exact terms: Common, Uncommon, Rare, Very Rare, Legendary, Artifact",
    "abilityName": "English Ability Name",
    "abilityDesc": "COMPLETE English mechanical description (max 50 words)",
    "description": "English Fluff Description (max 20 words)",
    "gold": "Estimated price in GP (number only, e.g. 500)",
    "weaponDamage": "COMPLETE damage string in ENGLISH",
    "damageType": "Always null (deprecated)",
    "armorClass": "AC value (number) if armor, else null",
    "quickStats": "EXTREMELY CONCISE essence (1-3 words MAX)",
    "visualPrompt": "CRITICAL: A SHORT, CONCISE description (max 18 words) for image generation"
  }`}
    `;
}

// Process context image for API
async function processContextImage(contextImage: string): Promise<{ base64Data: string; mimeType: string }> {
    let base64Data = contextImage;
    let mimeType = "image/jpeg";

    if (contextImage.startsWith('http') || contextImage.startsWith('blob:')) {
        const response = await fetch(contextImage);
        const blob = await response.blob();
        mimeType = blob.type;
        const buffer = await blob.arrayBuffer();
        base64Data = btoa(
            new Uint8Array(buffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    } else if (contextImage.startsWith('data:')) {
        const matches = contextImage.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
        }
    }

    return { base64Data, mimeType };
}

// Validate and adjust price based on rarity
function validateAndAdjustPrice(parsedResult: ItemGenerationResult, rarity: string): void {
    const priceRanges: { [key: string]: { min: number; max: number } } = {
        'Common': { min: 25, max: 150 },
        'Uncommon': { min: 150, max: 600 },
        'Rare': { min: 1000, max: 6000 },
        'Very Rare': { min: 10000, max: 50000 },
        'Legendary': { min: 50000, max: 200000 }
    };

    const range = priceRanges[rarity] || priceRanges['Uncommon'];

    if (parsedResult.gold) {
        let price = parseInt(parsedResult.gold, 10);

        if (!isNaN(price)) {
            // Only fix EXTREME outliers
            if (price < range.min * 0.5) {
                console.log(`⚠️ Price ${price} way too low for ${rarity}, adjusting to min: ${range.min}`);
                price = range.min;
            } else if (price > range.max * 1.5) {
                console.log(`⚠️ Price ${price} way too high for ${rarity}, adjusting to max: ${range.max}`);
                price = range.max;
            }

            // Round to nearest 10
            price = Math.round(price / 10) * 10;
            parsedResult.gold = String(price);
        }
    }
}

export default { generateItemDetails };
