# 🎲 D&D Card Creator - Mimic Vault

## ⚠️ IMPORTANT: Which Version to Use?

### ✅ **ACTIVE VERSION** (React App)
**Use this for all development!**

- **📁 Location:** `react-app/`
- **🛠️ Tech Stack:** React + TypeScript + Konva + Vite
- **🚀 Start Dev Server:**
  ```bash
  cd react-app
  npm install
  npm run dev
  ```
- **🌐 URL:** http://localhost:5173
- **📦 Build:** `npm run build`

---

### ⛔ **LEGACY VERSION** (Vanilla JS)
**⚠️ DEPRECATED - DO NOT USE FOR NEW DEVELOPMENT!**

- **📁 Location:** Root folders (`src/`, `components/`, `css/`)
- **🛠️ Tech Stack:** Vanilla TypeScript + Vite
- **📌 Status:** 🚫 **No longer maintained**
- **💡 Purpose:** Reference only - will be moved to `legacy-vanilla/`

> **Note:** This version is kept temporarily for reference and migration purposes.
> All new features and bug fixes should be done in `react-app/` only.

---

## 📚 Quick Start (React Version)

```bash
# 1. Navigate to React app
cd react-app

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Visit http://localhost:5173
```

---

## 🏗️ Project Structure

```
dnd card creator/
├── react-app/              ✅ ACTIVE - Use this!
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── features/       # Feature modules
│   │   ├── store/          # State management
│   │   └── hooks/          # Custom hooks
│   ├── package.json
│   └── vite.config.ts
│
├── src/                    ⛔ LEGACY - Will be moved
├── components/             ⛔ LEGACY - Will be moved  
├── css/                    ⛔ LEGACY - Will be moved
└── README.md               📖 This file
```

---

## 🎯 Features

- **AI-Powered Generation:** Create D&D items using Gemini AI
- **Interactive Canvas:** Direct editing with Konva.js
- **Hebrew Support:** Full RTL support for Hebrew text
- **Card Customization:** Fonts, colors, shadows, effects
- **Image Generation:** FLUX integration for item images
- **Double-Sided Cards:** Front and back rendering
- **Print Support:** Export for printing

---

## 🤝 Contributing

When contributing:
1. ✅ **Work ONLY in `react-app/` folder**
2. ❌ **Do NOT modify root `src/` or `components/`**
3. 📝 Follow React best practices
4. 🧪 Test changes before committing

---

## 📞 Support

For questions or issues, check the documentation in `react-app/README.md`
