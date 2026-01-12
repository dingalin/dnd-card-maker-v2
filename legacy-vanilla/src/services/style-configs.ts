/**
 * FLUX Style Configurations
 * Optimized style descriptions for FLUX image generation
 * Each style has: primary (main instruction), technique (specific methods), finish (final touches)
 */

export interface FluxStyleConfig {
    primary: string;
    technique: string;
    finish: string;
}

export const FLUX_STYLE_CONFIGS: { [key: string]: FluxStyleConfig } = {
    'realistic': {
        primary: 'ultra-realistic professional product photography, photorealistic render, 8k resolution',
        technique: 'perfect lighting, sharp focus throughout, ray tracing, physically based rendering',
        finish: 'high resolution, commercial quality, highly detailed, clean finish'
    },
    'watercolor': {
        primary: 'beautiful watercolor painting, traditional watercolor artwork, hand-painted watercolor illustration',
        technique: 'wet-on-wet watercolor technique, paint bleeding on textured paper, soft color bleeding edges, visible watercolor pigment granulation, loose flowing brushstrokes',
        finish: 'art paper texture visible, dreamy soft aesthetic, pastel color palette, artistic watercolor finish'
    },
    'oil': {
        primary: 'classical oil painting artwork, traditional oil on canvas, museum quality oil painting',
        technique: 'thick impasto brushstrokes, visible oil paint texture, rich color glazing layers, dramatic chiaroscuro lighting, Renaissance painting technique',
        finish: 'gallery masterpiece quality, baroque details, warm color palette, canvas texture visible'
    },
    'sketch': {
        primary: 'detailed pencil sketch illustration, hand-drawn graphite artwork, professional sketch drawing',
        technique: 'graphite pencil on textured paper, cross-hatching shading technique, varied line weights, light construction lines visible',
        finish: 'monochrome grayscale, paper grain texture, concept art style, clean precise linework'
    },
    'dark_fantasy': {
        primary: 'dark fantasy digital artwork, gothic fantasy illustration, grimdark aesthetic painting',
        technique: 'dramatic rim lighting, deep shadows, ominous atmosphere, moody color grading, dark souls inspired aesthetic',
        finish: 'high contrast, desaturated colors with accent highlights, cinematic dark atmosphere, Elden Ring art style'
    },
    'anime': {
        primary: 'anime style illustration, Japanese anime artwork, manga art style drawing',
        technique: 'clean cel shading, bold black outlines, flat color areas with subtle gradients, anime eye style',
        finish: 'vibrant saturated colors, Studio Ghibli inspired, high quality anime illustration, clean vector-like finish'
    },
    'epic_fantasy': {
        primary: 'medieval woodcut print artwork, vintage woodblock illustration, old book engraving style',
        technique: 'carved wood texture lines, black ink on paper, cross-hatched shading, hand-carved appearance',
        finish: 'antique aged paper, historical artwork style, vintage printed aesthetic, monochrome ink'
    },
    'pixel': {
        primary: '8-bit pixel art, tiny pixel sprite, NES video game graphics, Gameboy color game asset',
        technique: 'blocky square pixels visible, extremely low resolution pixelated image, only 32x32 pixels, chunky pixel blocks, retro gaming sprite',
        finish: 'classic 8-bit Nintendo aesthetic, visible pixel grid, no smooth edges, no anti-aliasing, looks like old video game'
    },
    'stained_glass': {
        primary: 'stained glass window artwork, cathedral glass art, Art Nouveau glass design',
        technique: 'bold black lead lines separating colored sections, translucent glass effect, geometric color panels',
        finish: 'luminous backlit appearance, vibrant jewel tones, Gothic cathedral aesthetic, decorative border'
    },
    'simple_icon': {
        primary: 'flat 2D vector icon, minimalist icon design, simple flat illustration, UI game icon',
        technique: 'completely flat solid colors only, zero gradients, zero shading, bold simple shapes, thick black outline',
        finish: 'mobile game UI icon style, clean geometric silhouette, high contrast, minimal detail'
    },
    'ink_drawing': {
        primary: 'black ink illustration, hand-drawn pen and ink artwork, old fantasy book illustration',
        technique: 'fine black ink lines, crosshatch shading, hand-drawn imperfections, quill pen strokes, detailed linework',
        finish: 'vintage Dungeons and Dragons manual style, 1980s fantasy book illustration, black ink on parchment paper'
    },
    'silhouette': {
        primary: 'heraldic emblem design, coat of arms symbol, medieval heraldry icon, simple emblem artwork',
        technique: 'solid black graphic on white background, clean iconic shape, bold symbolic design, flat graphic emblem',
        finish: 'royal crest style, knightly insignia, medieval guild symbol, simple bold icon, shield emblem aesthetic'
    },
    'synthwave': {
        primary: 'synthwave neon artwork, retrowave 80s aesthetic, cyberpunk neon style',
        technique: 'glowing neon lights, hot pink and cyan color scheme, grid lines, chrome reflections',
        finish: 'retro futuristic atmosphere, vaporwave aesthetic, glowing edges, 1980s sci-fi movie poster style'
    }
};

/**
 * Helper to convert hex to descriptive color name
 */
export function getColorName(hex: string): string {
    const map: { [key: string]: string } = {
        '#ffffff': 'pure white', '#000000': 'deep black', '#ff0000': 'crimson red',
        '#00ff00': 'emerald green', '#0000ff': 'royal blue', '#ffff00': 'golden yellow',
        '#00ffff': 'icy cyan', '#ff00ff': 'arcane magenta', '#8b4513': 'rich brown',
        '#808080': 'steel gray', '#e6e6fa': 'soft lavender', '#f0f8ff': 'pale ice blue',
        '#f5f5dc': 'antique beige', '#ffe4e1': 'rose quartz'
    };
    return map[hex.toLowerCase()] || 'neutral';
}

/**
 * Add visual keywords based on item's elemental theme
 */
export function getElementalEnhancement(prompt: string): string {
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
}

/**
 * Make legendary items look more prestigious than common ones
 */
export function getRarityQuality(prompt: string): string {
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
}

export default FLUX_STYLE_CONFIGS;
