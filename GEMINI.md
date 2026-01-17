# AI Context & Developer Notes

**LAST UPDATED:** 2026-01-17
**VERSION:** 2.2 (Enhanced Guidelines)

This file serves as the **Long-Term Memory** for this project.
**ALWAYS READ THIS FILE FIRST** when starting a new session.

---

## 🎯 Product Vision

**Mimic Vault** is a powerful tool for **Dungeon Masters** who want to create beautiful, physical D&D props for their games.

### Core Value Proposition
- **AI-Powered Creation:** Generate item descriptions, names, and images with AI
- **Hebrew First:** Primary language is Hebrew (RTL), with English support
- **Print-Ready:** Cards designed to be printed and used at the table
- **Balanced Content:** Items and monsters follow D&D 5e SRD rules

### Target Users
- DMs who prepare physical props for their games
- Hebrew-speaking D&D community
- Creative DMs who want custom, balanced content

### Design Principles
1. **3-Click Rule:** Any common action should take ≤3 clicks
2. **Visual Excellence:** Cards should look professional and premium
3. **AI Assistance:** AI should help, not replace, DM creativity
4. **SRD Compliance:** All generated content must be legally shareable

---

## 🏗️ Architecture

### Tech Stack
- **Frontend:** React 19, TypeScript, Vite
- **Canvas:** React-Konva (Konva.js)
- **State:** React Context + Hooks
- **Styling:** CSS Modules / Vanilla CSS variables
- **Storage:** IndexedDB (via `idb`), LocalStorage
- **Languages:** Hebrew (Primary/RTL), English

### Directory Structure (`react-app/src`)
```
src/
├── components/          # Reusable UI components
│   ├── Canvas/         # Konva card rendering
│   ├── Layout/         # App shells, headers
│   └── Modals/         # Dialogs, viewers
├── features/           # Feature modules
│   ├── CardCreator/    # Main card creation
│   ├── CharacterSheet/ # Equipment & portraits
│   └── Gallery/        # Saved cards
├── hooks/              # Custom hooks
│   ├── useImageGenerator.ts  # AI image generation
│   ├── useGemini.ts          # AI text generation
│   └── useFonts.ts           # Font loading
├── services/           # Singleton services
├── store/              # Context providers
├── types/              # TypeScript definitions
└── utils/              # Helper functions
```

---

## ⚠️ Critical Rules & Patterns

### 1. RTL/Hebrew Handling
- App is primarily **Hebrew** with `dir="rtl"`
- **Konva Text:** Use `direction="rtl"` prop
- Test exports with Hebrew vowels (Nikud)

### 2. Asset Paths
```typescript
// ✅ CORRECT - Works in dev and production
const iconPath = `${import.meta.env.BASE_URL}assets/icon.png`;

// ❌ WRONG - Breaks on GitHub Pages
const iconPath = '/assets/icon.png';
```

### 3. State Management Pattern
```typescript
// ✅ CORRECT - State updates in useEffect
useEffect(() => {
    if (condition) {
        setState(newValue);
    }
}, [dependencies]);

// ❌ WRONG - State updates during render (causes bugs!)
if (condition) {
    setState(newValue); // This breaks React!
}
```

### 4. AI Keys & Security
- Keys stored in LocalStorage (user provides)
- Cloudflare Worker proxies some requests
- Never commit API keys to repo

---

## 🔧 Code Style Guidelines

### Naming Conventions
- `PascalCase`: Components, Types, Interfaces
- `camelCase`: Functions, variables, hooks
- `SCREAMING_SNAKE`: Constants
- Prefix hooks with `use`: `useImageGenerator`

### Component Structure Order
```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Component function
//    4a. Hooks (useState, useEffect, custom)
//    4b. Derived values
//    4c. Event handlers
//    4d. JSX return
// 5. Export
```

### Error Handling
```typescript
try {
    const result = await asyncOperation();
} catch (error) {
    console.error('Context:', error);
    // Show Hebrew message to user
    alert('שגיאה: לא הצלחנו לבצע את הפעולה');
}
```

---

## 🐛 Debugging Approach

> **IMPORTANT:** Find the ROOT CAUSE, don't just override symptoms!

### Bug Fixing Protocol
1. **Reproduce:** Confirm the bug exists
2. **Investigate:** Find WHERE it happens (use console.log)
3. **Understand:** Find WHY it happens (read the code)
4. **Fix:** Address the actual cause
5. **Verify:** Confirm the fix works
6. **Document:** Update GEMINI.md if significant

### Anti-Patterns to Avoid
- ❌ Adding `!important` to fix CSS issues
- ❌ Using `setTimeout` to "wait for things to work"
- ❌ Overriding state with stronger updates
- ❌ Ignoring TypeScript errors with `any`

---

## 📚 Knowledge Workflows

Reference these workflows for specific tasks:

### `/flux-prompts`
FLUX/Z-Image prompt engineering guidelines.
- Structured prompt formula
- Style-specific prompts
- Composition instructions

### `/dnd-items`
D&D 5e magic item creation and balancing.
- Rarity pricing table
- Balance guidelines by tier
- SRD compliance rules

---

## ⚖️ D&D Content Rules (SRD Compliance)

### ✅ Allowed Content
- Generic magic items
- Core game mechanics
- Generic monsters (Dragon, Goblin, Skeleton)
- Spell effects (can rename if needed)
- Races from SRD (Human, Elf, Dwarf, etc.)

### ❌ Forbidden Content (Product Identity)
- **Trademarks:** "Dungeons & Dragons", "D&D", "Dungeon Master"
- **Iconic Monsters:** Beholder, Mind Flayer, Owlbear, Displacer Beast
- **Named Characters:** Mordenkainen, Strahd, Tiamat
- **Settings:** Forgotten Realms, Eberron, Ravenloft

### Attribution Required
When using SRD content:
```
This work includes material from the System Reference Document 5.1 
("SRD 5.1") by Wizards of the Coast LLC under CC-BY-4.0.
```

---

## 📝 Recent Wins & Fixes

### Session 2026-01-17 (Latest)
- **Character Prompt Fix:** Added `isCharacter` flag to prevent "floating item" prompts
- **Hebrew Type Matching:** EQUIPMENT_SLOTS now accept Hebrew item types (נשק, טבעת, שריון)
- **Zoom Modal Fix:** Moved state update from render to useEffect
- **Art Styles:** Restored 15 legacy art styles for character generation
- **Item Sizing:** Updated composition prompts for larger items (80% frame)

### Character Sheet Feature
- Equipment grid (12 slots) + backpack (32 slots)
- Drag & drop with @dnd-kit
- AI portrait generation with style selection
- State persistence via CharacterContext

---

## 🔮 Future Roadmap

### Phase 2: Character Integration
- [ ] "Equip from Card Creator" workflow
- [ ] Character stat tracking
- [ ] Export character sheet as PDF

### Phase 3: Monster Creator
- [ ] Full stat block generation
- [ ] CR calculator
- [ ] Monster card layout

### Phase 4: Additional Tools
- [ ] Spell cards from SRD spell list
- [ ] NPC generator
- [ ] Treasure/loot generator
- [ ] Trap cards
- [ ] "Wanted" posters & letters

---

## 🤖 Instructions for AI

### My Role: Consultant, Not Just Programmer
I am not just a code executor - I am a **full-spectrum consultant** for this project:
- **Design Advisor:** Suggest UX/UI improvements when I see opportunities
- **Product Strategist:** Think about features from the user's perspective
- **Technical Architect:** Propose better patterns and structures
- **Quality Guardian:** Catch potential issues before they become problems

### Before ANY Action
1. **Understand the PURPOSE:** Why does this feature/fix exist? What problem does it solve?
2. **Understand the CONTEXT:** How does this fit into the overall product vision?
3. **Consider the USER:** How will the DM using this tool experience this?
4. **Think holistically:** Does this affect other parts of the app?

### Proactive Suggestions
If I see opportunities for improvement, I will suggest them:
- Better UX patterns (fewer clicks, clearer flow)
- Design improvements (visual hierarchy, consistency)
- Feature ideas that align with the product vision
- Performance optimizations
- Code quality improvements

### Core Rules
1. **Read this file first** in every new session
2. **Update "Recent Wins"** after significant changes
3. **Check workflows** before specialized tasks (`/flux-prompts`, `/dnd-items`)
4. **Find root causes** - don't override bugs with `!important` or `setTimeout`
5. **Use Hebrew** for user-facing messages
6. **Test RTL** when modifying text components
7. **Ask questions** if requirements are unclear
8. **Suggest alternatives** when I see a better approach

### Our Goal
**Make the best possible tool for Dungeon Masters.**
Every decision should serve this mission - technical excellence, beautiful design, and delightful user experience.

---
*End of Context*
