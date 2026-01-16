import { useState } from 'react';
import { Logger } from '../../../utils/Logger';
import { useCardContext } from '../../../store';
import { useGemini } from '../../../hooks/useGemini';
import { useImageGenerator } from '../../../hooks/useImageGenerator';
import { useBackgroundGenerator } from '../../../hooks/useBackgroundGenerator';
import { useWorkerPassword } from '../../../hooks/useWorkerPassword';
import { storageService } from '../../../services/storage';
import type { CardData } from '../../../types';
import './ItemCreationForm.css';

// Sub-components
import { BasicInfoSection } from './BasicInfoSection';
import { ImageOptionsSection } from './ImageOptionsSection';
import { ActionButtons } from './ActionButtons';

interface ItemCreationFormProps {
    onOpenStyles?: () => void;
}

function ItemCreationForm({ onOpenStyles: _onOpenStyles }: ItemCreationFormProps) {
    const { setCardData, state } = useCardContext();
    const { generateItem, isLoading: isGenerating, error: genError } = useGemini();
    const { generateImage, isGenerating: isGeneratingImage, error: imageError } = useImageGenerator();
    const { generateBackground, isGenerating: isGeneratingBg, error: bgError } = useBackgroundGenerator();
    const { password, isConfigured, savePassword } = useWorkerPassword();

    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [tempPassword, setTempPassword] = useState('');

    // Form State
    const [type, setType] = useState('נשק');
    const [subtype, setSubtype] = useState('');
    const [rarity, setRarity] = useState('לא נפוץ');
    const [attunement, setAttunement] = useState(false);

    // AI/Local State (Shadows of card data for generation context)
    const [name, setName] = useState('');
    const [ability, setAbility] = useState('');
    const [description, setDescription] = useState('');

    // Collapsible sections state
    const [openSection, setOpenSection] = useState<string | null>('basic');
    const toggleSection = (section: string) => {
        setOpenSection(prev => prev === section ? null : section);
    };

    // Image generation options
    const [imageModel, setImageModel] = useState<'flux' | 'z-image' | 'fal-zimage'>(() => {
        return (localStorage.getItem('dnd_image_model') as any) || 'z-image';
    });
    const [imageStyle, setImageStyle] = useState<'realistic' | 'watercolor' | 'oil' | 'sketch' | 'dark_fantasy' | 'epic_fantasy' | 'anime' | 'pixel' | 'stained_glass' | 'simple_icon' | 'ink_drawing' | 'silhouette' | 'synthwave'>(() => {
        return (localStorage.getItem('dnd_image_style') as any) || 'realistic';
    });
    const [backgroundOption, setBackgroundOption] = useState<'natural' | 'colored' | 'no-background'>('no-background');
    const [imageTheme, setImageTheme] = useState('Nature');
    const [cardTheme, setCardTheme] = useState('Passive');

    // ==========================================
    // HANDLERS
    // ==========================================

    const handleCreate = async () => {
        if (!isConfigured) {
            setShowPasswordInput(true);
            return;
        }

        try {
            Logger.info('ItemCreationForm', 'Starting full card generation');

            // Step 1: Generate AI Text Content
            Logger.info('ItemCreationForm', 'Step 1/3: Generating text with AI');
            const level = getLevelFromRarity(rarity);
            const result = await generateItem(
                { type: type, subtype: subtype, rarity, level },
                password
            );

            const computedStats = result.quickStats ||
                (result.weaponDamage ? result.weaponDamage : '') ||
                (result.armorClass ? `AC ${result.armorClass}` : '');

            let newCard: CardData = {
                name: result.name,
                typeHe: result.typeHe,
                subtype: subtype || result.typeHe,
                rarityHe: result.rarityHe,
                abilityName: result.abilityName,
                abilityDesc: result.abilityDesc,
                description: result.description,
                gold: result.gold,
                quickStats: computedStats,
                weaponDamage: result.weaponDamage,
                armorClass: result.armorClass,
                front: {
                    title: result.name,
                    type: subtype || result.typeHe,
                    rarity: result.rarityHe,
                    quickStats: computedStats,
                    gold: result.gold + ' זהב'
                },
                back: {
                    title: result.abilityName,
                    mechanics: result.abilityDesc,
                    lore: result.description
                },
                legacy: false
            };

            setCardData(newCard);
            setName(result.name);
            setAbility(result.abilityName);
            setDescription(result.description);


            // Step 2: Generate Item Image
            Logger.info('ItemCreationForm', 'Step 2/3: Generating item image');
            try {
                const visualPrompt = result.description || result.name || 'fantasy magic item';
                const imageUrl = await generateImage(
                    {
                        visualPrompt,
                        itemType: type,
                        itemSubtype: subtype || result.typeHe || 'Longsword (חרב ארוכה)',
                        abilityDesc: result.abilityName,
                        model: imageModel,
                        style: imageStyle,
                        backgroundOption: backgroundOption,
                        theme: imageTheme
                    },
                    password
                );
                newCard = { ...newCard, itemImageUrl: imageUrl };
                setCardData(newCard);
            } catch (imgError) {
                Logger.warn('ItemCreationForm', 'Image generation failed, continuing', imgError);
            }

            // Step 3: Generate Background
            Logger.info('ItemCreationForm', 'Step 3/3: Generating background');
            try {
                const bgUrl = await generateBackground(password, cardTheme, imageStyle, imageModel);
                if (bgUrl) {
                    newCard = { ...newCard, backgroundUrl: bgUrl };
                    setCardData(newCard);
                }
            } catch (bgError) {
                Logger.warn('ItemCreationForm', 'Background generation failed, continuing', bgError);
            }

            saveToHistory(newCard);
            Logger.info('ItemCreationForm', 'Full card generation complete');

        } catch (error: any) {
            Logger.error('ItemCreationForm', 'Card generation failed', error);
            alert(`Failed to generate card: ${error.message}`);
        }
    };

    const getLevelFromRarity = (r: string): number => {
        switch (r) {
            case 'נפוץ': return 1;
            case 'לא נפוץ': return 5;
            case 'נדיר': return 10;
            case 'נדיר מאוד': return 15;
            case 'אגדי': return 20;
            default: return 5;
        }
    };

    const handleGenerateWithAI = async () => {
        if (!isConfigured) {
            setShowPasswordInput(true);
            return;
        }

        try {
            const level = getLevelFromRarity(rarity);
            const result = await generateItem(
                { type: type, subtype: subtype, rarity, level },
                password
            );

            const computedStats = result.quickStats ||
                (result.weaponDamage ? result.weaponDamage : '') ||
                (result.armorClass ? `AC ${result.armorClass}` : '');

            const newCard: CardData = {
                ...(state.cardData || {}),
                name: result.name,
                typeHe: result.typeHe,
                subtype: subtype || result.typeHe,
                rarityHe: result.rarityHe,
                abilityName: result.abilityName,
                abilityDesc: result.abilityDesc,
                description: result.description,
                gold: result.gold,
                quickStats: computedStats,
                weaponDamage: result.weaponDamage,
                armorClass: result.armorClass,
                backgroundUrl: state.cardData?.backgroundUrl,
                itemImageUrl: state.cardData?.itemImageUrl,
                front: {
                    ...(state.cardData?.front || {}),
                    title: result.name,
                    type: subtype || result.typeHe,
                    rarity: result.rarityHe,
                    quickStats: computedStats,
                    gold: result.gold + ' זהב'
                },
                back: {
                    ...(state.cardData?.back || {}),
                    title: result.abilityName,
                    mechanics: result.abilityDesc,
                    lore: result.description
                },
                legacy: false
            };

            setCardData(newCard);
            saveToHistory(newCard);

            setName(result.name);
            setAbility(result.abilityName);
            setDescription(result.description);

        } catch (error: any) {
            Logger.error('ItemCreationForm', 'AI Generation failed', error);
            alert(`Failed to generate: ${error.message}`);
        }
    };

    const handleGenerateImage = async () => {
        if (!isConfigured) {
            setShowPasswordInput(true);
            return;
        }

        const effectiveName = name || state.cardData?.name || state.cardData?.front?.title || '';
        const effectiveDescription = description || state.cardData?.description || state.cardData?.abilityDesc || '';
        const effectiveType = subtype || type || state.cardData?.subtype || state.cardData?.typeHe || 'fantasy item';
        const effectiveAbility = ability || state.cardData?.abilityName || '';

        if (!effectiveName && !effectiveDescription) {
            alert('אין מידע על החפץ. אנא הזן שם או תיאור, או צור קלף קודם.');
            return;
        }

        try {
            const visualPrompt = effectiveDescription || effectiveName || 'fantasy magic item';
            const imageUrl = await generateImage(
                {
                    visualPrompt,
                    itemType: type,
                    itemSubtype: effectiveType,
                    abilityDesc: effectiveAbility,
                    model: imageModel,
                    style: imageStyle,
                    backgroundOption: backgroundOption,
                    theme: imageTheme
                },
                password
            );

            if (state.cardData) {
                const updatedCard = {
                    ...state.cardData,
                    itemImageUrl: imageUrl
                };
                setCardData(updatedCard);
            } else {
                // Create minimal new card
                const newCard: CardData = {
                    name: effectiveName || 'New Card',
                    typeHe: type,
                    rarityHe: rarity,
                    abilityName: ability,
                    abilityDesc: '',
                    description: effectiveDescription,
                    itemImageUrl: imageUrl,
                    front: {
                        title: effectiveName || 'New Card',
                        type: subtype || type,
                        rarity,
                        imageUrl: imageUrl
                    },
                    back: {
                        title: ability,
                        mechanics: '',
                        lore: effectiveDescription
                    }
                };
                setCardData(newCard);
                saveToHistory(newCard);
            }

            Logger.info('ItemCreationForm', 'Image generated successfully');
        } catch (error: any) {
            Logger.error('ItemCreationForm', 'Image generation failed', error);
            alert(`Failed to generate image: ${error.message}`);
        }
    };

    const handleGenerateBackground = async () => {
        if (!isConfigured) {
            setShowPasswordInput(true);
            return;
        }

        try {
            Logger.info('ItemCreationForm', `Generating background with theme: ${cardTheme}, style: ${imageStyle}`, { model: imageModel });
            const bgUrl = await generateBackground(password, cardTheme, imageStyle, imageModel);

            if (bgUrl) {
                if (state.cardData) {
                    const updatedCard = {
                        ...state.cardData,
                        backgroundUrl: bgUrl
                    };
                    setCardData(updatedCard);
                } else {
                    const newCard: CardData = {
                        name: 'New Card',
                        typeHe: type,
                        rarityHe: rarity,
                        backgroundUrl: bgUrl,
                        front: { title: 'New Card', type, rarity }
                    };
                    setCardData(newCard);
                }
                Logger.info('ItemCreationForm', 'Background generated successfully');
            }
        } catch (error: any) {
            Logger.error('ItemCreationForm', 'Background generation failed', error);
            alert(`Failed to generate background: ${error.message}`);
        }
    };

    const handleSavePassword = () => {
        if (tempPassword.trim()) {
            savePassword(tempPassword.trim());
            setShowPasswordInput(false);
            setTempPassword('');
        }
    };

    const saveToHistory = async (card: CardData) => {
        try {
            await storageService.saveCard({
                id: Date.now(),
                name: card.name || 'Unnamed Card',
                cardData: card,
                settings: state.settings,
                savedAt: new Date().toISOString(),
                thumbnail: null

            });
        } catch (error) {
            Logger.error('ItemCreationForm', 'Failed to save to history', error);
        }
    };

    return (
        <div className="item-creation-form">
            {/* Sticky Action Buttons */}
            <div className="sticky-actions-top">
                <ActionButtons
                    onCreate={handleCreate}
                    onGenerateImage={handleGenerateImage}
                    onGenerateWithAI={handleGenerateWithAI}
                    onGenerateBackground={handleGenerateBackground}
                    isGeneratingImage={isGeneratingImage}
                    isGeneratingAI={isGenerating}
                    isGeneratingBg={isGeneratingBg}
                />
            </div>

            {/* Scrollable Form Content */}
            <div className="form-scroll-content">
                {showPasswordInput && (
                    <div className="api-key-setup">
                        <h3>🔑 Enter Password</h3>
                        <p>To use AI generation, enter the access password:</p>
                        <input
                            type="password"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            placeholder="Enter password..."
                            className="api-key-input"
                        />
                        <div className="api-key-actions">
                            <button onClick={handleSavePassword} className="save-key-btn">Save Password</button>
                            <button onClick={() => setShowPasswordInput(false)} className="cancel-btn">Cancel</button>
                        </div>
                        <small>Password is stored locally in your browser</small>
                    </div>
                )}

                {/* Sub-Components */}
                <BasicInfoSection
                    isOpen={openSection === 'basic'}
                    onToggle={() => toggleSection('basic')}
                    type={type}
                    setType={setType}
                    subtype={subtype}
                    setSubtype={setSubtype}
                    rarity={rarity}
                    setRarity={setRarity}
                    attunement={attunement}
                    setAttunement={setAttunement}
                />

                <ImageOptionsSection
                    isOpen={openSection === 'image'}
                    onToggle={() => toggleSection('image')}
                    imageModel={imageModel}
                    setImageModel={setImageModel}
                    imageStyle={imageStyle}
                    setImageStyle={setImageStyle}
                    backgroundOption={backgroundOption}
                    setBackgroundOption={setBackgroundOption}
                    imageTheme={imageTheme}
                    setImageTheme={setImageTheme}
                    cardTheme={cardTheme}
                    setCardTheme={setCardTheme}
                />

                {bgError && <div className="error-message">⚠️ {bgError}</div>}
                {genError && <div className="error-message">⚠️ {genError}</div>}
                {imageError && <div className="error-message">⚠️ Image: {imageError}</div>}
            </div>


        </div>
    );
}

export default ItemCreationForm;
