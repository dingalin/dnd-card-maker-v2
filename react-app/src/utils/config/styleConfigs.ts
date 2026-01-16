/**
 * Centralized Style Configurations
 * Used by both useImageGenerator and useBackgroundGenerator
 */

// Style configurations for backgrounds/frames
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

// Style configurations optimized for item/object generation (used by FLUX)
export const FLUX_STYLE_CONFIGS: Record<string, { primary: string; technique: string; finish: string }> = {
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

// Type exports
export type StyleConfigKey = keyof typeof STYLE_CONFIGS;
export type FluxStyleKey = keyof typeof FLUX_STYLE_CONFIGS;
