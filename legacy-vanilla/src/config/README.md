# Configuration System

This directory contains all centralized configuration for the D&D Card Creator.

## 📁 File Structure

```
src/config/
├── index.ts           # Central export point
├── SliderDefaults.ts  # Default values for sliders
├── SliderLimits.ts    # Min/max ranges for sliders
├── FontSizeLimits.ts  # Min/max ranges for font sizes
├── CanvasConfig.ts    # Canvas dimensions & base positions
├── SliderInitializer.ts # Applies config to HTML sliders
└── README.md          # This file
```

## 🎯 Purpose

Instead of having settings scattered across HTML, CSS, and TypeScript files, 
all configurable values are centralized here. This makes the codebase:

- **Maintainable**: Change values in one place
- **Discoverable**: Easy to find what you're looking for
- **Consistent**: All components use the same source of truth
- **Professional**: Clean architecture for future development

## 📝 Usage

### Import What You Need

```typescript
// Import specific items
import { CANVAS, SLIDER_LIMITS } from './config';

// Import helpers
import { clampFontSize, getFontSizeLimits } from './config';

// Import initializer
import { SliderInitializer } from './config';
```

### When to Use Each File

| File | What It Contains | When to Use |
|------|------------------|-------------|
| `SliderDefaults.ts` | Default values | Reset, initial state |
| `SliderLimits.ts` | Min/max ranges | Slider validation |
| `FontSizeLimits.ts` | Font size limits | Font +/- buttons |
| `CanvasConfig.ts` | Canvas size, positions | Rendering |
| `SliderInitializer.ts` | HTML synchronization | Startup |

## 🔧 Common Tasks

### Change a Default Value
Edit `SliderDefaults.ts` → The value used on reset

### Change Slider Min/Max Range
Edit `SliderLimits.ts` → Applied to HTML on startup

### Change Font Size Limits
Edit `FontSizeLimits.ts` → Checked when +/- clicked

### Change Canvas Size
Edit `CanvasConfig.ts` → Used by CardRenderer

## 📊 Config Values Quick Reference

### Canvas
- Width: 1000px
- Height: 1400px

### Slider Ranges (examples)
- `gold-offset`: 0 to 480, default 111
- `coreStats-offset`: 600 to 1350, default 893
- `nameSize`: 16 to 120, default 64

## ⚠️ Important Notes

1. **Don't hardcode values elsewhere** - Always import from here
2. **SliderInitializer.init()** is called on app startup in `main.ts`
3. **HTML sliders** still exist but their min/max are overwritten by config
4. **TypeScript types** are exported for proper typing
