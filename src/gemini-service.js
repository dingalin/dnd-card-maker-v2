// GeminiService - Cleaned version (Dec 2024)
// Removed: generateItemImage (Pollinations), removeWhiteBackground (duplicate), generateImageImagen3 (not working)
// Image generation now uses GetImg/FLUX exclusively

console.log("GeminiService module loaded (Clean Version)");

// Cloudflare Worker URL for secure API access
const WORKER_URL = "https://dnd-api-proxy.dingalin2000.workers.dev/";

// MEMORY LEAK FIX: Registry to track blob URLs for cleanup
const BlobURLRegistry = {
    urls: new Map(), // url -> timestamp
    maxAge: 5 * 60 * 1000, // 5 minutes - URLs older than this get auto-cleaned
    maxCount: 20, // Max blob URLs to keep

    register(url) {
        this.urls.set(url, Date.now());
        this.cleanup();
        return url;
    },

    revoke(url) {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
            this.urls.delete(url);
        }
    },

    cleanup() {
        const now = Date.now();
        // Remove old URLs
        for (const [url, timestamp] of this.urls) {
            if (now - timestamp > this.maxAge) {
                URL.revokeObjectURL(url);
                this.urls.delete(url);
                console.log('🧹 BlobURLRegistry: Cleaned old URL');
            }
        }
        // If still over limit, remove oldest
        while (this.urls.size > this.maxCount) {
            const oldest = [...this.urls.entries()].sort((a, b) => a[1] - b[1])[0];
            if (oldest) {
                URL.revokeObjectURL(oldest[0]);
                this.urls.delete(oldest[0]);
                console.log('🧹 BlobURLRegistry: Cleaned excess URL');
            }
        }
    },

    // Force cleanup all - call when navigating away or when memory is tight
    revokeAll() {
        for (const url of this.urls.keys()) {
            URL.revokeObjectURL(url);
        }
        this.urls.clear();
        console.log('🧹 BlobURLRegistry: All URLs revoked');
    }
};

// Expose for manual cleanup if needed
window.blobURLRegistry = BlobURLRegistry;

class GeminiService {
    constructor(apiKeyOrPassword) {
        // Check if this looks like an API key or a password
        // API keys start with "AIza" typically
        if (apiKeyOrPassword.startsWith('AIza')) {
            this.apiKey = apiKeyOrPassword;
            this.useWorker = false;
        } else {
            // It's a password - use Worker
            this.password = apiKeyOrPassword;
            this.useWorker = true;
            console.log("GeminiService: Using Worker proxy mode 🔐");
        }
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    }

    // Helper method to call through Worker
    async callViaWorker(action, data) {
        let response;
        try {
            response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: this.password,
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

    async generateItemDetails(level, type, subtype, rarity, ability, contextImage = null, complexityMode = 'creative', locale = 'he') {
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
            - STRICT PROHIBITION: Do NOT create summoning spells, complex active abilities, transformations, or multi-turn effects.
            - The item MUST be practical and strictly mechanical.
            - PERMITTED EFFECTS ONLY:
              1. Flat bonuses (+1/+2/+3 to Hit/Damage/AC/Saves).
              2. Extra damage dice (e.g. +1d6 Fire).
              3. Advantage on specific checks (e.g. Advantage on Perception).
              4. Resistance to one damage type.
              5. One simple utility spell cast once per day (e.g. Light, Feather Fall).
            - If I selected a Weapon, just give me a +1 Weapon with maybe 1d6 elemental damage.
            - KEEP IT SHORT.
            - Quick Stats Example: "+1 להתקפה ולנזק", "+1 לדרג השריון", "תוספת 1d6 נזק אש", "עמידות לאש".
            ` : `
            MODE: EXTREMELY SIMPLE (Stats Only)
            - STRICT PROHIBITION: Do NOT create summoning spells, complex active abilities, transformations, or multi-turn effects.
            - The item MUST be practical and strictly mechanical.
            - PERMITTED EFFECTS ONLY:
              1. Flat bonuses (+1/+2/+3 to Hit/Damage/AC/Saves).
              2. Extra damage dice (e.g. +1d6 Fire).
              3. Advantage on specific checks (e.g. Advantage on Perception).
              4. Resistance to one damage type.
              5. One simple utility spell cast once per day (e.g. Light, Feather Fall).
            - If I selected a Weapon, just give me a +1 Weapon with maybe 1d6 elemental damage.
            - KEEP IT SHORT.
            - Quick Stats Example: "+1 to attack and damage", "+1 to AC", "extra 1d6 fire damage", "fire resistance".
            `;
        } else {
            modeInstruction = `
            MODE: CREATIVE & UNIQUE
            - Focus on UNIQUE, interesting mechanics that tell a story.
            - Create custom active abilities with charges or cooldowns (e.g., "Once per day...").
            - Avoid boring flat +1 bonuses unless necessary.
            - Make the item feel special and distinct.
            `;
        }

        // Conditional prompt based on whether item is mundane or magical
        const itemDescription = complexityMode === 'mundane'
            ? `a standard, non-magical ${type}`
            : `a unique magic item`;

        let prompt = `
      You are a D&D 5e Dungeon Master. Create ${itemDescription} in ${outputLanguage}.
      
      Parameters:
      - Level/Power: ${level}
      - Main Type: ${subtype ? subtype : type} (Priority: ${subtype ? 'Strictly follow this subtype' : 'Follow Main Type'})
      - Category: ${type}
      - Rarity: ${rarity}
      - Special Theme/Ability: ${complexityMode === 'mundane' ? 'None - this is a plain, standard item' : (ability || 'Random cool theme')}
      
      ${modeInstruction}
      `;

        if (contextImage) {
            prompt += `
      VISUAL CONTEXT PROVIDED:
      The user has provided an image (attached). Use this image as the primary inspiration for the item's appearance, theme, and flavor.
      - Describe the item based on what you see in the image.
      - If the image shows a specific material (e.g., bone, crystal, gold), use that.
      - If the image implies a specific element (e.g., fire, ice, necrotic), use that.
      `;
        }

        prompt += `
      CRITICAL INSTRUCTION:
      - You MUST strictly adhere to the provided 'Type' and 'Subtype'.
      - VISUAL PROMPT RULES:
        1. The 'visualPrompt' MUST start with the physical object description (e.g., "A glowing blue ring...", "A glass potion bottle...").
        2. NEGATIVE CONSTRAINTS:
           - If Type is 'Ring', do NOT describe a bottle, potion, weapon, or armor.
           - If Type is 'Potion', do NOT describe jewelry, weapons, or armor.
           - If Type is 'Armor', do NOT describe a shield or helmet unless explicitly asked.
           - If Type is 'Weapon', do NOT describe a potion or ring.
      
      - If Type is 'Potion' (or contains 'Potion'), the item MUST be a consumable liquid in a bottle/vial.
      - If Type is 'Ring' (or contains 'Ring'), it MUST be a finger ring.
      - If Type is 'Scroll', it MUST be a parchment scroll.
      - If the Subtype is 'Helmet', 'Belt', 'Boots', 'Cloak', or 'Amulet', CREATE THAT SPECIFIC ITEM.
      - If Type is 'Wondrous Item' and no specific subtype is given, it can be anything.
      - If the Type is 'Armor' (and not Shield/Helmet), you MUST create BODY ARMOR (Chest/Torso).
      - If the Type is 'Weapon', create a weapon.

      Return ONLY a JSON object with this exact structure (no markdown, just raw JSON):
      ${isHebrew ? `{
        "name": "STRICT RULES: 1-3 Hebrew words MAX. FORBIDDEN WORDS (never use these in name): חרב, גרזן, רומח, קשת, מגל, פטיש, פגיון, מגן, שריון, טבעת, שרביט, מטה, שיקוי. Use ONLY creative nicknames like: להב הרעם, עוקץ הצל, שן הדרקון, קול הקרח, נשימת האש, עין הנשר.",
        "typeHe": "Hebrew Type (e.g. נשק, שריון, שיקוי, טבעת)",
        "rarityHe": "Hebrew Rarity - Use these exact translations: Common=נפוץ, Uncommon=לא נפוץ, Rare=נדיר, Very Rare=נדיר מאוד, Legendary=אגדי, Artifact=ארטיפקט",
        "abilityName": "HEBREW Ability Name (שם היכולת בעברית, e.g. 'התמרה הדהודית', 'מכת צל', 'זעם יסודי', 'נשימת מים'). Creative and thematic.",
        "abilityDesc": "COMPLETE HEBREW mechanical description (max 50 words) with ALL game rules in Hebrew: include saving throw type and DC (e.g. 'חיסכון חוכמה DC 14'), duration (e.g. 'דקה אחת', 'שעה', 'עד המנוחה הארוכה הבאה'), number of uses (e.g. 'פעם ביום', '3 פעמים בלילה'), mechanical effects (e.g. 'חיסרון בהתקפות', 'מהירות מופחתת ב-10'). הכל בעברית!",
        "description": "Hebrew Fluff Description (max 20 words)",
        "gold": "Estimated price in GP (number only, e.g. 500)",
        "weaponDamage": "Full damage string including dice and type in HEBREW (e.g. '1d8 + 1d6 אש' or '2d6 חותך'). Use Hebrew damage types: slashing=חותך, piercing=דוקר, bludgeoning=מוחץ, fire=אש, cold=קור, lightning=ברק, poison=רעל, acid=חומצה, necrotic=נמק, radiant=זוהר, force=כוח, psychic=נפשי, thunder=רעם.",
        "damageType": "Always null (deprecated, put type in weaponDamage).",
        "armorClass": "AC value (number) if armor, else null",
        "quickStats": "EXTREMELY CONCISE mechanical summary in Hebrew (max 4-5 words). Priority: mechanics over flavor. Examples: '1d8 + 1d6 אש', '+2 להגנה ולגלגולי הצלה', 'הטלת כדור אש פעם ביום', 'יתרון בבדיקות התגנבות'. Do NOT use full sentences.",
        "visualPrompt": "A SHORT, CONCISE English description (max 15 words) of the item for image generation. Focus ONLY on the main object's appearance. No background descriptions."
      }` : `{
        "name": "STRICT RULES: 1-3 English words MAX. Use ONLY creative nicknames like: Thunder's Edge, Shadow Sting, Dragon's Fang, Frost Voice, Fire's Breath, Eagle Eye. Do NOT use generic names like 'sword', 'axe', 'ring'.",
        "typeHe": "English Type (e.g. Weapon, Armor, Potion, Ring)",
        "rarityHe": "English Rarity - Use these exact terms: Common, Uncommon, Rare, Very Rare, Legendary, Artifact",
        "abilityName": "English Ability Name",
        "abilityDesc": "COMPLETE English mechanical description (max 50 words) with ALL game rules: include saving throw type and DC (e.g. 'DC 14 Wisdom'), duration (e.g. '1 minute', '1 hour', 'until next long rest'), number of uses (e.g. 'once per day', '3 times per night'), mechanical effects (e.g. 'disadvantage on attacks', 'speed reduced by 10'). Be specific and playable!",
        "description": "English Fluff Description (max 20 words)",
        "gold": "Estimated price in GP (number only, e.g. 500)",
        "weaponDamage": "Full damage string including dice and type in ENGLISH (e.g. '1d8 + 1d6 fire' or '2d6 slashing'). Use English damage types: slashing, piercing, bludgeoning, fire, cold, lightning, poison, acid, necrotic, radiant, force, psychic, thunder.",
        "damageType": "Always null (deprecated, put type in weaponDamage).",
        "armorClass": "AC value (number) if armor, else null",
        "quickStats": "EXTREMELY CONCISE mechanical summary in English (max 4-5 words). Priority: mechanics over flavor. Examples: '1d8 + 1d6 fire', '+2 to AC and saves', 'cast fireball once per day', 'advantage on stealth'. Do NOT use full sentences.",
        "visualPrompt": "A SHORT, CONCISE English description (max 15 words) of the item for image generation. Focus ONLY on the main object's appearance. No background descriptions."
      }`}
    `;

        const parts = [{ text: prompt }];

        if (contextImage) {
            try {
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

                parts.push({
                    inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                    }
                });
                console.log("GeminiService: Added visual context to prompt");
            } catch (e) {
                console.error("Failed to process context image:", e);
            }
        }

        const payload = {
            contents: [{
                parts: parts
            }]
        };

        try {
            console.log("Sending Gemini Request. Payload size:", JSON.stringify(payload).length);

            let data;

            if (this.useWorker) {
                data = await this.callViaWorker('gemini-generate', {
                    model: 'gemini-2.0-flash',
                    contents: payload.contents,
                    generationConfig: payload.generationConfig
                });
            } else {
                const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || "Gemini API request failed");
                }

                data = await response.json();
            }

            if (data.error) {
                console.error("Gemini API Error (via Worker):", data.error);
                throw new Error(`Gemini Error: ${data.error.message || JSON.stringify(data.error)}`);
            }

            if (!data.candidates || !data.candidates[0]) {
                console.error("Gemini Unexpected Response:", data);
                if (data.promptFeedback) {
                    throw new Error(`Blocked by Safety Filters: ${JSON.stringify(data.promptFeedback)}`);
                }
                throw new Error("No candidates returned from Gemini. See console for full response.");
            }

            const text = data.candidates[0].content.parts[0].text;
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            if (contextImage) {
                console.warn("Gemini API request failed with context image. Retrying without image...", error);
                return this.generateItemDetails(level, type, subtype, rarity, ability, null);
            }

            console.error("Text Generation Error:", error);
            throw new Error(error.message || "Failed to generate item details");
        }
    }

    // Main image generation using GetImg/FLUX - OPTIMIZED FOR FANTASY ITEMS
    async generateImageGetImg(visualPrompt, model, style, getImgApiKey, styleOption = 'natural', userColor = '#ffffff', colorDescription = null) {

        // === FLUX-OPTIMIZED PROMPT BUILDER ===
        // Based on research: FLUX excels with natural language, detailed descriptions,
        // and structured prompts following Subject → Style → Context format

        const styleConfigs = {
            'realistic': {
                prefix: 'ultra-realistic photography',
                suffix: 'studio lighting, professional product shot, sharp focus, 8K resolution',
                quality: 'highly detailed, photorealistic, cinematic'
            },
            'watercolor': {
                prefix: 'watercolor painting, artistic illustration',
                suffix: 'soft edges, flowing colors, painterly strokes, art paper texture',
                quality: 'beautiful artwork, defined ink outlines, vibrant pigments'
            },
            'oil': {
                prefix: 'classical oil painting, Renaissance style artwork',
                suffix: 'rich oil colors, detailed brushwork, dramatic chiaroscuro lighting',
                quality: 'masterpiece quality, museum painting, baroque details'
            },
            'sketch': {
                prefix: 'detailed pencil sketch, technical drawing',
                suffix: 'graphite on paper, cross-hatching, precise lines, monochrome',
                quality: 'professional illustration, concept art style'
            },
            'dark_fantasy': {
                prefix: 'dark fantasy artwork, gothic illustration',
                suffix: 'dramatic shadows, ominous atmosphere, Elden Ring aesthetic',
                quality: 'high contrast, moody lighting, gritty details, dark souls style'
            },
            'anime': {
                prefix: 'anime style illustration, manga artwork',
                suffix: 'cel shading, clean lines, vibrant colors, Studio Ghibli inspired',
                quality: 'high quality anime, detailed, beautiful illustration'
            },
            'woodcut': {
                prefix: 'medieval woodcut print, old book illustration',
                suffix: 'black and white, carved lines, vintage printed art',
                quality: 'antique style, historical artwork, ink print'
            },
            'pixel': {
                prefix: '16-bit pixel art, retro game sprite',
                suffix: 'clean pixels, limited color palette, nostalgic',
                quality: 'game asset, sharp pixels, iconic design'
            },
            'simple_icon': {
                prefix: 'flat vector icon, minimalist design',
                suffix: 'clean edges, symbolic, high contrast',
                quality: 'professional icon, simple shapes, clear silhouette'
            }
        };

        const styleConfig = styleConfigs[style] || styleConfigs['realistic'];

        // Helper to convert hex to descriptive color name (fallback if no colorDescription provided)
        const getColorName = (hex) => {
            const map = {
                '#ffffff': 'pure white', '#000000': 'deep black', '#ff0000': 'crimson red',
                '#00ff00': 'emerald green', '#0000ff': 'royal blue', '#ffff00': 'golden yellow',
                '#00ffff': 'icy cyan', '#ff00ff': 'arcane magenta', '#8b4513': 'rich brown',
                '#808080': 'steel gray', '#e6e6fa': 'soft lavender', '#f0f8ff': 'pale ice blue',
                '#f5f5dc': 'antique beige', '#ffe4e1': 'rose quartz'
            };
            return map[hex.toLowerCase()] || 'neutral';
        };

        // Use the smart color description if provided, otherwise fall back to hex lookup
        const colorName = colorDescription || getColorName(userColor);

        // === ELEMENTAL/THEMATIC ENHANCEMENT ===
        // Add visual keywords based on item's elemental theme (detected from visualPrompt)
        const getElementalEnhancement = (prompt) => {
            const p = prompt.toLowerCase();
            if (p.includes('fire') || p.includes('flame') || p.includes('אש') || p.includes('להב')) {
                return 'fiery embers, molten orange glow, burning runes, flickering flames, warm red-orange lighting';
            }
            if (p.includes('ice') || p.includes('frost') || p.includes('קרח') || p.includes('קפוא')) {
                return 'frost crystals, icy blue shimmer, frozen patterns, glacial surface, cold blue lighting';
            }
            if (p.includes('lightning') || p.includes('thunder') || p.includes('ברק') || p.includes('רעם')) {
                return 'crackling electricity, electric blue arcs, storm energy, charged atmosphere';
            }
            if (p.includes('nature') || p.includes('wood') || p.includes('leaf') || p.includes('עץ') || p.includes('טבע')) {
                return 'vine wrapped details, leaf motifs, natural wood grain, druidic symbols, organic texture';
            }
            if (p.includes('holy') || p.includes('divine') || p.includes('קדוש') || p.includes('אלוהי')) {
                return 'holy radiance, golden halo effect, angelic motifs, blessed white light, sacred glow';
            }
            if (p.includes('dark') || p.includes('shadow') || p.includes('necro') || p.includes('אפל') || p.includes('צל')) {
                return 'dark energy wisps, shadowy aura, skull motifs, bone accents, eerie purple-black glow';
            }
            if (p.includes('poison') || p.includes('acid') || p.includes('רעל') || p.includes('חומצ')) {
                return 'toxic green glow, dripping venom, bubbling acid, sickly yellow-green vapor';
            }
            if (p.includes('arcane') || p.includes('magic') || p.includes('קסם') || p.includes('כישוף')) {
                return 'glowing arcane runes, magical aura, mystical energy particles, ethereal purple wisps';
            }
            return ''; // No elemental theme detected
        };

        // === RARITY-BASED QUALITY ===
        // Make legendary items look more prestigious than common ones
        const getRarityQuality = (prompt) => {
            const p = prompt.toLowerCase();
            if (p.includes('legendary') || p.includes('אגדי') || p.includes('artifact') || p.includes('ארטיפקט')) {
                return 'divine masterwork craftsmanship, blinding ethereal brilliance, celestial materials, legendary aura, museum quality artifact';
            }
            if (p.includes('very rare') || p.includes('נדיר מאוד')) {
                return 'exquisite masterwork, radiant magical aura, precious metals and gems, exceptional quality';
            }
            if (p.includes('rare') || p.includes('נדיר')) {
                return 'ornate intricate details, embedded gemstones, magical shimmer, fine engravings, quality craftsmanship';
            }
            if (p.includes('uncommon') || p.includes('לא נפוץ')) {
                return 'quality craftsmanship, subtle magical glow, decorative accents, polished finish';
            }
            // Common or default
            return 'practical design, well-maintained, clean craftsmanship';
        };

        const elementalEnhancement = getElementalEnhancement(visualPrompt);
        const rarityQuality = getRarityQuality(visualPrompt);

        // === ITEM TYPE DETECTION & SPECIALIZED PROMPTS ===
        // Detect item type from visualPrompt and apply type-specific enhancements
        const promptLower = visualPrompt.toLowerCase();
        let itemTypeEnhancement = '';
        let compositionGuide = '';

        // WEAPONS - Enhanced for clear, detailed weapon renders
        if (promptLower.includes('sword') || promptLower.includes('blade') || promptLower.includes('חרב')) {
            itemTypeEnhancement = 'ornate fantasy sword, detailed hilt and guard, sharp glinting blade edge, intricate engravings';
            compositionGuide = 'full weapon visible from pommel to tip, angled hero pose';
        } else if (promptLower.includes('axe') || promptLower.includes('גרזן')) {
            itemTypeEnhancement = 'formidable battle axe, heavy curved blade, reinforced handle with leather grip';
            compositionGuide = 'dynamic angle showing the axe head detail';
        } else if (promptLower.includes('bow') || promptLower.includes('קשת')) {
            itemTypeEnhancement = 'elegant recurve bow, carved wood or bone, taut bowstring, decorative limbs';
            compositionGuide = 'full bow visible, graceful curved shape emphasized';
        } else if (promptLower.includes('staff') || promptLower.includes('מטה') || promptLower.includes('שרביט')) {
            itemTypeEnhancement = 'magical wizard staff, crystalline focus gemstone, arcane runes along the shaft';
            compositionGuide = 'vertical composition showing the magical top ornament';
        } else if (promptLower.includes('dagger') || promptLower.includes('פגיון')) {
            itemTypeEnhancement = 'sleek throwing dagger, double-edged blade, balanced design';
            compositionGuide = 'centered blade with sharp point visible';
        } else if (promptLower.includes('spear') || promptLower.includes('רומח')) {
            itemTypeEnhancement = 'long war spear, deadly pointed head, wrapped shaft grip';
            compositionGuide = 'angled to show spear tip detail and length';
        } else if (promptLower.includes('hammer') || promptLower.includes('mace') || promptLower.includes('פטיש')) {
            itemTypeEnhancement = 'heavy war hammer, reinforced striking head, powerful design';
            compositionGuide = 'showing the weight and impact potential of the head';
        } else if (promptLower.includes('sickle') || promptLower.includes('מגל')) {
            itemTypeEnhancement = 'curved harvesting sickle, sharp crescent blade, wooden handle, druidic tool';
            compositionGuide = 'showing the curved blade arc and edge';
        } else if (promptLower.includes('אלה') || promptLower.includes('club')) {
            itemTypeEnhancement = 'spiked war mace, heavy metal head, crushing weapon design';
            compositionGuide = 'showing the impact head with spikes or flanges';
        } else if (promptLower.includes('crossbow') || promptLower.includes('arbalet') || promptLower.includes('קשתון')) {
            itemTypeEnhancement = 'mechanical crossbow, intricate trigger mechanism, loaded bolt';
            compositionGuide = 'three-quarter view showing mechanism detail';
        }

        // ARMOR - Enhanced for detailed armor renders
        // CHAINMAIL - Must come BEFORE generic armor to catch "chain" correctly
        else if (promptLower.includes('chain') || promptLower.includes('שרשראות')) {
            itemTypeEnhancement = 'medieval chainmail armor, interlocking metal rings, protective mail hauberk, iron ring mesh, warrior torso armor, wearable body protection';
            compositionGuide = 'front torso view showing chainmail ring pattern texture';
            // HIDE/FUR ARMOR
        } else if (promptLower.includes('hide') || promptLower.includes('פרווה') || promptLower.includes('fur')) {
            itemTypeEnhancement = 'fur hide armor vest, thick animal pelt chest piece, tanned leather with brown fur trim, primitive armor item on display stand, rugged wilderness gear';
            compositionGuide = 'front view of armor piece on mannequin torso, showing fur texture';
        } else if (promptLower.includes('leather') || promptLower.includes('עור')) {
            itemTypeEnhancement = 'supple leather armor, stitched panels, reinforced shoulders, adventurer gear';
            compositionGuide = 'front view showing leather texture and straps';
        } else if (promptLower.includes('scale') || promptLower.includes('קשקשים')) {
            itemTypeEnhancement = 'overlapping metal scale armor, fish-scale pattern, protective scales, dragon-like mail';
            compositionGuide = 'front view showing scale pattern and metallic sheen';
        } else if (promptLower.includes('armor') || promptLower.includes('plate') || promptLower.includes('שריון') || promptLower.includes('צלחות')) {
            itemTypeEnhancement = 'ornate plate armor piece, polished metal surface, functional battle design, riveted construction';
            compositionGuide = 'front view showing craftsmanship details';
        } else if (promptLower.includes('shield') || promptLower.includes('מגן')) {
            itemTypeEnhancement = 'heraldic battle shield, emblazoned surface, reinforced rim, sturdy grip';
            compositionGuide = 'front face view with emblem visible';
        } else if (promptLower.includes('helmet') || promptLower.includes('קסדה')) {
            itemTypeEnhancement = 'detailed warrior helmet, protective visor, decorative crest';
            compositionGuide = 'three-quarter view showing depth and profile';
        } else if (promptLower.includes('gauntlet') || promptLower.includes('glove') || promptLower.includes('כפפ')) {
            itemTypeEnhancement = 'articulated armored gauntlet, flexible finger joints, reinforced knuckles';
            compositionGuide = 'dynamic pose showing articulation';
        } else if (promptLower.includes('boots') || promptLower.includes('מגפ')) {
            itemTypeEnhancement = 'sturdy adventuring boots, reinforced toe and heel, magical enhancement visible';
            compositionGuide = 'side profile showing design';
        }

        // ACCESSORIES & MAGICAL ITEMS
        else if (promptLower.includes('ring') || promptLower.includes('טבעת')) {
            itemTypeEnhancement = 'intricate magical ring, precious metal band, embedded gemstone, subtle enchantment glow';
            compositionGuide = 'close-up macro view, gemstone as focal point';
        } else if (promptLower.includes('amulet') || promptLower.includes('necklace') || promptLower.includes('קמע')) {
            itemTypeEnhancement = 'mystical amulet pendant, ornate chain, magical centerpiece gem';
            compositionGuide = 'centered with chain flowing around it';
        } else if (promptLower.includes('potion') || promptLower.includes('bottle') || promptLower.includes('שיקוי')) {
            itemTypeEnhancement = 'glass potion bottle, swirling magical liquid inside, cork stopper, alchemical labels';
            compositionGuide = 'vertical bottle with liquid effects visible';
        } else if (promptLower.includes('scroll') || promptLower.includes('מגילה')) {
            itemTypeEnhancement = 'ancient spell scroll, weathered parchment, magical glowing text, wax seal';
            compositionGuide = 'partially unrolled showing mystical writing';
        } else if (promptLower.includes('cloak') || promptLower.includes('cape') || promptLower.includes('גלימ')) {
            itemTypeEnhancement = 'flowing magical cloak, rich fabric, ornate clasp, mystical shimmer';
            compositionGuide = 'draped to show fabric flow and magical effects';
        } else if (promptLower.includes('belt') || promptLower.includes('חגור')) {
            itemTypeEnhancement = 'enchanted leather belt, ornate buckle, magical pouches attached';
            compositionGuide = 'horizontal layout showing buckle detail';
        } else if (promptLower.includes('wand') || promptLower.includes('שרביט')) {
            itemTypeEnhancement = 'elegant magical wand, carved from rare wood, crystalline tip emanating power';
            compositionGuide = 'diagonal pose with magical particles at tip';
        }

        // Default enhancement if no type detected
        if (!itemTypeEnhancement) {
            itemTypeEnhancement = 'detailed fantasy item, magical craftsmanship, mystical properties';
            compositionGuide = 'centered product shot, clear details visible';
        }

        // === BACKGROUND CONFIGURATION ===
        // Smart background: ALWAYS use the sampled card color for better background removal
        let backgroundPrompt = '';
        console.log(`🎨 FLUX Background: styleOption=${styleOption}, colorName=${colorName}`);

        if (styleOption === 'no-background') {
            // STRONGEST possible white background instruction for FLUX
            backgroundPrompt = 'PURE WHITE BACKGROUND ONLY, solid white #FFFFFF background, product photography on seamless white paper, clean white studio backdrop, no environment, no scenery, white void background';
        } else if (styleOption === 'colored-background') {
            backgroundPrompt = `isolated on ${colorName} gradient background, soft ambient glow, ${colorName} color tones`;
        } else {
            // 'natural' mode - item in sharp focus, nature bokeh background
            backgroundPrompt = 'sharp focused item in foreground, beautiful blurred bokeh nature background, forest leaves and sunlight bokeh, shallow depth of field, dreamy soft background blur, natural outdoor lighting, fantasy forest atmosphere';
        }

        // === POSITIVE REINFORCEMENT (FLUX works better with positive descriptions) ===
        // Instead of "NO hands, NO people" - describe what we WANT to see
        // Note: FLUX ignores generic quality keywords like "masterpiece", "8k" etc.
        // Focus on specific descriptive details instead.
        const positiveReinforcement = 'isolated single item displayed alone, clean professional product render, complete item fully visible, sharp focus, centered composition';

        // === BUILD FINAL OPTIMIZED PROMPT ===
        // CRITICAL: Background instruction FIRST so FLUX prioritizes it
        // Structure: [Background FIRST] [Composition] [Style Prefix] [Subject/Item] ...
        const finalPrompt = [
            backgroundPrompt,  // FIRST - most important for background removal
            positiveReinforcement,
            compositionGuide,
            styleConfig.prefix,
            itemTypeEnhancement,
            elementalEnhancement,
            rarityQuality,
            visualPrompt,
            styleConfig.quality,
            styleConfig.suffix
        ].filter(Boolean).join(', ');

        console.log(`🎨 GeminiService (GetImg/FLUX): Style=${style}, Option=${styleOption}`);
        console.log(`📝 Optimized Prompt: "${finalPrompt.substring(0, 150)}..."`);

        let endpoint = 'https://api.getimg.ai/v1/flux-schnell/text-to-image';
        let body = {
            prompt: finalPrompt,
            response_format: 'b64'
        };

        if (model === 'getimg-seedream') {
            endpoint = 'https://api.getimg.ai/v1/seedream-v4/text-to-image';
        }

        // Use Worker proxy if not a direct API key
        const useWorkersForGetImg = !getImgApiKey.startsWith('key-');

        if (useWorkersForGetImg) {
            console.log("GeminiService: Using Worker for GetImg (Proxy Mode)");
            try {
                const data = await this.callViaWorker('getimg-generate', {
                    prompt: finalPrompt,
                    model: model,
                    response_format: 'b64'
                });

                if (data.image) {
                    const imageUrl = `data:image/jpeg;base64,${data.image}`;
                    const blob = await (await fetch(imageUrl)).blob();
                    // MEMORY LEAK FIX: Register blob URL for automatic cleanup
                    return BlobURLRegistry.register(URL.createObjectURL(blob));
                } else if (data.error) {
                    throw new Error(data.error);
                } else {
                    throw new Error("Worker did not return an image");
                }
            } catch (workerError) {
                console.error("GetImg Proxy Error:", workerError);
                throw workerError;
            }
        }

        console.log(`GeminiService: Generating with Getimg.ai (${model})`, endpoint);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getImgApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Getimg API Error: ${err.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const base64Image = data.image;
            const imageUrl = `data:image/jpeg;base64,${base64Image}`;

            const blob = await (await fetch(imageUrl)).blob();
            // MEMORY LEAK FIX: Register blob URL for automatic cleanup
            return BlobURLRegistry.register(URL.createObjectURL(blob));

        } catch (error) {
            console.error("GetImg Generation failed:", error);
            throw error;
        }
    }

    // Background generation using GetImg/FLUX - ENHANCED
    async generateCardBackground(theme, style = 'watercolor', getImgApiKey = '') {
        // Rich theme-specific descriptions optimized for FLUX natural language
        const themeConfigs = {
            'Fire': {
                colors: 'warm orange, deep red, molten gold',
                elements: 'flickering ember particles, smoldering edges, heat distortion waves, volcanic cracks with glowing lava',
                atmosphere: 'intense warmth radiating from fiery core, smoke wisps curling upward',
                texture: 'charred parchment with burnt edges, ash-stained surface'
            },
            'Nature': {
                colors: 'forest green, earthy brown, spring leaf gold',
                elements: 'twisting vine borders, delicate leaf patterns, blooming flowers, wooden bark texture',
                atmosphere: 'dappled sunlight through forest canopy, morning dew sparkles',
                texture: 'aged bark paper, pressed flower petals embedded, natural fiber weave'
            },
            'Arcane': {
                colors: 'mystical purple, ethereal blue, shimmering silver',
                elements: 'glowing arcane runes, swirling magical energy, constellation patterns, floating spell symbols',
                atmosphere: 'mysterious otherworldly glow, magical particles drifting',
                texture: 'ancient spellbook page, ink that shimmers with starlight'
            },
            'Divine': {
                colors: 'radiant gold, pure white, celestial cream',
                elements: 'angelic feather motifs, holy sunburst rays, sacred geometric patterns, blessed sigils',
                atmosphere: 'heavenly light beaming down, peaceful divine radiance',
                texture: 'illuminated manuscript, gold leaf accents, pristine vellum'
            },
            'Necrotic': {
                colors: 'sickly green, bone white, shadow purple, decay brown',
                elements: 'skull ornaments, skeletal hands reaching from edges, ghostly wisps, cracked tombstone texture',
                atmosphere: 'eerie fog rolling, haunting darkness creeping',
                texture: 'rotting parchment, dried blood stains, grave dirt smudges'
            },
            'Industrial': {
                colors: 'steel grey, copper bronze, iron black',
                elements: 'gear mechanisms, steam pipes, rivet patterns, cogwheel borders, mechanical components',
                atmosphere: 'steam clouds, industrial smoke, metallic gleam',
                texture: 'hammered metal plate, blueprint grid lines, oil-stained surface'
            },
            'Iron': {
                colors: 'dark iron, rust orange, forge red',
                elements: 'chain mail pattern, sword emblems, shield motifs, battle-worn scratches',
                atmosphere: 'forge fire glow, warrior spirit, battle-hardened',
                texture: 'weathered iron plate, sword nicks, chainmail imprint'
            },
            'Old Scroll': {
                colors: 'aged parchment tan, sepia brown, faded ink black',
                elements: 'torn edges, wax seal remnants, quill ink splatters, coffee ring stains',
                atmosphere: 'dusty library ambiance, ancient wisdom',
                texture: 'crinkled old paper, yellowed with age, handwritten notes in margins'
            },
            'Elemental': {
                colors: 'prismatic rainbow, shifting iridescent, cosmic multicolor',
                elements: 'swirling elemental chaos, fire ice lightning earth symbols, primal energy spirals',
                atmosphere: 'reality-warping energy, primordial power surge',
                texture: 'crystalline surface, merged elemental patterns'
            },
            // NEW THEMES
            'Ice': {
                colors: 'icy blue, frost white, glacial cyan, frozen silver',
                elements: 'frost crystals forming, ice shards, frozen patterns, snowflake decorations',
                atmosphere: 'freezing cold emanating, arctic chill, winter breath visible',
                texture: 'frosted glass surface, ice crystal patterns, frozen condensation'
            },
            'Lightning': {
                colors: 'electric blue, storm purple, crackling white, thunder yellow',
                elements: 'lightning bolts arcing, electric sparks, storm clouds, charged particles',
                atmosphere: 'electrified air, static charge buzzing, storm energy',
                texture: 'charged metallic surface, electric current patterns, plasma veins'
            },
            'Ocean': {
                colors: 'deep sea blue, turquoise, coral pink, pearl white',
                elements: 'waves and currents, seashell decorations, coral motifs, bubble patterns',
                atmosphere: 'underwater depth, oceanic serenity, marine mystique',
                texture: 'flowing water patterns, sea foam edges, wet surface reflections'
            },
            'Shadow': {
                colors: 'deep black, dark purple, midnight blue, void grey',
                elements: 'creeping shadows, dark tendrils, eclipse motifs, smoke wisps',
                atmosphere: 'consuming darkness, eerie void, shadowy presence',
                texture: 'dark velvet, smoke-stained, shadowy gradients'
            },
            'Celestial': {
                colors: 'cosmic purple, starlight silver, nebula pink, galaxy blue',
                elements: 'stars and constellations, moon phases, cosmic swirls, nebula patterns',
                atmosphere: 'infinite cosmos, celestial wonder, astral realm',
                texture: 'starfield background, cosmic dust, ethereal shimmer'
            },
            'Blood': {
                colors: 'deep crimson, dark red, blood orange, black',
                elements: 'blood splatter patterns, thorny vines, dripping edges, heart motifs',
                atmosphere: 'violent passion, dark sacrifice, primal power',
                texture: 'wet blood surface, dried stains, leather-bound'
            }
        };

        // Style-specific rendering approaches
        const styleConfigs = {
            'watercolor': 'soft watercolor painting style, flowing pigments, wet-on-wet technique, artistic brush strokes',
            'realistic': 'photorealistic texture, detailed material rendering, professional photography lighting',
            'oil': 'rich oil painting, thick brushwork, Renaissance master style, dramatic chiaroscuro',
            'dark_fantasy': 'dark gothic illustration, ominous atmosphere, Elden Ring aesthetic, gritty details',
            'sketch': 'detailed pencil sketch, graphite shading, technical illustration style',
            'woodcut': 'medieval woodcut print, black ink lines, vintage engraving style',
            // NEW STYLES
            'anime': 'anime style illustration, vibrant colors, clean lines, Studio Ghibli inspired, cel shading',
            'stained_glass': 'stained glass window art, vibrant colored glass panels, lead lines, cathedral style, luminous',
            'pixel': '16-bit pixel art style, retro video game aesthetic, limited color palette, clean pixels',
            'handdrawn': 'hand-drawn illustration, artist sketches, pencil and ink, personal artistic style'
        };

        const themeConfig = themeConfigs[theme] || themeConfigs['Old Scroll'];
        const styleDescription = styleConfigs[style] || styleConfigs['watercolor'];

        // Build prompt that matches the STRUCTURE of our ready-made backgrounds:
        // - Decorative ornate frame/border around edges
        // - Thematic corner pieces and edge decorations  
        // - Clear lighter center area (parchment/cream) for content
        // - Trading card proportions (2:3 vertical)
        const prompt = [
            // Art style first
            styleDescription,

            // CRITICAL STRUCTURE - Framed trading card design
            'FRAMED CARD DESIGN: ornate decorative border frame surrounding empty center',
            'fantasy trading card background with elaborate picture frame border',
            'thick ornamental frame edges with intricate carved details',

            // Corner flourishes (key visual element from gallery)
            'elaborate corner flourishes with symmetrical ornamental designs',
            'decorative corner pieces extending inward with filigree patterns',

            // CENTER - Bright and clean (most important for readability)
            'LARGE BRIGHT CENTER: cream colored or light parchment middle area',
            'center area is clean, empty, soft, and very light for text overlay',
            'vignette gradient effect from bright cream center to richly decorated dark edges',

            // THEME-specific decorations ONLY at frame edges
            `${theme} themed ornamental elements built INTO the frame border`,
            `${themeConfig.colors} color palette for the decorative frame`,
            themeConfig.elements + ' as frame decorations around edges only',
            themeConfig.atmosphere + ' emanating from frame',
            themeConfig.texture + ' texture on frame surface',

            // Technical specs
            'vertical portrait orientation, 2:3 aspect ratio, trading card proportions',
            'absolutely no text, no letters, no characters, no creatures, no faces',
            'center must remain completely empty and bright for content overlay'
        ].join(', ');

        console.log(`🎨 GeminiService: Generating ${theme} background in ${style} style`);
        console.log(`📝 Background Prompt: "${prompt.substring(0, 100)}..."`);

        // Use GetImg/FLUX via Worker proxy
        try {
            const body = {
                prompt: prompt,
                response_format: 'b64',
                width: 512,
                height: 768
            };

            console.log("GeminiService: Using Worker for Background generation");
            const data = await this.callViaWorker('getimg-generate', body);

            if (data.image) {
                const imageUrl = `data:image/jpeg;base64,${data.image}`;
                const blob = await (await fetch(imageUrl)).blob();
                // MEMORY LEAK FIX: Register blob URL for automatic cleanup
                return BlobURLRegistry.register(URL.createObjectURL(blob));
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                throw new Error("Worker did not return an image");
            }
        } catch (error) {
            console.error("Background generation failed:", error);
            throw error;
        }
    }

    // AI-powered layout analysis
    async analyzeCardLayout(cardImageBase64, contentInfo) {
        const prompt = `
You are a professional D&D card designer. Your goal is to achieve a CLEAN, BALANCED layout like a professional trading card.

IDEAL CARD LAYOUT (top to bottom):
1. RARITY - small text at very top center (נפוץ, נדיר, etc.)
2. TYPE - weapon/armor type below rarity (מגל (פשוט), חרב ארוכה (קרבי))
3. NAME - large bold title, centered (עוקץ האבן)
4. IMAGE - circular item image in the center, properly sized
5. CORE STATS - damage or AC below image (1d4 חותך (קל))
6. QUICK STATS - brief ability description (יוצר שטח קשה פעם ביום)
7. GOLD - coin value at bottom (50)

CARD CONTENT INFO:
- Item Name: "${contentInfo.name}" (${contentInfo.nameLength} characters)
- Item Type: "${contentInfo.type}"
- Has Item Image: ${contentInfo.hasImage}
- Has Stats (damage/AC): ${contentInfo.hasStats}
- Description Length: ${contentInfo.descriptionLength} words

CURRENT CARD IMAGE IS ATTACHED. Compare it to the ideal layout.

YOUR TASK:
Suggest Y-offset adjustments to achieve the ideal layout. Values are in PIXELS.
- NEGATIVE values = move element UP
- POSITIVE values = move element DOWN

OFFSET GUIDELINES:
- rarity: position at -200 to -100 (should be at TOP)
- type: position at -150 to -50 (below rarity)
- name: position at -50 to 50 (prominent title area)
- imageYOffset: -100 to 100 (center the image nicely)
- imageScale: 0.8 to 1.5 (size the image appropriately)
- coreStats: 600 to 750 (damage/AC below image, around 680 is good)
- stats: 700 to 800 (quick description below damage)
- gold: -20 to 20 (fine-tune bottom position)

FONT SIZE:
- nameSize: 40-70 (use smaller for longer names, default 56)

Return ONLY a JSON object (no markdown):
{
  "rarity": -100,
  "type": -38,
  "name": 0,
  "imageYOffset": 0,
  "imageScale": 1.0,
  "coreStats": 680,
  "stats": 0,
  "gold": 0,
  "nameSize": 56,
  "reasoning": "Brief explanation"
}
`;

        const parts = [
            { text: prompt },
            {
                inline_data: {
                    mime_type: "image/png",
                    data: cardImageBase64.replace(/^data:image\/\w+;base64,/, '')
                }
            }
        ];

        const payload = {
            contents: [{ parts }]
        };

        try {
            console.log("GeminiService: Analyzing card layout with AI Vision...");

            let data;
            if (this.useWorker) {
                data = await this.callViaWorker('gemini-generate', {
                    model: 'gemini-2.0-flash',
                    contents: payload.contents
                });
            } else {
                const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || "Layout analysis failed");
                }

                data = await response.json();
            }

            if (!data.candidates || !data.candidates[0]) {
                throw new Error("No layout suggestions returned");
            }

            const text = data.candidates[0].content.parts[0].text;
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const suggestions = JSON.parse(jsonStr);

            console.log("GeminiService: Layout suggestions:", suggestions);
            return suggestions;

        } catch (error) {
            console.error("Layout Analysis Error:", error);
            throw new Error("Failed to analyze card layout: " + error.message);
        }
    }
}

export default GeminiService;
