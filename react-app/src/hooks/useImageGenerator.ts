import { useState } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { THEME_CONFIGS } from './useBackgroundGenerator';

const WORKER_URL = 'https://dnd-api-proxy.dingalin2000.workers.dev/';

// Strengthened style configs - synchronized with useBackgroundGenerator for consistency
const FLUX_STYLE_CONFIGS = {
    realistic: {
        primary: 'ultra-realistic photographic render, highly detailed photograph, professional studio shot',
        technique: 'professional photography lighting, cinematic 4k rendering, sharp focus, shallow depth of field',
        finish: 'commercial product photography quality, 8k resolution, hyperrealistic detail'
    },
    watercolor: {
        primary: 'beautiful watercolor painting artwork, traditional watercolor illustration, hand-painted watercolor art',
        technique: 'wet-on-wet watercolor technique, soft color bleeding edges, visible watercolor pigment granulation, loose flowing brushstrokes',
        finish: 'art paper texture visible, dreamy soft aesthetic, artistic watercolor finish, traditional painting quality'
    },
    oil: {
        primary: 'classical oil painting artwork, traditional oil on canvas, museum quality oil painting masterpiece',
        technique: 'thick impasto brushstrokes, visible oil paint texture, rich color glazing layers, dramatic chiaroscuro lighting',
        finish: 'gallery masterpiece quality, baroque decorative details, canvas texture visible, old masters painting style'
    },
    sketch: {
        primary: 'detailed pencil sketch illustration, hand-drawn graphite artwork, professional sketch drawing',
        technique: 'graphite pencil on textured paper, cross-hatching shading technique, varied line weights, artistic hand-drawn look',
        finish: 'monochrome grayscale, paper grain texture, concept art sketch style, clean precise linework'
    },
    dark_fantasy: {
        primary: 'dark fantasy digital artwork, gothic fantasy illustration, grimdark aesthetic, dark souls art style',
        technique: 'dramatic rim lighting, deep shadows, ominous atmosphere, moody color grading, dark and gritty',
        finish: 'high contrast, desaturated colors with accent highlights, Elden Ring art style, dark fantasy masterpiece'
    },
    epic_fantasy: {
        primary: 'medieval woodcut print artwork, vintage woodblock illustration, old book engraving style, epic fantasy',
        technique: 'heroic composition, carved wood texture lines, black ink on paper, hand-carved appearance',
        finish: 'antique aged paper, historical artwork style, epic legendary quality, fantasy book illustration'
    },
    anime: {
        primary: 'anime style illustration, Japanese anime artwork, manga art style drawing, high quality anime',
        technique: 'clean cel shading, bold black outlines, flat color areas with subtle gradients, anime aesthetic',
        finish: 'vibrant saturated colors, Studio Ghibli inspired, professional anime illustration, crisp clean finish'
    },
    pixel: {
        primary: '16-bit pixel art style, retro video game aesthetic, SNES game graphics, colorful pixel art',
        technique: 'blocky square pixels visible, pixelated image, chunky pixel blocks, retro gaming sprite',
        finish: 'classic retro Nintendo aesthetic, visible pixel grid, no smooth edges, nostalgic video game art'
    },
    stained_glass: {
        primary: 'stained glass window artwork, cathedral glass art, Art Nouveau glass design',
        technique: 'bold black lead lines separating colored sections, translucent glass effect, geometric color panels',
        finish: 'luminous backlit appearance, vibrant jewel tones, Gothic cathedral aesthetic, beautiful glass art'
    },
    simple_icon: {
        primary: 'flat 2D vector design, minimalist icon design, simple flat illustration, clean bold shapes',
        technique: 'completely flat solid colors only, zero gradients, zero shading, bold simple geometric shapes',
        finish: 'mobile game UI style, clean geometric silhouette, high contrast, minimal detail, vector art'
    },
    ink_drawing: {
        primary: 'black ink illustration, hand-drawn pen and ink artwork, old fantasy book illustration, detailed ink art',
        technique: 'fine black ink lines, crosshatch shading, hand-drawn imperfections, quill pen strokes, detailed linework',
        finish: 'vintage Dungeons and Dragons manual style, 1980s fantasy book illustration, black ink on parchment paper'
    },
    silhouette: {
        primary: 'heraldic emblem design, coat of arms symbol, medieval heraldry, bold silhouette artwork',
        technique: 'solid black graphic elements, clean iconic shapes, bold symbolic design, flat graphic emblem',
        finish: 'royal crest style, knightly insignia, medieval guild symbol, stark black silhouette'
    },
    synthwave: {
        primary: 'synthwave neon artwork, retrowave 80s aesthetic, cyberpunk neon style, retro futuristic',
        technique: 'glowing neon lights, hot pink and cyan color scheme, chrome reflections, neon glow effects',
        finish: 'retro futuristic atmosphere, vaporwave aesthetic, glowing edges, 1980s sci-fi movie poster style'
    },
    comic_book: {
        primary: 'EXAGGERATED comic book illustration, bold thick outlines, vintage American comic book style, hand-drawn comic art',
        technique: 'heavy black ink outlines, halftone dot pattern shading, vibrant pop art colors, dramatic ink shadows, Ben-Day dots texture',
        finish: 'classic superhero comic aesthetic, Marvel/DC comic book quality, bold colorful comic illustration, vintage comic book finish'
    },
    manga_action: {
        primary: 'manga action style illustration, energetic speed lines background, anime character art, Japanese manga',
        technique: 'bold black ink outlines, dynamic action lines radiating, comic sunburst effect, cel shaded elements',
        finish: 'high energy manga illustration, dramatic anime reveal style, Japanese comic aesthetic, dynamic action pose'
    },
    vintage_etching: {
        primary: 'antique Victorian book illustration, detailed black and white engraving, pen and ink drawing, vintage etching',
        technique: 'intricate cross-hatching shading, fine black ink linework, classic storybook illustration style',
        finish: 'monochrome black ink on white paper, vintage engraving aesthetic, medieval grimoire illustration, 19th century book art'
    },
    premium_fantasy: {
        primary: 'premium fantasy object illustration, ornate golden details, luxurious D&D concept art',
        technique: 'intricate metallic gold filigree, embossed leather texture, ancient artifact aesthetic, jeweled accents',
        finish: 'museum quality fantasy art, Elder Scrolls Legends aesthetic, Hearthstone art style, rich warm tones'
    }
};

type ImageStyle = keyof typeof FLUX_STYLE_CONFIGS;

interface ImageGenerationParams {
    visualPrompt: string;
    itemType?: string;
    itemSubtype?: string;
    abilityDesc?: string;
    model?: 'flux' | 'z-image' | 'fal-zimage';
    style?: ImageStyle;
    backgroundOption?: 'natural' | 'colored' | 'no-background';
    theme?: string;
}

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
            // NEWER: 5/25 - Balanced. Catches compression artifacts but preserves most silver details.
            const transparencyThreshold = 5;
            const opacityThreshold = 25;

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
                model = 'flux',
                style = 'realistic',
                backgroundOption = 'no-background',
                theme = 'Nature'
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

            const itemTypeEnhancement = getItemTypeEnhancement(englishType, cleanSubtype, cleanVisualPrompt);
            const elementalEnhancement = getElementalEnhancement(cleanAbilityDesc);
            const backgroundPrompt = getBackgroundPrompt(backgroundOption, theme);

            // NOTE: Z-Image Turbo does NOT support negative prompts. 
            // All constraints must be explicit in the positive prompt.
            // WE MUST EXPLICITLY FORBID TEXT via positive descriptions of "clean", "object only".

            // Composition instructions - Using positive language only (FLUX doesn't support negative prompts)
            let compositionInstructions = 'isolated single weapon floating in air, item fills two-thirds of image frame with generous space around, complete item fully visible, pure object photography, still life product shot, museum display style, shot with 85mm lens at f/2.8, shallow depth of field, sharp focus on item, centered composition, masterpiece, best quality, ultra detailed';

            if (backgroundOption === 'no-background') {
                compositionInstructions = 'isolated single item floating in air, vibrant colorful item, item fills two-thirds of image frame, complete item fully visible, pure object photography, museum artifact display, clean product shot style, sharp focus on item, centered composition, 3D render style, clean edges, flat studio lighting, product photography, item displayed on invisible stand';
            }

            // === BUILD FINAL PROMPT ===
            // Art style should be DOMINANT - appears at start, middle, and end for maximum influence
            const styleEmphasis = `((${styleConfig.primary})), ${styleConfig.technique}`;
            const styleReinforcement = `MUST be rendered in ${style.replace('_', ' ')} style`;

            const finalPrompt = [
                styleEmphasis,  // Style at START with double weight
                `(${cleanVisualPrompt})`,
                itemTypeEnhancement,
                styleReinforcement,  // Remind the model of the style mid-prompt
                compositionInstructions,
                elementalEnhancement,
                backgroundPrompt,
                styleConfig.finish,  // Style finish at END
                `${style.replace('_', ' ')} art style` // Final style reinforcement
            ].filter(Boolean).join(', ');

            console.log('🎨 Image prompt:', finalPrompt.substring(0, 150) + '...');

            let action = 'getimg-generate';
            let requestData: any = {
                prompt: finalPrompt,
                model: 'flux',
                response_format: 'b64'
            };

            if (model === 'z-image') {
                action = 'kie-zimage';
                requestData = { prompt: finalPrompt, aspect_ratio: '1:1' };
            } else if (model === 'fal-zimage') {
                action = 'fal-zimage';
                requestData = {
                    prompt: finalPrompt,
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
                console.log('✂️ Removing background using AI...');
                try {
                    // 1. Fetch the image to get a Blob because imgly needs Blob/URL
                    const imageResponse = await fetch(imageUrl);
                    const imageBlob = await imageResponse.blob();

                    // 2. Run background removal
                    const blob = await removeBackground(imageBlob);

                    // 3. Create object URL for the result
                    const transparentUrl = URL.createObjectURL(blob);

                    setIsGenerating(false);
                    return transparentUrl;
                } catch (bgError) {
                    console.error('Background removal failed:', bgError);
                    console.log('⚠️ AI Removal failed, trying simple white removal fallback check...');

                    try {
                        const fallbackUrl = await removeWhiteBackground(imageUrl);
                        console.log('✅ Fallback removal success');
                        setIsGenerating(false);
                        return fallbackUrl;
                    } catch (fbError) {
                        console.error('Fallback removal failed:', fbError);
                        setIsGenerating(false);
                        return imageUrl;
                    }
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

function getElementalEnhancement(abilityDesc: string): string {
    const desc = abilityDesc.toLowerCase();

    if (desc.includes('fire') || desc.includes('אש')) {
        return 'glowing with fire, flames dancing, orange glow';
    }
    if (desc.includes('ice') || desc.includes('קרח')) {
        return 'covered in frost, ice crystals, blue glow';
    }
    if (desc.includes('lightning') || desc.includes('ברק')) {
        return 'crackling lightning, electric arcs, blue sparks';
    }
    if (desc.includes('poison') || desc.includes('רעל')) {
        return 'dripping poison, green glow, toxic';
    }
    if (desc.includes('shadow') || desc.includes('צל')) {
        return 'wreathed in shadows, dark wisps, purple-black aura';
    }
    if (desc.includes('holy') || desc.includes('divine') || desc.includes('קדוש')) {
        return 'radiating holy light, golden glow, blessed';
    }

    return '';
}


function getBackgroundPrompt(option: string, theme: string = 'Nature'): string {
    if (option === 'no-background') {
        return 'solid pure white background (hex color #FFFFFF), flat lighting, no shadows, no gradient, isolated, high contrast';
    }

    if (option === 'colored') {
        return 'soft gradient background, ambient glow';
    }

    const config = THEME_CONFIGS[theme] || THEME_CONFIGS['Nature'];

    // Construct a background prompt that matches the theme's atmosphere but keeps it blurred/secondary
    // to the main item
    return `blurred background of ${config.atmosphere}, ${config.colors} ambient lighting, ${config.elements} in distance, strong bokeh effect, shallow depth of field, sharp focus on main item only`;
}
