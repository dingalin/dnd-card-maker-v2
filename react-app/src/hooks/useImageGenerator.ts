import { useState } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { THEME_CONFIGS } from './useBackgroundGenerator';

const WORKER_URL = 'https://dnd-api-proxy.dingalin2000.workers.dev/';

// All 13 image styles from original app
const FLUX_STYLE_CONFIGS = {
    realistic: {
        primary: 'photorealistic, highly detailed photograph',
        technique: 'professional photography, studio lighting, sharp focus',
        finish: 'high resolution, 8k quality, professional product shot'
    },
    watercolor: {
        primary: 'watercolor painting style',
        technique: 'soft washes, flowing colors, traditional watercolor technique',
        finish: 'artistic watercolor illustration, paper texture'
    },
    oil: {
        primary: 'oil painting style',
        technique: 'thick brushstrokes, rich colors, classical oil painting technique',
        finish: 'museum quality oil painting, canvas texture'
    },
    sketch: {
        primary: 'pencil sketch, hand-drawn',
        technique: 'graphite shading, sketch lines, artistic drawing',
        finish: 'detailed pencil sketch on paper'
    },
    dark_fantasy: {
        primary: 'dark fantasy art style',
        technique: 'gothic atmosphere, dramatic shadows, ominous mood',
        finish: 'dark fantasy masterpiece, trending on artstation'
    },
    epic_fantasy: {
        primary: 'epic fantasy art style',
        technique: 'heroic composition, vibrant colors, grand scale',
        finish: 'epic fantasy illustration, legendary quality'
    },
    anime: {
        primary: 'anime style, manga art',
        technique: 'clean cel shading, bold lines, anime aesthetic',
        finish: 'high quality anime illustration'
    },
    pixel: {
        primary: '16-bit pixel art style',
        technique: 'retro gaming aesthetic, pixel-perfect details',
        finish: 'crisp pixel art, nostalgic'
    },
    stained_glass: {
        primary: 'stained glass window style',
        technique: 'vibrant colored glass segments, lead lines, light transmission',
        finish: 'beautiful stained glass artwork'
    },
    simple_icon: {
        primary: 'flat icon design, minimalist',
        technique: 'simple shapes, solid colors, clean design',
        finish: 'professional flat icon, vector style'
    },
    ink_drawing: {
        primary: 'ink drawing, pen and ink',
        technique: 'bold black lines, crosshatching, traditional ink work',
        finish: 'detailed ink illustration'
    },
    silhouette: {
        primary: 'silhouette, black shadow outline',
        technique: 'stark contrast, dramatic shape, minimalist',
        finish: 'clean silhouette design'
    },
    synthwave: {
        primary: 'synthwave aesthetic, retro futuristic',
        technique: 'neon colors, grid lines, 80s aesthetic',
        finish: 'vibrant synthwave art, retrowave style'
    },
    comic_book: {
        primary: 'exaggerated comic book style, highly stylized',
        technique: 'bold thick outlines, dynamic shading, exaggerated proportions, vibrant comic colors',
        finish: 'classic comic book action, hand-drawn comic art'
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

            // Clean inputs to ensure English only
            const cleanVisualPrompt = removeHebrew(visualPrompt) || 'fantasy magical item';
            const cleanType = removeHebrew(itemType);
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

            const itemTypeEnhancement = getItemTypeEnhancement(cleanType, cleanSubtype, cleanVisualPrompt);
            const elementalEnhancement = getElementalEnhancement(cleanAbilityDesc);
            const backgroundPrompt = getBackgroundPrompt(backgroundOption, theme);

            // NOTE: Z-Image Turbo does NOT support negative prompts. 
            // All constraints must be explicit in the positive prompt.
            // WE MUST EXPLICITLY FORBID TEXT via positive descriptions of "clean", "object only".

            // Composition instructions - Strengthened to avoid text
            let compositionInstructions = 'isolated single item floating in air, item fills two-thirds of image frame with generous space around, complete item fully visible, no text, no words, no letters, no label, no signature, shot with 85mm lens at f/2.8, shallow depth of field, sharp focus on item, centered composition, masterpiece, best quality, ultra detailed';

            if (backgroundOption === 'no-background') {
                compositionInstructions = 'isolated single item floating in air, item fills two-thirds of image frame, complete item fully visible, no text, no writing, no watermark, sharp focus on item, centered composition, 3D render style, clean edges, flat studio lighting, no cast shadows';
            }

            const finalPrompt = [
                styleConfig.primary,
                styleConfig.technique,
                `(${cleanVisualPrompt})`, // boost visual prompt weight slightly
                itemTypeEnhancement,
                compositionInstructions,
                elementalEnhancement,
                backgroundPrompt,
                styleConfig.finish
            ].filter(Boolean).join(', ');

            console.log('🎨 Image prompt:', finalPrompt.substring(0, 100) + '...');

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

    // WEAPONS - Keyword Matching (prioritize specific subtypes logic first)
    if (promptLower.includes('axe') || promptLower.includes('גרזן') || promptLower.includes('hatchet')) {
        itemTypeEnhancement = 'formidable battle axe weapon, heavy curved axe head, thick wooden or metal handle, single or double-headed axe design, chopping weapon';
        compositionGuide = 'angled view showing the distinctive axe head shape';
    } else if (promptLower.includes('sword') || promptLower.includes('blade') || promptLower.includes('חרב')) {
        itemTypeEnhancement = 'ornate fantasy sword, detailed hilt and guard, sharp glinting blade edge, intricate engravings';
        compositionGuide = 'full weapon visible from pommel to tip, angled hero pose';
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
    } else if (promptLower.includes('hammer') || promptLower.includes('פטיש') || promptLower.includes('warhammer')) {
        // HAMMER/WARHAMMER - rectangular/square head like Thor's hammer
        itemTypeEnhancement = 'heavy war hammer weapon, large rectangular metal striking head, thick sturdy handle, powerful crushing weapon, Thor-like hammer design';
        compositionGuide = 'showing the weight and impact potential of the rectangular head';
    } else if (promptLower.includes('mace') || promptLower.includes('אלה') || promptLower.includes('אלת')) {
        // MACE - round/spherical head with flanges or spikes, shorter handle
        itemTypeEnhancement = 'medieval flanged mace weapon, spherical bulbous metal head with protruding flanges, short sturdy grip handle, crushing bludgeoning weapon, morning star style';
        compositionGuide = 'showing the round flanged head with spikes or ridges';
    } else if (promptLower.includes('club')) {
        itemTypeEnhancement = 'primitive wooden club, thick heavy end, simple bludgeoning weapon';
        compositionGuide = 'showing the thick weighted end';
    } else if (promptLower.includes('sickle') || promptLower.includes('מגל')) {
        itemTypeEnhancement = 'curved harvesting sickle, sharp crescent blade, wooden handle, druidic tool';
        compositionGuide = 'showing the curved blade arc and edge';
    } else if (promptLower.includes('crossbow') || promptLower.includes('arbalet') || promptLower.includes('קשתון')) {
        itemTypeEnhancement = 'mechanical crossbow, intricate trigger mechanism, loaded bolt';
        compositionGuide = 'three-quarter view showing mechanism detail';
    } else if (promptLower.includes('blowgun') || promptLower.includes('נשיפה') || promptLower.includes('dart') || promptLower.includes('חיצים')) {
        itemTypeEnhancement = 'primitive blowgun hunting weapon, long hollow bamboo tube, tribal decorations, small poison darts nearby, simple ranged weapon';
        compositionGuide = 'horizontal layout showing full length of tube, item displayed on stand, product photography';
    }

    // POTIONS - Enhanced Check (Explicitly check itemType too)
    else if (promptLower.includes('potion') || promptLower.includes('bottle') || promptLower.includes('שיקוי') || promptLower.includes('vial') || promptLower.includes('flask')) {
        itemTypeEnhancement = 'glass potion bottle, cork stopper, intricate glasswork, swirling magical vibrant liquid inside, alchemical fantasy item';
        compositionGuide = 'vertical bottle with liquid glowing effects visible, macro photography styling';
    }

    // ARMOR
    else if (promptLower.includes('chain') || promptLower.includes('שרשראות')) {
        itemTypeEnhancement = 'medieval chainmail armor, interlocking metal rings, protective mail hauberk, iron ring mesh, warrior torso armor, wearable body protection';
        compositionGuide = 'front torso view showing chainmail ring pattern texture';
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

    // Default
    if (!itemTypeEnhancement) {
        return 'detailed fantasy item, magical craftsmanship, mystical properties, centered product shot, clear details visible';
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
