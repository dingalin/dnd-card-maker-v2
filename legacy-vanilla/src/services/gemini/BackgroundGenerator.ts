/**
 * BackgroundGenerator - Handles card background generation using FLUX/Z-Image
 * Extracted from GeminiService for better code organization
 */

import { API } from '../../config/index';
// @ts-ignore
import { BlobURLRegistry } from '../blob-registry';
// @ts-ignore
import { FluxStyleConfig } from '../style-configs';
import { GeminiConfig } from '../../types/api';

// Cloudflare Worker URL for secure API access
const WORKER_URL = API.WORKER_URL;

interface ThemeConfig {
    colors: string;
    elements: string;
    atmosphere: string;
    texture: string;
}

// Theme configurations for card backgrounds
export const THEME_CONFIGS: { [key: string]: ThemeConfig } = {
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
    }
};

// Style configurations for background generation
export const STYLE_CONFIGS: { [key: string]: FluxStyleConfig } = {
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
    }
};

/**
 * Generate card background using GetImg/FLUX or Z-Image
 */
export async function generateCardBackground(
    geminiConfig: GeminiConfig,
    theme: string,
    style: string = 'watercolor',
    // eslint-disable-next-line no-unused-vars
    _getImgApiKey: string = '',
    model: string = 'getimg-flux'
): Promise<string> {
    const { password } = geminiConfig;

    const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS['Old Scroll'];
    const styleConfig = STYLE_CONFIGS[style] || STYLE_CONFIGS['watercolor'];

    // Build prompt with FLUX-optimized structure
    const prompt = buildBackgroundPrompt(theme, themeConfig, styleConfig);

    console.log(`🎨 BackgroundGenerator: Generating ${theme} background in ${style} style using ${model}`);
    console.log(`📝 Background Prompt: "${prompt.substring(0, 100)}..."`);

    try {
        let data;

        if (model === 'getimg-zimage') {
            // Z-Image via Kie.ai
            const truncatedPrompt = prompt.length > 1000
                ? prompt.substring(0, 997) + '...'
                : prompt;

            console.log(`BackgroundGenerator: Using Worker for Background generation (Z-Image via Kie.ai)`);
            console.log(`Z-Image prompt length: ${truncatedPrompt.length} chars`);

            data = await callViaWorker(password!, 'kie-zimage', {
                prompt: truncatedPrompt,
                aspect_ratio: '3:4'  // Card proportions
            });
        } else {
            // FLUX or Seedream via GetImg
            const body = {
                prompt: prompt,
                model: model,
                response_format: 'b64',
                width: 512,
                height: 768
            };

            console.log(`BackgroundGenerator: Using Worker for Background generation (${model})`);
            data = await callViaWorker(password!, 'getimg-generate', body);
        }

        if (data.image) {
            const imageUrl = `data:image/jpeg;base64,${data.image}`;
            const blob = await (await fetch(imageUrl)).blob();
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

// Build FLUX-optimized background prompt
function buildBackgroundPrompt(theme: string, themeConfig: ThemeConfig, styleConfig: FluxStyleConfig): string {
    return [
        // Art style first
        styleConfig.primary,
        styleConfig.technique,

        // Card structure
        'FRAMED CARD DESIGN: ornate decorative border frame surrounding empty center',
        'fantasy trading card background with elaborate picture frame border',
        'thick ornamental frame edges with intricate carved details',

        // Corner flourishes
        'elaborate corner flourishes with symmetrical ornamental designs',
        'decorative corner pieces extending inward with filigree patterns',

        // Bright center
        'LARGE BRIGHT CENTER: cream colored or light parchment middle area',
        'center area is clean, empty, soft, and very light for text overlay',
        'vignette gradient effect from bright cream center to richly decorated dark edges',

        // Theme-specific decorations
        `${theme} themed ornamental elements built INTO the frame border`,
        `${themeConfig.colors} color palette for the decorative frame`,
        themeConfig.elements + ' as frame decorations around edges only',
        themeConfig.atmosphere + ' emanating from frame',
        themeConfig.texture + ' texture on frame surface',

        // Technical specs
        'vertical portrait orientation, 2:3 aspect ratio, trading card proportions',
        'absolutely no text, no letters, no characters, no creatures, no faces',
        'center must remain completely empty and bright for content overlay',

        // Style finish
        styleConfig.finish
    ].join(', ');
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

export default { generateCardBackground, THEME_CONFIGS, STYLE_CONFIGS };
