import { useState } from 'react';
import { THEME_CONFIGS } from './useBackgroundGenerator';
import { FLUX_STYLE_CONFIGS } from '../utils/config/styleConfigs';

const WORKER_URL = 'https://dnd-api-proxy.dingalin2000.workers.dev/';

type ImageStyle = keyof typeof FLUX_STYLE_CONFIGS;

interface ImageGenerationParams {
    visualPrompt: string;
    itemType?: string;
    itemSubtype?: string;
    abilityDesc?: string;
    itemName?: string; // Name of the item (e.g., "Lightning Hammer") for elemental extraction
    model?: 'flux' | 'z-image' | 'fal-zimage';
    style?: ImageStyle;
    backgroundOption?: 'natural' | 'colored' | 'no-background';
    theme?: string;
    rarity?: string;
    width?: number; // Optional width
    height?: number; // Optional height
    isCharacter?: boolean;
}

// ... (code omitted)



// Canvas-based fallback for removing white backgrounds
// Canvas-based fallback for removing white backgrounds with Soft Edges
const removeWhiteBackground = (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Soft Edge Parameters
            // Distance from White (0 = Pure White)
            // Increased thresholds to catch light gray backgrounds (not just pure white)
            // 40/80 - Catches light gray backgrounds while preserving most item details
            const transparencyThreshold = 40;
            const opacityThreshold = 80;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Calculate Euclidean distance from White (255, 255, 255)
                const dist = Math.sqrt(
                    Math.pow(255 - r, 2) +
                    Math.pow(255 - g, 2) +
                    Math.pow(255 - b, 2)
                );

                if (dist < transparencyThreshold) {
                    // Too close to white -> Transparent
                    data[i + 3] = 0;
                } else if (dist < opacityThreshold) {
                    // Semi-transparent edge (Feathering)
                    // Map distance [30...80] to Alpha [0...255]
                    const alpha = ((dist - transparencyThreshold) / (opacityThreshold - transparencyThreshold)) * 255;
                    data[i + 3] = alpha;
                }
                // Else: keep original alpha (usually 255)
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.onerror = (e) => reject(e);
        img.src = imageSrc;
    });
};

const removeHebrew = (text: string): string => {
    if (!text) return '';
    // Remove Hebrew characters and common Hebrew punctuation/parens
    // Range \u0590-\u05FF is Hebrew.
    return text.replace(/[\u0590-\u05FF]+/g, '')
        .replace(/\(\s*\)/g, '') // remove empty parens leftovers
        .replace(/\s+/g, ' ')
        .trim();
};

function getRarityEnhancement(rarity: string): string {
    const r = rarity || '';
    if (r === 'אגדי' || r === 'Legendary') {
        return 'legendary artifact, divine craftsmanship, intense magical aura, intricate gold details, masterpiece, epic scale, glowing with power';
    }
    if (r === 'נדיר מאוד' || r === 'Very Rare') {
        return 'exquisite craftsmanship, ornate design, strong magical glow, premium materials, very detailed';
    }
    if (r === 'נדיר' || r === 'Rare') {
        return 'fine craftsmanship, high quality materials, subtle magical shimmer, distinct design';
    }
    if (r === 'לא נפוץ' || r === 'Uncommon') {
        return 'good quality, functional design, well-made, standard magical item';
    }
    if (r === 'נפוץ' || r === 'Common') {
        return 'simple rustic design, worn texture, functional, common materials, no glow, plain appearance';
    }
    return '';
}

export function useImageGenerator() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateImage = async (
        params: ImageGenerationParams,
        password: string
    ): Promise<string> => {
        setIsGenerating(true);
        setError(null);

        try {
            const {
                visualPrompt,
                itemType = '',
                itemSubtype = '',
                abilityDesc = '',
                itemName = '',
                model = 'flux',
                style = 'realistic',
                backgroundOption = 'no-background',
                theme = 'Nature',
                rarity = '',
                width,
                height,
                isCharacter = false // Default to false for backward compatibility
            } = params;

            // Hebrew to English Type Mapping (must happen BEFORE removeHebrew!)
            const TYPE_MAP: Record<string, string> = {
                'נשק': 'Weapon',
                'שריון': 'Armor',
                'שיקוי': 'Potion',
                'טבעת': 'Ring',
                'פריט נפלא': 'Wondrous Item',
            };
            const englishType = TYPE_MAP[itemType] || removeHebrew(itemType) || '';

            // Clean inputs to ensure English only
            const cleanVisualPrompt = removeHebrew(visualPrompt) || 'fantasy magical item';
            const cleanSubtype = removeHebrew(itemSubtype);
            const cleanAbilityDesc = removeHebrew(abilityDesc);

            let styleConfig = FLUX_STYLE_CONFIGS[style];

            // Fix for studio artifacts: If 'no-background' is selected, override the 'realistic' style
            if (backgroundOption === 'no-background' && (style === 'realistic' || !style)) {
                styleConfig = {
                    primary: 'high quality 3D render, photorealistic digital art, sharp detail',
                    technique: 'neutral lighting, ambient occlusion, ray tracing, sharp focus, digital clear style',
                    finish: 'high resolution, 8k, unreal engine 5 style, clean finish'
                };
            }

            // Skip item enhancements for characters
            const itemTypeEnhancement = isCharacter ? '' : getItemTypeEnhancement(englishType, cleanSubtype, cleanVisualPrompt);
            const rarityEnhancement = isCharacter ? '' : getRarityEnhancement(rarity);

            // Combine item name, ability, and description for comprehensive elemental extraction
            const cleanItemName = removeHebrew(itemName);
            const combinedForElements = `${cleanItemName} ${cleanAbilityDesc} ${cleanVisualPrompt}`.toLowerCase();
            const elementalEnhancement = getElementalEnhancement(combinedForElements);
            const backgroundPrompt = getBackgroundPrompt(backgroundOption, theme, elementalEnhancement);

            // NOTE: Z-Image Turbo does NOT support negative prompts. 
            // All constraints must be explicit in the positive prompt.
            // WE MUST EXPLICITLY FORBID TEXT via positive descriptions of "clean", "object only".

            // Composition instructions based on background option
            let compositionInstructions: string;

            // Get theme config for styling (even for no-background)
            const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS['Nature'];
            const themeStyleForItem = `${themeConfig.elements}, ${themeConfig.colors} color accents on item`;

            if (isCharacter) {
                // === CHARACTER COMPOSITION ===
                compositionInstructions = 'character portrait, centered composition, high quality character art, expressive face, dramatic lighting, detailed background, masterpiece, best quality';
            } else if (backgroundOption === 'no-background') {
                // Pure white background for later removal, BUT item styled with theme elements
                compositionInstructions = `isolated single item floating in air, ${themeStyleForItem}, vibrant colorful item, extreme close up, item fills entire image frame, complete item fully visible, pure object photography, museum artifact display, clean product shot style, sharp focus on item, centered composition, 3D render style, clean edges, flat studio lighting, product photography, macro lens`;
            } else if (backgroundOption === 'natural') {
                // Natural themed background with bokeh effect
                compositionInstructions = 'extreme close up shot, macro photography, item prominently displayed in foreground, strong bokeh effect on background, shallow depth of field, beautiful blurred atmospheric background, item fills 80% of image frame, sharp focus on main item, dramatic lighting, cinematic composition, masterpiece, best quality, ultra detailed';
            } else {
                // Default composition (colored gradient or other)
                compositionInstructions = 'isolated single weapon floating in air, extreme close up, item fills 80% of image frame with minimal padding, complete item fully visible, pure object photography, still life product shot, museum display style, shot with 85mm lens at f/2.8, shallow depth of field, sharp focus on item, centered composition, masterpiece, best quality, ultra detailed';
            }

            // === BUILD FINAL PROMPT ===
            // Art style should be DOMINANT - appears at start, middle, and end for maximum influence
            const styleEmphasis = `((${styleConfig.primary})), ${styleConfig.technique}`;
            const styleReinforcement = `MUST be rendered in ${style.replace('_', ' ')} style`;

            let finalPromptString = '';

            if (isCharacter) {
                // Specialized Prompt Structure for Characters (Subject -> Style -> Composition -> Tech)
                finalPromptString = [
                    styleEmphasis,
                    `(${cleanVisualPrompt})`,
                    // Add subtle class-based details if needed here, but rely on Subject for now
                    compositionInstructions,
                    backgroundPrompt,
                    styleConfig.finish,
                    `${style.replace('_', ' ')} artwork`
                ].filter(Boolean).join(', ');
            } else {
                // Specialized Prompt Structure for Items
                finalPromptString = [
                    styleEmphasis,  // Style at START with double weight
                    `(${cleanVisualPrompt})`,
                    itemTypeEnhancement,
                    rarityEnhancement, // Add Rarity Influence
                    styleReinforcement,  // Remind the model of the style mid-prompt
                    compositionInstructions,
                    elementalEnhancement,
                    backgroundPrompt,
                    styleConfig.finish,  // Style finish at END
                    `${style.replace('_', ' ')} art style` // Final style reinforcement
                ].filter(Boolean).join(', ');
            }

            console.log('🎨 Image prompt:', finalPromptString.substring(0, 150) + '...');

            let action = 'getimg-generate';
            let requestData: any = {
                prompt: finalPromptString,
                model: 'flux',
                response_format: 'b64',
                width: width || 512, // Default to 512 if not provided
                height: height || 512
            };

            if (model === 'z-image') {
                action = 'kie-zimage';
                // Z-Image has a strict character limit - create a condensed prompt
                // Build background instruction based on option
                let bgInstruction = '';
                if (backgroundOption === 'no-background') {
                    bgInstruction = `pure white background only, bright white, item has ${themeStyleForItem}, no shadows, isolated floating item`;
                } else if (backgroundOption === 'natural') {
                    bgInstruction = `${backgroundPrompt}, bokeh effect, blurred atmospheric background`;
                }

                const shortPrompt = [
                    styleConfig.primary,
                    cleanVisualPrompt,
                    itemTypeEnhancement,
                    bgInstruction,
                    styleConfig.finish
                ].filter(Boolean).join(', ').substring(0, 500);
                requestData = { prompt: shortPrompt, aspect_ratio: '1:1' };
            } else if (model === 'fal-zimage') {
                action = 'fal-zimage';
                // Fal Z-Image also has limits - use condensed prompt
                // Build background instruction based on option
                let bgInstruction = '';
                if (backgroundOption === 'no-background') {
                    bgInstruction = `pure white background only, bright white, item styled with ${themeStyleForItem}, no shadows, no gradient, clean white backdrop, isolated floating item`;
                } else if (backgroundOption === 'natural') {
                    bgInstruction = `${backgroundPrompt}, strong bokeh effect, shallow depth of field`;
                }

                const shortPrompt = [
                    styleConfig.primary,
                    cleanVisualPrompt,
                    itemTypeEnhancement,
                    bgInstruction,
                    styleConfig.finish
                ].filter(Boolean).join(', ').substring(0, 800);
                requestData = {
                    prompt: shortPrompt,
                    image_size: { width: 1024, height: 1024 },
                    num_inference_steps: 8,
                    output_format: 'jpeg'
                };
            }

            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password,
                    action,
                    data: requestData
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Wrong password');
                }
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) throw new Error(data.error);
            if (!data.image) throw new Error('No image returned');

            const imageUrl = `data:image/jpeg;base64,${data.image}`;


            // Handle Background Removal
            if (backgroundOption === 'no-background') {
                console.log('✂️ Removing white background...');
                try {
                    const transparentUrl = await removeWhiteBackground(imageUrl);
                    console.log('✅ Background removal success');
                    setIsGenerating(false);
                    return transparentUrl;
                } catch (bgError) {
                    console.error('Background removal failed:', bgError);
                    setIsGenerating(false);
                    return imageUrl;
                }
            }

            setIsGenerating(false);
            return imageUrl;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to generate image';
            setError(errorMessage);
            setIsGenerating(false);
            throw new Error(errorMessage);
        }
    };

    return { generateImage, isGenerating, error };
}

// Helper to get type-specific prompt enhancements
function getItemTypeEnhancement(itemType: string, itemSubtype: string, visualPrompt: string): string {
    // Combine all inputs for keyword matching
    const promptLower = `${itemType} ${itemSubtype} ${visualPrompt}`.toLowerCase();

    let itemTypeEnhancement = '';
    let compositionGuide = '';

    // === MAGICAL ITEMS (priority) ===
    if (itemType.includes('Potion') || itemType.includes('שיקוי') || promptLower.includes('potion')) {
        itemTypeEnhancement = 'glass potion bottle with glowing liquid, cork stopper';
        compositionGuide = 'centered bottle, magical glow';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (itemType.includes('Ring') || itemType.includes('טבעת')) {
        itemTypeEnhancement = 'magical ring with gemstone, ornate metal band';
        compositionGuide = 'macro close-up';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('scroll') || promptLower.includes('מגילה')) {
        itemTypeEnhancement = 'ancient scroll with glowing runes, rolled parchment';
        compositionGuide = 'partially unrolled';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('wand') || promptLower.includes('שרביט')) {
        itemTypeEnhancement = 'magical wand, wooden with crystal tip, arcane glow';
        compositionGuide = 'diagonal pose';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('rod') || promptLower.includes('מוט')) {
        itemTypeEnhancement = 'magical rod, ornate metal cylinder, glowing runes';
        compositionGuide = 'vertical view';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('staff') && !promptLower.includes('quarter')) {
        itemTypeEnhancement = 'wizard staff, tall wooden pole, crystal headpiece, magical';
        compositionGuide = 'full length vertical';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('amulet') || promptLower.includes('קמע')) {
        itemTypeEnhancement = 'magical amulet pendant, glowing gem, ornate chain';
        compositionGuide = 'centered with chain';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('cloak') || promptLower.includes('גלימה')) {
        itemTypeEnhancement = 'flowing magical cloak, rich fabric, ornate clasp';
        compositionGuide = 'draped fabric';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('belt') || promptLower.includes('חגורה')) {
        itemTypeEnhancement = 'leather belt with magical buckle, pouches attached';
        compositionGuide = 'horizontal layout';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('boot') || promptLower.includes('מגפ')) {
        itemTypeEnhancement = 'leather boots with buckles, magical glow, fantasy footwear';
        compositionGuide = 'pair angled view';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('glove') || promptLower.includes('כפפ') || promptLower.includes('gauntlet')) {
        itemTypeEnhancement = 'armored gauntlets, metal plates, magical runes';
        compositionGuide = 'pair displayed';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('helmet') || promptLower.includes('קסדה')) {
        itemTypeEnhancement = 'ornate helmet, metal with visor, fantasy warrior';
        compositionGuide = 'front heroic angle';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('bag') || promptLower.includes('תיק')) {
        itemTypeEnhancement = 'leather bag with magical glow, adventurer pouch';
        compositionGuide = 'three-quarter view';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }
    if (promptLower.includes('gem') || promptLower.includes('אבן חן')) {
        itemTypeEnhancement = 'magical gemstone, faceted crystal, inner glow';
        compositionGuide = 'macro close-up';
        return `${itemTypeEnhancement}, ${compositionGuide}`;
    }

    // === CROSSBOWS - SHORT AND CLEAR ===
    if (promptLower.includes('hand crossbow') || promptLower.includes('רובה קשת יד')) {
        // Use "small compact" instead of "hand" or "one-handed" to avoid AI generating hands
        itemTypeEnhancement = 'small compact wooden crossbow, horizontal bow with string, portable size';
        compositionGuide = 'showing bow limbs';
    } else if (promptLower.includes('heavy crossbow') || promptLower.includes('רובה קשת כבד')) {
        itemTypeEnhancement = 'large wooden crossbow, thick bow limbs, winch mechanism';
        compositionGuide = 'showing bow and crank';
    } else if (promptLower.includes('light crossbow') || promptLower.includes('crossbow') || promptLower.includes('רובה קשת')) {
        itemTypeEnhancement = 'wooden crossbow, horizontal bow with string, fantasy weapon';
        compositionGuide = 'showing bow limbs';
    }

    // === BOWS ===
    else if (promptLower.includes('longbow') || promptLower.includes('קשת ארוכה')) {
        itemTypeEnhancement = 'tall longbow, curved wood, taut string';
        compositionGuide = 'full height visible';
    } else if (promptLower.includes('shortbow') || promptLower.includes('קשת קצרה')) {
        itemTypeEnhancement = 'compact shortbow, curved wood, hunting bow';
        compositionGuide = 'full bow visible';
    } else if (promptLower.includes('bow') || promptLower.includes('קשת')) {
        itemTypeEnhancement = 'recurve bow, curved wood, taut string';
        compositionGuide = 'full bow visible';
    }

    // === SWORDS ===
    else if (promptLower.includes('greatsword') || promptLower.includes('חרב דו-ידנית')) {
        itemTypeEnhancement = 'massive greatsword, long blade, crossguard hilt';
        compositionGuide = 'full length angled';
    } else if (promptLower.includes('longsword') || promptLower.includes('חרב ארוכה')) {
        itemTypeEnhancement = 'longsword, straight blade, crossguard hilt, medieval';
        compositionGuide = 'full length visible';
    } else if (promptLower.includes('shortsword') || promptLower.includes('חרב קצרה')) {
        itemTypeEnhancement = 'short sword, compact blade, gladius style';
        compositionGuide = 'showing blade';
    } else if (promptLower.includes('rapier') || promptLower.includes('סיף')) {
        itemTypeEnhancement = 'rapier, thin blade, ornate cup guard, fencing sword';
        compositionGuide = 'showing thin blade';
    } else if (promptLower.includes('scimitar') || promptLower.includes('חרב מעוקלת')) {
        itemTypeEnhancement = 'scimitar, curved blade, arabian sword';
        compositionGuide = 'showing curve';
    } else if (promptLower.includes('dagger') || promptLower.includes('פגיון')) {
        itemTypeEnhancement = 'dagger, short blade, sharp point, knife weapon';
        compositionGuide = 'centered blade';
    } else if (promptLower.includes('sword') || promptLower.includes('חרב')) {
        itemTypeEnhancement = 'fantasy sword, metal blade, ornate hilt';
        compositionGuide = 'full length';
    }

    // === AXES ===
    else if (promptLower.includes('greataxe') || promptLower.includes('גרזן דו-ידני')) {
        itemTypeEnhancement = 'massive greataxe, large double blade';
        compositionGuide = 'showing axe head';
    } else if (promptLower.includes('battleaxe') || promptLower.includes('גרזן קרב')) {
        itemTypeEnhancement = 'battle axe, single blade, wooden handle';
        compositionGuide = 'showing axe head';
    } else if (promptLower.includes('handaxe') || promptLower.includes('גרזן יד')) {
        itemTypeEnhancement = 'small hatchet, throwing axe, compact';
        compositionGuide = 'compact size';
    } else if (promptLower.includes('axe') || promptLower.includes('גרזן')) {
        itemTypeEnhancement = 'battle axe, curved blade, wooden handle';
        compositionGuide = 'showing axe head';
    }

    // === HAMMERS ===
    else if (promptLower.includes('maul') || promptLower.includes('פטיש קרב')) {
        itemTypeEnhancement = 'massive maul, large hammer head';
        compositionGuide = 'showing weight';
    } else if (promptLower.includes('warhammer') || promptLower.includes('קורנס')) {
        itemTypeEnhancement = 'warhammer, rectangular metal head, wooden handle';
        compositionGuide = 'showing hammer head';
    } else if (promptLower.includes('light hammer') || promptLower.includes('פטיש קל')) {
        itemTypeEnhancement = 'small throwing hammer, compact metal head';
        compositionGuide = 'showing small size';
    } else if (promptLower.includes('hammer') || promptLower.includes('פטיש')) {
        itemTypeEnhancement = 'war hammer, metal head, sturdy handle';
        compositionGuide = 'showing hammer head';
    }

    // === POLEARMS ===
    else if (promptLower.includes('pike') || promptLower.includes('רומח רגלים')) {
        itemTypeEnhancement = 'infantry pike, very long pole, small pointed head';
        compositionGuide = 'showing length';
    } else if (promptLower.includes('halberd') || promptLower.includes('הלבארד')) {
        itemTypeEnhancement = 'halberd, axe blade and spear point on pole';
        compositionGuide = 'showing head';
    } else if (promptLower.includes('glaive') || promptLower.includes('גלייב')) {
        itemTypeEnhancement = 'glaive, curved blade on long pole';
        compositionGuide = 'showing blade';
    } else if (promptLower.includes('lance') || promptLower.includes('רומח')) {
        itemTypeEnhancement = 'cavalry lance, long pointed pole';
        compositionGuide = 'full length';
    } else if (promptLower.includes('javelin') || promptLower.includes('כידון')) {
        itemTypeEnhancement = 'javelin, throwing spear, wooden shaft, metal tip';
        compositionGuide = 'full length angled';
    } else if (promptLower.includes('spear') || promptLower.includes('חנית')) {
        itemTypeEnhancement = 'spear, wooden pole, pointed metal head';
        compositionGuide = 'showing point';
    } else if (promptLower.includes('trident') || promptLower.includes('קלשון')) {
        itemTypeEnhancement = 'trident, three-pronged spear head';
        compositionGuide = 'showing prongs';
    }

    // === OTHER MELEE ===
    else if (promptLower.includes('mace') || promptLower.includes('אלת קרב')) {
        itemTypeEnhancement = 'flanged mace, round metal head with ridges';
        compositionGuide = 'showing head';
    } else if (promptLower.includes('morningstar') || promptLower.includes('כוכב שחר')) {
        itemTypeEnhancement = 'morningstar, spiked metal ball on handle';
        compositionGuide = 'showing spikes';
    } else if (promptLower.includes('flail') || promptLower.includes('מורג')) {
        itemTypeEnhancement = 'flail, spiked ball on chain, swinging weapon';
        compositionGuide = 'showing chain';
    } else if (promptLower.includes('war pick') || promptLower.includes('מכוש')) {
        itemTypeEnhancement = 'war pick, pointed metal spike, pickaxe weapon';
        compositionGuide = 'showing spike';
    } else if (promptLower.includes('quarterstaff') || promptLower.includes('מטה')) {
        itemTypeEnhancement = 'wooden quarterstaff, simple long pole, monk weapon';
        compositionGuide = 'full length';
    } else if (promptLower.includes('club') || promptLower.includes('אלה')) {
        itemTypeEnhancement = 'wooden club, thick heavy stick, primitive weapon';
        compositionGuide = 'showing weight';
    } else if (promptLower.includes('sickle') || promptLower.includes('מגל')) {
        itemTypeEnhancement = 'sickle, curved blade, wooden handle';
        compositionGuide = 'showing curve';
    }

    // === RANGED ===
    else if (promptLower.includes('sling') || promptLower.includes('קלע')) {
        itemTypeEnhancement = 'leather sling, pouch with cords, stone throwing';
        compositionGuide = 'showing pouch';
    } else if (promptLower.includes('dart') || promptLower.includes('חץ הטלה')) {
        itemTypeEnhancement = 'throwing dart, small metal tip, fletching';
        compositionGuide = 'showing point';
    } else if (promptLower.includes('blowgun') || promptLower.includes('נשיפה')) {
        itemTypeEnhancement = 'blowgun, long bamboo tube, tribal weapon';
        compositionGuide = 'horizontal';
    } else if (promptLower.includes('net') || promptLower.includes('רשת')) {
        itemTypeEnhancement = 'throwing net, rope mesh, weighted edges';
        compositionGuide = 'showing mesh';
    }

    // === ARMOR - SHORT AND FOCUSED ===
    else if (promptLower.includes('padded') || promptLower.includes('מרופד')) {
        itemTypeEnhancement = 'quilted cloth gambeson, padded fabric vest, stitched layers';
        compositionGuide = 'showing fabric texture';
    } else if (promptLower.includes('studded') || promptLower.includes('מחוזק')) {
        itemTypeEnhancement = 'studded leather armor, metal rivets on leather vest';
        compositionGuide = 'showing studs';
    } else if (promptLower.includes('breastplate') || promptLower.includes('שריון חזה')) {
        itemTypeEnhancement = 'metal breastplate, polished chest armor, single piece';
        compositionGuide = 'front view';
    } else if (promptLower.includes('half plate') || promptLower.includes('חצי')) {
        itemTypeEnhancement = 'half plate armor, metal chest and shoulders only';
        compositionGuide = 'front view';
    } else if (promptLower.includes('ring mail') || promptLower.includes('טבעות')) {
        itemTypeEnhancement = 'ring mail armor, metal rings sewn on leather vest';
        compositionGuide = 'showing rings pattern';
    } else if (promptLower.includes('splint') || promptLower.includes('רצועות')) {
        itemTypeEnhancement = 'splint armor, vertical metal strips on leather';
        compositionGuide = 'showing strips';
    } else if (promptLower.includes('chain') || promptLower.includes('שרשראות')) {
        itemTypeEnhancement = 'chainmail armor, interlocking metal rings, mail shirt';
        compositionGuide = 'showing ring pattern';
    } else if (promptLower.includes('hide') || promptLower.includes('פרווה')) {
        itemTypeEnhancement = 'hide armor, thick animal fur vest, primitive';
        compositionGuide = 'showing fur texture';
    } else if (promptLower.includes('leather') || promptLower.includes('עור')) {
        itemTypeEnhancement = 'leather armor vest, stitched panels, adventurer gear';
        compositionGuide = 'front view';
    } else if (promptLower.includes('scale') || promptLower.includes('קשקשים')) {
        itemTypeEnhancement = 'scale mail armor, overlapping metal scales on vest';
        compositionGuide = 'showing scales pattern';
    } else if (promptLower.includes('plate') || promptLower.includes('לוחות')) {
        itemTypeEnhancement = 'full plate armor, polished metal suit, knight armor';
        compositionGuide = 'front view';
    } else if (promptLower.includes('shield') || promptLower.includes('מגן')) {
        itemTypeEnhancement = 'battle shield, heraldic emblem, reinforced rim';
        compositionGuide = 'front view';
    }

    // Default
    if (!itemTypeEnhancement) {
        return 'detailed fantasy item, magical craftsmanship, centered product shot';
    }

    return `${itemTypeEnhancement}, ${compositionGuide}`;
}

function getElementalEnhancement(combinedText: string): string {
    const text = combinedText.toLowerCase();
    const effects: string[] = [];

    // Fire/Flame related
    if (text.includes('fire') || text.includes('אש') || text.includes('flame') || text.includes('להבה') ||
        text.includes('burn') || text.includes('שריפה') || text.includes('inferno') || text.includes('blaze')) {
        effects.push('glowing with fire, flames dancing, orange and red glow, ember particles');
    }

    // Ice/Frost related
    if (text.includes('ice') || text.includes('קרח') || text.includes('frost') || text.includes('כפור') ||
        text.includes('cold') || text.includes('freeze') || text.includes('glacial') || text.includes('winter')) {
        effects.push('covered in frost, ice crystals forming, blue cold glow, freezing mist');
    }

    // Lightning/Storm related
    if (text.includes('lightning') || text.includes('ברק') || text.includes('thunder') || text.includes('רעם') ||
        text.includes('storm') || text.includes('סערה') || text.includes('electric') || text.includes('חשמל') ||
        text.includes('spark') || text.includes('ניצוץ') || text.includes('shock')) {
        effects.push('crackling lightning, electric arcs, blue-white sparks, electricity dancing along surface');
    }

    // Poison/Toxic related
    if (text.includes('poison') || text.includes('רעל') || text.includes('toxic') || text.includes('venom') ||
        text.includes('acid') || text.includes('חומצה')) {
        effects.push('dripping poison, green toxic glow, acidic bubbles, venomous aura');
    }

    // Shadow/Dark related
    if (text.includes('shadow') || text.includes('צל') || text.includes('dark') || text.includes('חושך') ||
        text.includes('abyss') || text.includes('void') || text.includes('necrotic') || text.includes('מוות')) {
        effects.push('wreathed in shadows, dark wisps, purple-black aura, ethereal darkness');
    }

    // Holy/Divine related
    if (text.includes('holy') || text.includes('קדוש') || text.includes('divine') || text.includes('אלוהי') ||
        text.includes('blessed') || text.includes('מבורך') || text.includes('radiant') || text.includes('sacred')) {
        effects.push('radiating holy light, golden divine glow, blessed aura, angelic radiance');
    }

    // Nature/Life related
    if (text.includes('nature') || text.includes('טבע') || text.includes('life') || text.includes('חיים') ||
        text.includes('druid') || text.includes('growth') || text.includes('forest') || text.includes('יער')) {
        effects.push('glowing green energy, vines and leaves growing, natural life force');
    }

    // Water/Ocean related
    if (text.includes('water') || text.includes('מים') || text.includes('ocean') || text.includes('ים') ||
        text.includes('wave') || text.includes('גל') || text.includes('aqua') || text.includes('tide')) {
        effects.push('water droplets floating, blue aquatic glow, ocean mist');
    }

    // Wind/Air related
    if (text.includes('wind') || text.includes('רוח') || text.includes('air') || text.includes('אוויר') ||
        text.includes('gust') || text.includes('tornado') || text.includes('cyclone')) {
        effects.push('swirling wind currents, air vortex visible, windswept effect');
    }

    // Arcane/Magic related
    if (text.includes('arcane') || text.includes('קסם') || text.includes('magic') || text.includes('מאגיה') ||
        text.includes('mystic') || text.includes('enchant') || text.includes('כישוף') || text.includes('spell')) {
        effects.push('glowing arcane runes, magical purple energy, mystical sparkles');
    }

    // Blood related
    if (text.includes('blood') || text.includes('דם') || text.includes('vampir') || text.includes('ערפד')) {
        effects.push('dripping blood red energy, crimson glow, sanguine aura');
    }

    // Celestial/Star related
    if (text.includes('star') || text.includes('כוכב') || text.includes('celestial') || text.includes('שמימי') ||
        text.includes('cosmic') || text.includes('galaxy') || text.includes('astral')) {
        effects.push('starlight emanating, cosmic sparkles, celestial glow');
    }

    // Return combined effects or empty string
    return effects.join(', ');
}



function getBackgroundPrompt(option: string, theme: string = 'Nature', elementalEnhancement: string = ''): string {
    if (option === 'no-background') {
        return 'pure white background, solid bright white, completely flat white backdrop, no shadows, no gradient, no gray, isolated item on white';
    }

    if (option === 'colored') {
        // For colored gradient, add subtle elemental glow if present
        if (elementalEnhancement) {
            return `soft gradient background, ambient glow, ${elementalEnhancement}`;
        }
        return 'soft gradient background, ambient glow';
    }

    const config = THEME_CONFIGS[theme] || THEME_CONFIGS['Nature'];

    // Construct a background prompt that matches the theme's atmosphere
    // Include elemental enhancement for natural backgrounds too
    const basePrompt = `blurred background of ${config.atmosphere}, ${config.colors} ambient lighting, ${config.elements} in distance, strong bokeh effect, shallow depth of field, sharp focus on main item only`;

    if (elementalEnhancement) {
        return `${basePrompt}, ${elementalEnhancement} visible in atmosphere`;
    }

    return basePrompt;
}
