# AI Context & Developer Notes

This file serves as a persistent memory and knowledge base for the AI assistant and developers working on the D&D Card Creator project. **READ THIS FIRST** when starting a new session.

## Project Overview
- **Type:** Vanilla JavaScript Web Application (Vite)
- **Runtime:** **MUST** be run via a local server (e.g., `npm run dev`). Opening `index.html` directly (`file://`) will fail due to CORS and Module security policies.
- **Language:** Hebrew (RTL interface) - *All UI text must be in Hebrew.*
- **Core Functionality:** Generating D&D item cards using AI (Gemini) and rendering them on an HTML5 Canvas.

## Architecture & File Responsibilities
- **Entry Point:** `index.html` (Minimal Shell) loads `component-loader.js` and `main.js`.
- **Components (`components/`):**
  - `header.html`: Top bar with logo.
  - `sidebar-start.html`: Generation form (Right sidebar).
  - `preview-panel.html`: Center canvas area.
  - `sidebar-end.html`: Edit & Design controls (Left sidebar).
- **Logic:**
  - `component-loader.js`: **Dynamic Loader.** Fetches and injects HTML components into placeholders.
  - `main.js`: **Core Orchestrator.** Initializes app *after* `componentsLoaded` event.
  - `ui-helpers.js`: **UI Utilities.** Handles collapsible sections, sliders, etc.
  - `src/gemini-service.js`: **AI Integration.** Gemini (text) & Pollinations.ai (image).
  - `src/card-renderer.js`: **Canvas Drawing.** Renders the card visual.
  - `src/dnd-data.js`: Static data.
- **Styling:**
  - `style.css`: Base styles.
  - `ui-improvements.css`: Primary stylesheet (Glassmorphism, Layout).
  - `collapsible-sections.css`: Specific styles for sidebar accordions.

## ⚠️ CRITICAL WARNINGS & COMMON PITFALLS ⚠️

### 1. Component Loading Timing
- **Context:** HTML is loaded dynamically via JS.
- **Pitfall:** Trying to access DOM elements (like `getElementById`) before `componentsLoaded` event fires will fail.
- **Rule:** Wrap all initialization logic in `document.addEventListener('componentsLoaded', ...)` or use the `initializeApp` function in `main.js`.

### 2. CSS Syntax Errors
- **Issue:** `ui-improvements.css` is large and prone to unclosed blocks (`}`). This breaks the entire stylesheet silently.
- **Prevention:** After any CSS edit, verify that all blocks are closed. Be careful when nesting media queries.

### 3. RTL & Positioning
- **Context:** The app is `dir="rtl"`.
- **Pitfall:** "Left" often means "Right" in visual positioning.
- **Rule:** Test all positional changes (absolute positioning, floats, flex-direction) to ensure they behave correctly in RTL.

### 4. Canvas Text Wrapping
- **Context:** `card-renderer.js` handles text manually.
- **Pitfall:** Hebrew text wrapping can be tricky on Canvas.
- **Rule:** If text cuts off or overlaps, check the `wrapText` function in `card-renderer.js`.

## Optimization & Refactoring Goals
- **Split `main.js`:** It is becoming a "God Object". Move distinct logic (e.g., event handlers) to separate modules.
- **CSS Modularization:** Break `ui-improvements.css` into smaller, component-specific files (e.g., `buttons.css`, `forms.css`).
- **State Management:** Move away from reading/writing directly to the DOM for application state. Implement a simple `state.js` module.

## Workflow Tips
- **Git:** The project uses Git. If the code gets into an unrecoverable state, a hard reset to `origin/main` is a valid recovery strategy (after confirming with the user).
- **Testing:** Always verify:
    1.  Card Generation (Text & Image).
    2.  UI Layout (No duplications).
    3.  Console for errors (especially 404s or syntax errors).

### 5. Code Maintenance Rule
- **Context:** When modifying behavior or fixing bugs.
- **Rule:** **DO NOT** add new code to override existing behavior (e.g., `!important` overrides or conflicting event listeners). **ALWAYS** find the original code causing the issue and remove or modify it directly. Delete old/obsolete code instead of patching over it.

### 6. Component Loading Race Conditions
- **Context:** Scripts like `navigation-manager.js` might run before `component-loader.js` finishes injecting HTML.
- **Pitfall:** Initializing logic on `DOMContentLoaded` often fails because components aren't there yet. Setting an `initialized` flag on failure prevents the correct run on `componentsLoaded`.
- **Rule:** **ALWAYS** check `window.areComponentsLoaded` or wait specifically for the `componentsLoaded` event. **NEVER** rely solely on `DOMContentLoaded` for logic that depends on dynamic components.
  ```javascript
  if (window.areComponentsLoaded) {
      init();
  } else {
      document.addEventListener('componentsLoaded', init);
  }
  ```
