# React App Source Structure

## Overview
This is the React-based D&D Card Creator application.

## Folder Structure

```
src/
├── components/     # Reusable UI components
│   ├── Canvas/     # Card canvas (Konva-based)
│   ├── Layout/     # App layout (Header, etc.)
│   └── Modals/     # Modal dialogs
│
├── features/       # Feature-specific components
│   ├── CardCreator/      # Main card creation feature
│   ├── CharacterSheet/   # Character sheet feature
│   └── TreasureGenerator/# Treasure generation feature
│
├── hooks/          # Custom React hooks
│   ├── useGemini.ts          # AI text generation
│   ├── useImageGenerator.ts  # AI image generation
│   └── useBackgroundGenerator.ts
│
├── store/          # State management (Context + Reducer)
│   ├── CardContext.tsx
│   ├── actions.ts
│   └── reducer.ts
│
├── services/       # External services
│
├── utils/config/   # Configuration files
│   ├── layout/     # Layout & display settings
│   ├── items/      # Item types, rarities, prices
│   └── game/       # D&D game data tables
│
├── i18n/           # Internationalization (Hebrew/English)
│
├── types/          # TypeScript type definitions
│
└── data/           # Static data files
```

## Key Files
- `App.tsx` - Main application component
- `main.tsx` - Application entry point
- `index.css` - Global styles
