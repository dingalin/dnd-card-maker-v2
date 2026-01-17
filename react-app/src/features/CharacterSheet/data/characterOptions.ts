// Character creation options (from legacy dnd-data.ts)

export interface SelectOption {
    value: string;
    label: string;
    labelEn: string;
}

export const CHARACTER_OPTIONS = {
    genders: [
        { value: 'male', label: 'זכר', labelEn: 'Male' },
        { value: 'female', label: 'נקבה', labelEn: 'Female' },
        { value: 'non-binary', label: 'א-בינארי', labelEn: 'Non-Binary' }
    ] as SelectOption[],

    races: [
        { value: 'human', label: 'בן אנוש', labelEn: 'Human' },
        { value: 'elf', label: 'אלף', labelEn: 'Elf' },
        { value: 'dwarf', label: 'גמד', labelEn: 'Dwarf' },
        { value: 'halfling', label: 'זוטון', labelEn: 'Halfling' },
        { value: 'tiefling', label: 'טיפלינג', labelEn: 'Tiefling' },
        { value: 'gnome', label: 'ננס', labelEn: 'Gnome' },
        { value: 'dragonborn', label: 'דם דרקון', labelEn: 'Dragonborn' },
        { value: 'orc', label: 'אורק', labelEn: 'Orc' }
    ] as SelectOption[],

    classes: [
        { value: 'fighter', label: 'לוחם', labelEn: 'Fighter' },
        { value: 'wizard', label: 'קוסם', labelEn: 'Wizard' },
        { value: 'rogue', label: 'נוכל', labelEn: 'Rogue' },
        { value: 'cleric', label: 'כוהן', labelEn: 'Cleric' },
        { value: 'paladin', label: 'פלאדין', labelEn: 'Paladin' },
        { value: 'ranger', label: 'סייר', labelEn: 'Ranger' },
        { value: 'barbarian', label: 'ברברי', labelEn: 'Barbarian' },
        { value: 'bard', label: 'פייטן', labelEn: 'Bard' },
        { value: 'druid', label: 'דרואיד', labelEn: 'Druid' },
        { value: 'monk', label: 'נזיר', labelEn: 'Monk' },
        { value: 'sorcerer', label: 'מכשף', labelEn: 'Sorcerer' },
        { value: 'warlock', label: 'אמגוש', labelEn: 'Warlock' }
    ] as SelectOption[],

    backgrounds: [
        { value: 'dungeon', label: 'מבוך אפל', labelEn: 'Dark Dungeon' },
        { value: 'forest', label: 'יער עבות', labelEn: 'Dense Forest' },
        { value: 'tavern', label: 'פונדק', labelEn: 'Tavern' },
        { value: 'city_street', label: 'רחוב עיר', labelEn: 'City Street' },
        { value: 'library', label: 'ספרייה עתיקה', labelEn: 'Ancient Library' },
        { value: 'mountain', label: 'פסגת הר', labelEn: 'Mountain Peak' },
        { value: 'desert', label: 'מדבר', labelEn: 'Desert' },
        { value: 'none', label: 'רקע חלק', labelEn: 'Plain/Studio' }
    ] as SelectOption[],

    artStyles: [
        { value: 'realistic', label: 'ריאליסטי', labelEn: 'Realistic' },
        { value: 'oil_painting', label: 'ציור שמן', labelEn: 'Oil Painting' },
        { value: 'dark_fantasy', label: 'פנטזיה אפלה', labelEn: 'Dark Fantasy' },
        { value: 'anime', label: 'אנימה', labelEn: 'Anime' },
        { value: 'manga_action', label: 'מנגה אקשן', labelEn: 'Manga Action' },
        { value: 'comic_book', label: 'קומיקס', labelEn: 'Comic Book' },
        { value: 'watercolor_lineart', label: 'צבעי מים', labelEn: 'Watercolor' },
        { value: 'premium_fantasy', label: 'פנטזיה יוקרתית', labelEn: 'Premium Fantasy' },
        { value: 'ink_drawing', label: 'דיו עתיק (D&D)', labelEn: 'Vintage Ink' },
        { value: 'epic_fantasy', label: 'תחריט עץ עתיק', labelEn: 'Epic Woodcut' },
        { value: 'vintage_etching', label: 'תחריט ויקטוריאני', labelEn: 'Victorian Etching' },
        { value: 'stained_glass', label: 'ויטראז\'', labelEn: 'Stained Glass' },
        { value: 'sketch', label: 'רישום עיפרון', labelEn: 'Pencil Sketch' },
        { value: 'pixel', label: 'פיקסל ארט', labelEn: 'Pixel Art' },
        { value: 'synthwave', label: 'סינת\'ווייב', labelEn: 'Synthwave' }
    ] as SelectOption[],

    portraitStyles: [
        { value: 'portrait', label: 'פנים בלבד', labelEn: 'Portrait (Face)' },
        { value: 'full_body', label: 'גוף מלא', labelEn: 'Full Body' }
    ] as SelectOption[],

    poses: [
        { value: 'standing', label: 'עמידה רגילה', labelEn: 'Normal Standing' },
        { value: 'combat', label: 'תנוחת קרב', labelEn: 'Combat Stance' },
        { value: 'casting', label: 'הטלת לחש', labelEn: 'Casting Spell' },
        { value: 'stealth', label: 'התגנבות', labelEn: 'Stealth' },
        { value: 'sitting', label: 'ישיבה', labelEn: 'Sitting' }
    ] as SelectOption[]
};
