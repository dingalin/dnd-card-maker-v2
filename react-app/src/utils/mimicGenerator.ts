import { MIMIC_CARD_DATA } from './mimicEasterEgg';
import { Logger } from './Logger';

const MIMIC_TYPES = [
    {
        name: 'Mimic Table',
        prompt: 'wooden dining table that is actually a mimic monster, mouth opening in the middle of table top, teeth, organic texture',
        geminiContext: 'A mimic disguised as a dining table (שולחן). The players might try to eat on it.'
    },
    {
        name: 'Mimic Chest',
        prompt: 'classic fantasy treasure chest that is a mimic monster, lid opening to reveal sharp teeth and tongue, eyes on the lock',
        geminiContext: 'A mimic disguised as a treasure chest (תיבת אוצר). Classic trap.'
    },
    {
        name: 'Mimic Door',
        prompt: 'sturdy wooden dungeon door that is a mimic monster, wood grain forming a face, keyhole is an eye, mouth in the doorway',
        geminiContext: 'A mimic disguised as a door (דלת). It bites anyone who knocks.'
    },
    {
        name: 'Mimic Chair',
        prompt: 'ornate wooden throne chair that is a mimic monster, seat cushion is a tongue, arms have claws',
        geminiContext: 'A mimic disguised as a chair (כיסא). It waits for someone to sit.'
    },
    {
        name: 'Mimic Rug',
        prompt: 'ornate persian rug lying flat that is a mimic monster, patterns forming teeth and eyes, rippling organic texture',
        geminiContext: 'A mimic disguised as a rug (שטיח). It wraps around victims.'
    }
];

export const generateMimicCard = async (
    password: string,
    generateItem: any,
    generateImage: any,
    generateBackground: any,
    setCardData: any,
    updateCustomStyle?: any
) => {
    if (!password) {
        Logger.error('MimicGenerator', 'Missing API password for generation');
        setCardData(MIMIC_CARD_DATA);
        return;
    }

    // Get User Preferences from LocalStorage
    const savedStyle = (localStorage.getItem('dnd_image_style') as any) || 'realistic';
    const savedModel = (localStorage.getItem('dnd_image_model') as any) || 'flux';

    Logger.info('MimicGenerator', `Generating Specific Mimic Card (${savedStyle})`);

    // 1. Pick a Random Type
    const selectedType = MIMIC_TYPES[Math.floor(Math.random() * MIMIC_TYPES.length)];
    Logger.debug('MimicGenerator', `Selected Archetype: ${selectedType.name}`);

    // 2. Generate Text Content (Gemini)
    const geminiPrompt = `You are a mischievous D&D dungeon master. Create a "Mimic" monster based on this concept: ${selectedType.geminiContext}.
    
    RETURN JSON ONLY:
    {
      "name": "Hebrew Name (e.g. 'השולחן הרעב')",
      "typeHe": "מפלצת",
      "rarityHe": "אגדי",
      "abilityName": "Creative Hebrew Ability Name",
      "abilityDesc": "Hebrew description of how this specific mimic attacks.",
      "description": "Short humorous Hebrew flavor text about its disguise (max 20 words).",
      "visualPrompt": "English description of the ${selectedType.name} suited for image generation, ${savedStyle} art style"
    }`;

    let itemData: any = { ...MIMIC_CARD_DATA };

    try {
        const generated = await generateItem(
            { type: 'Monster', rarity: 'Legendary' },
            password,
            geminiPrompt
        );
        if (generated) {
            itemData = { ...itemData, ...generated };
        }
    } catch (e) {
        Logger.error('MimicGenerator', 'Failed to generate mimic text', e);
    }

    // 3. Generate Item Image (Flux) - WHITE background for clean removal
    let imageUrl = MIMIC_CARD_DATA.itemImageUrl || MIMIC_CARD_DATA.front?.imageUrl;
    const visualDetails = itemData.visualPrompt || selectedType.prompt;

    try {
        Logger.info('MimicGenerator', 'Generating Mimic Image');
        // WHITE background for easy removal, then transparent on black card
        imageUrl = await generateImage({
            visualPrompt: `${visualDetails}, centered, dramatic lighting, isolated on pure white background, ${savedStyle} style`,
            backgroundOption: 'no-background', // rembg will remove white
            style: savedStyle,
            model: savedModel
        }, password);
        Logger.debug('MimicGenerator', 'Generated Mimic Image', imageUrl);
    } catch (e) {
        Logger.error('MimicGenerator', 'Failed to generate mimic image', e);
    }

    // 4. Generate Frame (Background) - MIMIC FRAME with dark center
    let backgroundUrl = MIMIC_CARD_DATA.backgroundUrl;
    try {
        Logger.info('MimicGenerator', 'Generating Mimic Frame');
        backgroundUrl = await generateBackground(
            password,
            'Necrotic',
            savedStyle,
            savedModel,
            `fantasy card frame border, mimic monster theme, sharp teeth around all edges, organic flesh and wood texture, dark black center, creepy tentacles in corners, monster eyes on the frame, vertical portrait format, ${savedStyle} art style`
        );
        Logger.debug('MimicGenerator', 'Generated Mimic Frame', backgroundUrl);
    } catch (e) {
        Logger.error('MimicGenerator', 'Failed to generate mimic frame', e);
    }

    // 5. Assemble and Set Data - USE itemImageUrl (TOP LEVEL!)
    const newCardData = {
        ...MIMIC_CARD_DATA,
        name: itemData.name || MIMIC_CARD_DATA.name,
        itemImageUrl: imageUrl, // <-- TOP LEVEL for CardCanvas!
        backgroundUrl: backgroundUrl,
        front: {
            ...MIMIC_CARD_DATA.front,
            title: itemData.name || MIMIC_CARD_DATA.front.title,
            imageUrl: imageUrl, // Also set here for legacy
            type: itemData.typeHe || 'מפלצת',
            rarity: itemData.rarityHe || 'אגדי',
        },
        back: {
            ...MIMIC_CARD_DATA.back,
            title: itemData.abilityName || MIMIC_CARD_DATA.back.title,
            mechanics: itemData.abilityDesc || MIMIC_CARD_DATA.back.mechanics,
            lore: itemData.description || MIMIC_CARD_DATA.back.lore
        },
        description: itemData.description || MIMIC_CARD_DATA.description,

        // Legacy
        abilityName: itemData.abilityName || MIMIC_CARD_DATA.abilityName,
        abilityDesc: itemData.abilityDesc || MIMIC_CARD_DATA.abilityDesc,
        type: itemData.typeHe || 'מפלצת',
        rarity: 'אגדי'
    };


    Logger.debug('MimicGenerator', 'Setting Card Data', newCardData);
    setCardData(newCardData);

    // 6. Force Style Settings for Visibility
    if (updateCustomStyle && typeof updateCustomStyle === 'function') {
        Logger.info('MimicGenerator', 'Enforcing Mimic Styles');
        try {
            // Correct Signature: (key, value, side)
            updateCustomStyle('itemImage_fade', 0, 'front');
            updateCustomStyle('itemImage_opacity', 1, 'front');
            updateCustomStyle('itemImage_maskShape', 'circle', 'front');

            // Bright shadow to pop from BLACK background
            updateCustomStyle('itemImage_shadowBlur', 30, 'front');
            updateCustomStyle('itemImage_shadowColor', '#8B0000', 'front'); // Dark red glow
            updateCustomStyle('itemImage_shadowOpacity', 1, 'front');
            updateCustomStyle('itemImage_shadowOffsetX', 0, 'front');
            updateCustomStyle('itemImage_shadowOffsetY', 0, 'front');

            // TEXT GLOW for readability on dark background (FRONT)
            const textGlowColor = '#FF6600'; // Orange glow
            const textGlowBlur = 8;

            // Front side text elements
            ['title', 'type', 'rarity', 'stats', 'gold'].forEach(element => {
                updateCustomStyle(`${element}_shadowColor`, textGlowColor, 'front');
                updateCustomStyle(`${element}_shadowBlur`, textGlowBlur, 'front');
                updateCustomStyle(`${element}_shadowOpacity`, 1, 'front');
            });

            // Back side text elements
            ['abilityName', 'mechanics', 'lore'].forEach(element => {
                updateCustomStyle(`${element}_shadowColor`, textGlowColor, 'back');
                updateCustomStyle(`${element}_shadowBlur`, textGlowBlur, 'back');
                updateCustomStyle(`${element}_shadowOpacity`, 1, 'back');
            });

            Logger.debug('MimicGenerator', 'Text glow applied for dark background');

        } catch (err) {
            Logger.error('MimicGenerator', 'Error updating styles', err);
        }
    }

    Logger.info('MimicGenerator', 'Specific Mimic Card Complete');
};
