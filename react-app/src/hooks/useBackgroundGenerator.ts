/**
 * useBackgroundGenerator - Hook for generating card background images
 * Ported from original app's BackgroundGenerator.ts
 */

import { useState, useCallback } from 'react';
import { API_CONFIG } from '../config/api';

// Theme configurations for card backgrounds
export const THEME_CONFIGS: Record<string, { colors: string; elements: string; atmosphere: string; texture: string }> = {
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
    },
    'Feywild': {
        colors: 'vibrant magenta, bioluminescent pink, twilight purple, neon green',
        elements: 'glowing mushrooms, floating pollen, butterfly wings, oversized magical flowers, twisting roots',
        atmosphere: 'whimsical magic, dreamlike glade, enchanted forest feeling',
        texture: 'iridescent fairy dust, soft moss, flower petal surface'
    },
    'Underdark': {
        colors: 'deep slate grey, bioluminescent blue, violet fungus glow',
        elements: 'stalactites, glowing crystal clusters, purple fungi, spiderweb strands',
        atmosphere: 'subterranean mystery, silent cavern, alien underground beauty',
        texture: 'rough cavern wall, damp stone, crystallized minerals'
    },
    'Desert': {
        colors: 'sun-bleached gold, sandstone orange, bright turquoise accents',
        elements: 'ancient sandstone ruins, hieroglyphs, shifting sands, scarab motifs, sun disc symbols',
        atmosphere: 'arid heat, ancient lost civilization, relentless sun',
        texture: 'sand-blasted stone, papyrus, dry cracked earth'
    },
    'Jungle': {
        colors: 'deep emerald green, jaguar yellow, stone grey',
        elements: 'ancient overgrown ruins, thick vines, exotic fern leaves, tribal stone carvings',
        atmosphere: 'humid rainforest, lost temple secrets, wild overgrowth',
        texture: 'moss-covered stone, large tropical leaf veins, weathered temple wall'
    },
    'Tavern': {
        colors: 'warm wood brown, amber ale gold, hearth fire orange',
        elements: 'wooden tankards, candlelight, hearth fire, barrel rings, wanted poster fragments',
        atmosphere: 'cozy hospitality, rowdy adventure planning, warm hearth lighting',
        texture: 'stained oak wood table, burlap cloth, candle wax drippings'
    },
    'Premium Fantasy': {
        colors: 'rich gold, warm bronze, aged parchment tan, dark mahogany brown',
        elements: 'ornate Celtic knotwork borders, golden filigree corners, heraldic griffin emblems, intricate metalwork patterns',
        atmosphere: 'luxurious ancient tome, prestigious artifact display, museum quality presentation',
        texture: 'aged vellum parchment, embossed leather binding, gold leaf gilding, hammered metal frame'
    }
};

// Style configurations
export const STYLE_CONFIGS: Record<string, { primary: string; technique: string; finish: string }> = {
    'watercolor': {
        primary: 'beautiful watercolor painting, traditional watercolor artwork, hand-painted frame border',
        technique: 'wet-on-wet watercolor technique, soft color bleeding edges, visible watercolor pigment granulation, loose flowing brushstrokes on frame',
        finish: 'art paper texture visible, dreamy soft aesthetic, pastel color palette, artistic watercolor finish'
    },
    'realistic': {
        primary: 'ultra-realistic photographic texture, detailed material rendering, professional studio lighting',
        technique: 'high resolution textures, physical material properties visible, cinematic lighting setup',
        finish: 'commercial product photography quality, crisp details, premium finish'
    },
    'oil': {
        primary: 'classical oil painting artwork, traditional oil on canvas, museum quality painting',
        technique: 'thick impasto brushstrokes on frame, visible oil paint texture, rich color glazing layers, dramatic chiaroscuro lighting',
        finish: 'gallery masterpiece quality, baroque decorative details, warm color palette, canvas texture visible'
    },
    'dark_fantasy': {
        primary: 'dark fantasy digital artwork, gothic fantasy illustration, grimdark aesthetic',
        technique: 'dramatic rim lighting, deep shadows, ominous atmosphere, moody color grading, dark souls inspired aesthetic',
        finish: 'high contrast, desaturated colors with accent highlights, cinematic dark atmosphere, Elden Ring art style'
    },
    'sketch': {
        primary: 'detailed pencil sketch illustration, hand-drawn graphite artwork, professional sketch drawing',
        technique: 'graphite pencil on textured paper, cross-hatching shading technique, varied line weights, light construction lines visible',
        finish: 'monochrome grayscale, paper grain texture, concept art style, clean precise linework'
    },
    'epic_fantasy': {
        primary: 'medieval woodcut print artwork, vintage woodblock illustration, old book engraving style',
        technique: 'carved wood texture lines, black ink on paper, cross-hatched shading, hand-carved appearance',
        finish: 'antique aged paper, historical artwork style, vintage printed aesthetic, monochrome ink'
    },
    'anime': {
        primary: 'anime style illustration, Japanese anime artwork, manga art style drawing',
        technique: 'clean cel shading, bold black outlines, flat color areas with subtle gradients',
        finish: 'vibrant saturated colors, Studio Ghibli inspired, high quality anime illustration, clean vector-like finish'
    },
    'stained_glass': {
        primary: 'stained glass window artwork, cathedral glass art, Art Nouveau glass design',
        technique: 'bold black lead lines separating colored sections, translucent glass effect, geometric color panels',
        finish: 'luminous backlit appearance, vibrant jewel tones, Gothic cathedral aesthetic, decorative border'
    },
    'pixel': {
        primary: '16-bit pixel art style, retro video game aesthetic, SNES game graphics',
        technique: 'blocky square pixels visible, pixelated image, chunky pixel blocks, retro gaming sprite',
        finish: 'classic retro Nintendo aesthetic, visible pixel grid, no smooth edges, looks like old video game'
    },
    'simple_icon': {
        primary: 'flat 2D vector design, minimalist icon design, simple flat illustration, clean lines',
        technique: 'completely flat solid colors only, zero gradients, zero shading, bold simple shapes',
        finish: 'mobile game UI style, clean geometric silhouette, high contrast, minimal detail'
    },
    'ink_drawing': {
        primary: 'black ink illustration, hand-drawn pen and ink artwork, old fantasy book illustration',
        technique: 'fine black ink lines, crosshatch shading, hand-drawn imperfections, quill pen strokes, detailed linework',
        finish: 'vintage Dungeons and Dragons manual style, 1980s fantasy book illustration, black ink on parchment paper'
    },
    'silhouette': {
        primary: 'heraldic emblem design, coat of arms symbol, medieval heraldry, simple emblem artwork',
        technique: 'solid black graphic elements, clean iconic shapes, bold symbolic design, flat graphic emblem',
        finish: 'royal crest style, knightly insignia, medieval guild symbol, simple bold shapes'
    },
    'synthwave': {
        primary: 'synthwave neon artwork, retrowave 80s aesthetic, cyberpunk neon style',
        technique: 'glowing neon lights, hot pink and cyan color scheme, grid lines, chrome reflections',
        finish: 'retro futuristic atmosphere, vaporwave aesthetic, glowing edges, 1980s sci-fi movie poster style'
    },
    'comic_book': {
        primary: 'exaggerated comic book style frame, hand-drawn comic border, vintage comic book aesthetic',
        technique: 'bold thick outlines, halftone dot patterns, dramatic dynamic borders, vibrant pop art colors',
        finish: 'classic comic book action style, hand-drawn comic art feel, vintage superhero comic aesthetic'
    },
    'manga_action': {
        primary: 'manga action style frame, energetic speed lines background, anime card border',
        technique: 'bold black ink outlines, dynamic action lines radiating from center, comic sunburst effect, cel shaded elements',
        finish: 'high energy manga illustration, dramatic anime reveal style, Japanese comic aesthetic'
    },
    'vintage_etching': {
        primary: 'antique vintage etching style frame, old book illustration border, grimoire page aesthetic',
        technique: 'intricate woodcut details, cross-hatching shading, fine black and white ink lines, textured aged paper background',
        finish: 'highly detailed Victorian engraving, medieval manuscript border, ancient tome aesthetic'
    },
    'premium_fantasy': {
        primary: 'premium fantasy trading card, ornate golden frame with Celtic patterns, luxurious D&D card design',
        technique: 'intricate metallic gold filigree, embossed leather texture, aged parchment background, griffin and dragon motifs in corners',
        finish: 'museum quality fantasy card, Elder Scrolls Legends aesthetic, Hearthstone golden card style, rich warm tones'
    }
};

function buildBackgroundPrompt(theme: string, themeConfig: typeof THEME_CONFIGS['Fire'], styleConfig: typeof STYLE_CONFIGS['watercolor']): string {
    return [
        styleConfig.primary,
        styleConfig.technique,
        'FRAMED CARD DESIGN: ornate decorative border frame surrounding empty center',
        'fantasy trading card background with elaborate picture frame border',
        'thick ornamental frame edges with intricate carved details',
        'elaborate corner flourishes with symmetrical ornamental designs',
        'LARGE BRIGHT CENTER: cream colored or light parchment middle area',
        'center area is clean, empty, soft, and very light for text overlay',
        `${theme} themed ornamental elements built INTO the frame border`,
        `${themeConfig.colors} color palette for the decorative frame`,
        themeConfig.elements + ' as frame decorations around edges only',
        themeConfig.atmosphere + ' emanating from frame',
        themeConfig.texture + ' texture on frame surface',
        'vertical portrait orientation, 2:3 aspect ratio, trading card proportions',
        'absolutely no text, no letters, no characters, no creatures, no faces',
        'center must remain completely empty and bright for content overlay',
        styleConfig.finish
    ].join(', ');
}

// Build prompt for STYLE-BASED passive backgrounds (style becomes the theme)
function buildStyleBasedPrompt(styleConfig: typeof STYLE_CONFIGS['watercolor']): string {
    return [
        styleConfig.primary,
        styleConfig.technique,
        'FRAMED CARD DESIGN: ornate decorative border frame surrounding empty center',
        'fantasy trading card background with elaborate picture frame border',
        'thick ornamental frame edges with intricate carved details in this style',
        'elaborate corner flourishes with symmetrical ornamental designs matching the artistic style',
        'LARGE BRIGHT CENTER: cream colored or light parchment middle area',
        'center area is clean, empty, soft, and very light for text overlay',
        'decorative elements and patterns that embody the essence of this artistic style',
        'frame design that showcases the unique characteristics of this art style',
        'ornamental details built INTO the frame border using this style\'s visual language',
        'vertical portrait orientation, 2:3 aspect ratio, trading card proportions',
        'absolutely no text, no letters, no characters, no creatures, no faces',
        'center must remain completely empty and bright for content overlay',
        styleConfig.finish
    ].join(', ');
}

export function useBackgroundGenerator() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

    const generateBackground = useCallback(async (
        password: string,
        theme: string = 'Old Scroll',
        style: string = 'watercolor',
        model: string = 'flux-schnell',
        customPrompt?: string
    ): Promise<string | null> => {
        setIsGenerating(true);
        setError(null);

        const styleConfig = STYLE_CONFIGS[style] || STYLE_CONFIGS['watercolor'];

        let prompt: string;

        // Check if this is a style-based (passive) background
        if (theme === 'Passive') {
            // Use style as the theme - the style becomes the subject
            prompt = customPrompt || buildStyleBasedPrompt(styleConfig);
            console.log(`🎨 BackgroundGenerator: Generating STYLE-BASED background in ${style} style`);
        } else {
            // Normal theme-based generation
            const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS['Old Scroll'];
            prompt = customPrompt || buildBackgroundPrompt(theme, themeConfig, styleConfig);
            console.log(`🎨 BackgroundGenerator: Generating ${theme} background in ${style} style`);
        }

        let action = 'getimg-generate';
        let requestData: any = {
            prompt,
            model, // default: flux-schnell
            response_format: 'b64',
            width: 512,
            height: 768
        };

        // Handle Z-Image / Fal logic (Z-Image Turbo)
        if (model === 'z-image' || model === 'fal-zimage') {
            action = 'fal-zimage';
            requestData = {
                prompt,
                image_size: { width: 512, height: 768 }, // Custom portrait size for cards
                num_inference_steps: 8,
                output_format: 'jpeg',
                enable_safety_checker: true
            };
        }

        try {
            const response = await fetch(API_CONFIG.WORKER_URL, {
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
                    throw new Error('Incorrect password');
                }
                const errorText = await response.text();
                console.error('❌ API Error Body:', errorText);
                throw new Error(`Generation failed: ${response.status} - ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();

            if (data.image) {
                const imageUrl = `data:image/jpeg;base64,${data.image}`;
                setBackgroundUrl(imageUrl);
                console.log('✅ Background generated successfully');
                return imageUrl;
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                throw new Error('No image returned');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Background generation failed';
            setError(message);
            console.error('❌ Background generation failed:', message);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return {
        generateBackground,
        isGenerating,
        error,
        backgroundUrl,
        setBackgroundUrl,
        themes: Object.keys(THEME_CONFIGS),
        styles: Object.keys(STYLE_CONFIGS)
    };
}
