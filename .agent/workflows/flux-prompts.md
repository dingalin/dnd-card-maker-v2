---
description: FLUX/Z-Image prompt engineering guidelines for high-quality item and character image generation
---

# FLUX / Z-Image Prompt Engineering Guide

This workflow documents best practices for generating images with FLUX and Z-Image models.

## Core Principles

### 1. No Negative Prompts
Z-Image Turbo **ignores negative prompts**. Instead, describe what you WANT:
- ❌ "no blur" → ✅ "sharp focus, crisp details"
- ❌ "no text" → ✅ "clean image, object only"
- ❌ "no watermark" → ✅ "professional photography"

### 2. Structured Prompt Formula
Order matters! Build prompts in layers:

```
[STYLE] + [SUBJECT] + [COMPOSITION] + [LIGHTING] + [QUALITY]
```

**Example for Item:**
```
((oil painting style)), (ornate magical sword with blue flames),
extreme close up, item fills 80% of frame, dramatic lighting,
masterpiece, best quality, 8k resolution
```

**Example for Character:**
```
((anime style illustration)), (female elf wizard casting spell),
full body portrait, centered composition, dramatic rim lighting,
vibrant colors, highly detailed, professional artwork
```

### 3. Weight Emphasis
Use parentheses for emphasis:
- `(keyword)` = slight emphasis
- `((keyword))` = strong emphasis
- `(((keyword)))` = very strong (use sparingly)

### 4. Optimal Prompt Length
- **Recommended:** 80-250 words
- **Maximum effective:** ~300 words (truncation may occur)
- Place most important elements FIRST

## Style-Specific Prompts

### Realistic / Photographic
```
ultra-realistic photographic render, professional studio shot,
cinematic 4k rendering, sharp focus, shallow depth of field,
commercial product photography quality
```

### Oil Painting
```
classical oil painting artwork, museum quality masterpiece,
thick impasto brushstrokes, visible oil paint texture,
rich color glazing layers, dramatic chiaroscuro lighting,
canvas texture visible
```

### Anime / Manga
```
anime style illustration, Japanese anime artwork,
clean cel shading, bold black outlines,
flat color areas with subtle gradients,
vibrant saturated colors, Studio Ghibli inspired
```

### Dark Fantasy
```
dark fantasy digital artwork, gothic fantasy illustration,
grimdark aesthetic, dramatic rim lighting, deep shadows,
ominous atmosphere, moody color grading,
Elden Ring / Dark Souls art style
```

### Ink Drawing (D&D Manual Style)
```
black ink illustration, hand-drawn pen and ink artwork,
fine black ink lines, crosshatch shading,
vintage Dungeons and Dragons manual style,
1980s fantasy book illustration
```

## Composition Instructions by Use Case

### Items with Background (Natural/Bokeh)
```
extreme close up shot, macro photography,
item prominently displayed in foreground,
strong bokeh effect on background,
shallow depth of field,
item fills 80% of image frame,
sharp focus on main item
```

### Items with No Background (Transparent)
```
isolated single item floating in air,
extreme close up, item fills entire image frame,
pure white background,
museum artifact display,
clean product shot style,
flat studio lighting
```

### Character Portraits
```
character portrait, centered composition,
high quality character art,
expressive face, dramatic lighting,
detailed background,
masterpiece, best quality
```

## Common Mistakes to Avoid

1. **Contradictory styles:** "photorealistic anime style" confuses the model
2. **Too many subjects:** Focus on ONE main subject
3. **Vague descriptions:** "beautiful sword" → "ornate longsword with glowing runes"
4. **Ignoring composition:** Always specify framing and size

## Quick Reference Table

| Use Case | Key Terms |
|----------|-----------|
| Large item | extreme close up, fills 80% of frame, macro |
| Small item | centered, generous padding, floating |
| Portrait | head and shoulders, close up, expressive |
| Full body | full body shot, head to toe, dynamic pose |
| Action | motion blur, speed lines, dynamic angle |
| Still | museum display, product shot, centered |

---
*Last updated: 2026-01-17*
