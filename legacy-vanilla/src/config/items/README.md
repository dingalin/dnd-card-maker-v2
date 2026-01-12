# Items Configuration

This folder contains all centralized configuration for item creation.

## 📁 Files

| File | Purpose |
|------|---------|
| `ItemTypes.ts` | Item categories, subcategories, icons |
| `Rarities.ts` | Rarity levels, colors, CR mappings |
| `PriceRanges.ts` | Gold pricing per rarity |
| `GenerationParams.ts` | AI visual styles, theme keywords |
| `index.ts` | Central exports |

## 🎯 Usage

```typescript
import { 
    ITEM_CATEGORIES,    // All item types
    RARITIES,           // Rarity definitions
    BASE_PRICES,        // Pricing
    VISUAL_STYLES       // AI generation styles
} from './config/items';
```

## 📊 Quick Reference

### Item Types
- weapon, armor, potion, ring, wondrous, scroll, staff, wand

### Rarities (in order)
- mundane → common → uncommon → rare → veryRare → legendary

### Price Calculation
```typescript
import { calculatePrice } from './config/items';
const gold = calculatePrice('rare', 'weapon'); // ~2500 gold
```

## ✏️ How to Modify

### Add New Item Type
Edit `ItemTypes.ts` → Add to `ITEM_CATEGORIES` array

### Change Rarity Colors
Edit `Rarities.ts` → Modify `RARITIES` object

### Adjust Pricing
Edit `PriceRanges.ts` → Modify `BASE_PRICES`

### Add Visual Style
Edit `GenerationParams.ts` → Add to `VISUAL_STYLES` array
