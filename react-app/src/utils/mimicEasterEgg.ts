// Mimic Easter Egg Card Data
import mimicFrame from '../assets/mimic-frame-v2.png';
import mimicEye from '../assets/mimic-eye-v2.png';

// Define the Mimic Card Data
// This is the "hidden item" that gets triggered
export const MIMIC_CARD_DATA: any = {
    name: 'המימיק המצחקק',
    front: {
        title: 'המימיק המצחקק',
        type: 'מפלצת',
        rarity: 'אגדי',
        imageUrl: mimicEye,
        imageStyle: 'circle',
        quickStats: '10d10 נשיכה',
        gold: 'אין',
        badges: []
    },
    back: {
        title: 'הפתעה נבזית',
        mechanics: 'כאשר דמות מנסה לפתוח את התיבה, התיבה מנסה לפתוח את הדמות.',
        lore: '"שמעת משהו? נשבע לך שהתיבה הזאת כרגע ליקקה את השפתיים..." - הרפתקן לא זהיר'
    },
    // Legacy / Flat fields fallback
    type: 'מפלצת',
    typeHe: 'מפלצת',
    subtype: 'משנה צורה',
    rarity: 'אגדי',
    weaponDamage: '10d10',
    gold: '0',
    abilityName: 'הפתעה נבזית',
    abilityDesc: 'כאשר דמות מנסה לפתוח את התיבה, התיבה מנסה לפתוח את הדמות.',
    imageStyle: 'circle',

    backgroundUrl: mimicFrame,
    description: 'תיבה תמימה למראה... או שלא?',
    legacy: false
};
