import { useState } from 'react';
import { Logger } from '../../../utils/Logger';
import { useCardContext } from '../../../store';
import { useGemini } from '../../../hooks/useGemini';
import { useImageGenerator } from '../../../hooks/useImageGenerator';
import { useBackgroundGenerator } from '../../../hooks/useBackgroundGenerator';
import { useWorkerPassword } from '../../../hooks/useWorkerPassword';
import { storageService } from '../../../services/storage';
import { TYPE_TO_SUBTYPES } from '../../../data/itemSubtypes';
import type { CardData } from '../../../types';
import './ItemCreationForm.css';

function ItemCreationForm() {
    const { setCardData, state, updateOffset } = useCardContext();
    const { generateItem, isLoading: isGenerating, error: genError } = useGemini();
    const { generateImage, isGenerating: isGeneratingImage, error: imageError } = useImageGenerator();
    const { generateBackground, isGenerating: isGeneratingBg, error: bgError } = useBackgroundGenerator();
    const { password, isConfigured, savePassword } = useWorkerPassword();

    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [tempPassword, setTempPassword] = useState('');

    // Sections state - converted to continuous scroll

    const [type, setType] = useState('נשק');
    const [rarity, setRarity] = useState('לא נפוץ');
    const [name, setName] = useState('');
    const [ability, setAbility] = useState('');
    const [description, setDescription] = useState('');

    // Level and type-specific fields

    const [attunement, setAttunement] = useState(false);
    const [subtype, setSubtype] = useState('Longsword (חרב ארוכה)');

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
    const [cardTheme, setCardTheme] = useState('Arcane');

    const handleCreate = async () => {
        if (!isConfigured) {
            setShowPasswordInput(true);
            return;
        }

        try {
            Logger.info('ItemCreationForm', 'Starting full card generation');

            // Step 1: Generate AI Text Content
            Logger.info('ItemCreationForm', 'Step 1/3: Generating text with AI');
            const result = await generateItem(
                { type: subtype || type, rarity, level: 5 },
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
                        itemSubtype: result.typeHe,
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
                setCardData(newCard);
            } catch (imgError) {
                Logger.warn('ItemCreationForm', 'Image generation failed, continuing', imgError);
            }

            // Step 3: Generate Background using cardTheme from IMAGE OPTIONS
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

    const handleGenerateWithAI = async () => {
        if (!isConfigured) {
            setShowPasswordInput(true);
            return;
        }

        try {
            const result = await generateItem(
                { type: subtype || type, rarity, level: 5 },
                password
            );

            // Compute quickStats from weaponDamage or armorClass if not provided
            const computedStats = result.quickStats ||
                (result.weaponDamage ? result.weaponDamage : '') ||
                (result.armorClass ? `AC ${result.armorClass}` : '');

            const newCard: CardData = {
                // Preserve existing images
                ...(state.cardData || {}),
                // Update text content from AI
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
                // Preserve existing URLs explicitly
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
            // Also update local fields to reflect AI result


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

        // Smart detection: Use form fields if available, otherwise fall back to current card data
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
                    itemType: type, // Pass High-Level Type (Potion, Weapon, etc.)
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
                const newCard: CardData = {
                    name: name || 'New Card',
                    typeHe: type,
                    rarityHe: rarity,
                    abilityName: ability,
                    abilityDesc: '',
                    description: description,
                    itemImageUrl: imageUrl,
                    front: {
                        title: name || 'New Card',
                        type: subtype || type,
                        rarity,
                        imageUrl: imageUrl
                    },
                    back: {
                        title: ability,
                        mechanics: '',
                        lore: description
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
            Logger.info('ItemCreationForm', `Generating ${cardTheme} background`, { model: imageModel });

            const bgUrl = await generateBackground(password, cardTheme, imageStyle, imageModel);

            if (bgUrl) {
                if (state.cardData) {
                    const updatedCard = {
                        ...state.cardData,
                        backgroundUrl: bgUrl
                    };
                    setCardData(updatedCard);
                } else {
                    // Create a minimal card with just the background
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
                            <button onClick={handleSavePassword} className="save-key-btn">
                                Save Password
                            </button>
                            <button onClick={() => setShowPasswordInput(false)} className="cancel-btn">
                                Cancel
                            </button>
                        </div>
                        <small>Password is stored locally in your browser</small>
                    </div>
                )}

                {/* Collapsible Section: Basic Info */}
                <div className="section-header" onClick={() => toggleSection('basic')}>
                    <span className="section-title">📋 Basic Info</span>
                    <span className="section-icon">{openSection === 'basic' ? '▼' : '▶'}</span>
                </div>
                {openSection === 'basic' && (
                    <div className="section-content">
                        <div className="form-group">
                            <label>Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="נשק">נשק (Weapon)</option>
                                <option value="שריון">שריון (Armor)</option>
                                <option value="שיקוי">שיקוי (Potion)</option>
                                <option value="טבעת">טבעת (Ring)</option>
                                <option value="פריט נפלא">פריט נפלא (Wondrous)</option>
                            </select>
                        </div>

                        {/* Subtype Dropdown - shows for all types that have subtypes */}
                        {TYPE_TO_SUBTYPES[type] && (
                            <div className="form-group">
                                <label>חפץ ספציפי (Specific Item)</label>
                                <select value={subtype} onChange={(e) => setSubtype(e.target.value)}>
                                    <option value="">-- בחר חפץ --</option>
                                    {Object.entries(TYPE_TO_SUBTYPES[type]).map(([category, items]) => (
                                        <optgroup key={category} label={category}>
                                            {items.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        )}


                        <div className="form-group rarity-slider-group">
                            <label>Rarity</label>
                            <div className="rarity-slider-container">
                                <input
                                    type="range"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={['נפוץ', 'לא נפוץ', 'נדיר', 'נדיר מאוד', 'אגדי'].indexOf(rarity)}
                                    onChange={(e) => {
                                        const rarities = ['נפוץ', 'לא נפוץ', 'נדיר', 'נדיר מאוד', 'אגדי'];
                                        setRarity(rarities[parseInt(e.target.value)]);
                                    }}
                                    className="rarity-slider"
                                />
                                <div className="rarity-diamonds">
                                    <span
                                        className={`rarity-diamond common ${rarity === 'נפוץ' ? 'active' : ''}`}
                                        onClick={() => setRarity('נפוץ')}
                                        data-tooltip="(Common) נפוץ"
                                    >◆</span>
                                    <span
                                        className={`rarity-diamond uncommon ${rarity === 'לא נפוץ' ? 'active' : ''}`}
                                        onClick={() => setRarity('לא נפוץ')}
                                        data-tooltip="(Uncommon) לא נפוץ"
                                    >◆</span>
                                    <span
                                        className={`rarity-diamond rare ${rarity === 'נדיר' ? 'active' : ''}`}
                                        onClick={() => setRarity('נדיר')}
                                        data-tooltip="(Rare) נדיר"
                                    >◆</span>
                                    <span
                                        className={`rarity-diamond very-rare ${rarity === 'נדיר מאוד' ? 'active' : ''}`}
                                        onClick={() => setRarity('נדיר מאוד')}
                                        data-tooltip="(Very Rare) נדיר מאוד"
                                    >◆</span>
                                    <span
                                        className={`rarity-diamond legendary ${rarity === 'אגדי' ? 'active' : ''}`}
                                        onClick={() => setRarity('אגדי')}
                                        data-tooltip="(Legendary) אגדי"
                                    >◆</span>
                                </div>
                            </div>
                        </div>



                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="attunement"
                                checked={attunement}
                                onChange={(e) => setAttunement(e.target.checked)}
                            />
                            <label htmlFor="attunement" style={{ margin: 0 }}>Requires Attunement</label>
                        </div>
                    </div>
                )}





                {/* Collapsible Section: Image Options */}
                <div className="section-header" onClick={() => toggleSection('image')}>
                    <span className="section-title">🎨 Image Options</span>
                    <span className="section-icon">{openSection === 'image' ? '▼' : '▶'}</span>
                </div>
                {openSection === 'image' && (
                    <div className="section-content">
                        <div className="form-group">
                            <label>Image Model</label>
                            <select
                                value={imageModel}
                                onChange={(e) => {
                                    const val = e.target.value as any;
                                    setImageModel(val);
                                    localStorage.setItem('dnd_image_model', val);
                                }}
                            >
                                <option value="flux">FLUX Schnell (Fast)</option>
                                <option value="z-image">Z-Image Turbo (Faster)</option>
                                <option value="fal-zimage">FAL Z-Image (Budget)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Style</label>
                            <select value={imageStyle} onChange={(e) => {
                                const val = e.target.value as any;
                                setImageStyle(val);
                                localStorage.setItem('dnd_image_style', val);
                            }}>
                                <option value="realistic">Realistic</option>
                                <option value="watercolor">Watercolor</option>
                                <option value="oil">Oil Painting</option>
                                <option value="sketch">Pencil Sketch</option>
                                <option value="dark_fantasy">Dark Fantasy</option>
                                <option value="epic_fantasy">Epic Fantasy</option>
                                <option value="anime">Anime</option>
                                <option value="pixel">Pixel Art</option>
                                <option value="stained_glass">Stained Glass</option>
                                <option value="simple_icon">Flat Icon</option>
                                <option value="ink_drawing">Ink Drawing</option>
                                <option value="silhouette">Silhouette</option>
                                <option value="synthwave">Synthwave</option>
                                <option value="comic_book">Exaggerated Comic</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Item Image Background</label>
                            <select value={backgroundOption} onChange={(e) => setBackgroundOption(e.target.value as any)}>
                                <option value="no-background">No Background (Clean)</option>
                                <option value="natural">Natural Bokeh (Blurred)</option>
                                <option value="colored">Colored Gradient</option>
                            </select>
                        </div>

                        {/* Item Image Theme - Only relevant if background is natural */}
                        {backgroundOption === 'natural' && (
                            <div className="form-group">
                                <label>Item Theme (for natural backgrounds)</label>
                                <select value={imageTheme} onChange={(e) => setImageTheme(e.target.value)}>
                                    <option value="Nature">🌲 Nature</option>
                                    <option value="Fire">🔥 Fire</option>
                                    <option value="Ice">❄️ Ice</option>
                                    <option value="Lightning">⚡ Lightning</option>
                                    <option value="Arcane">🔮 Arcane</option>
                                    <option value="Divine">✨ Divine</option>
                                    <option value="Necrotic">💀 Necrotic</option>
                                    <option value="Ocean">🌊 Ocean</option>
                                    <option value="Shadow">🌑 Shadow</option>
                                    <option value="Celestial">🌌 Celestial</option>
                                    <option value="Blood">🩸 Blood</option>
                                    <option value="Industrial">⚙️ Industrial</option>
                                    <option value="Iron">🔨 Iron/Forge</option>
                                    <option value="Old Scroll">📜 Ancient Library</option>
                                    <option value="Elemental">💫 Elemental Chaos</option>
                                </select>
                            </div>
                        )}

                        <div style={{ margin: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

                        {/* Card Background Theme - Always Visible */}
                        <div className="form-group">
                            <label style={{ color: '#d4af37' }}>Card Background Theme</label>
                            <select
                                value={cardTheme}
                                onChange={(e) => {
                                    const newTheme = e.target.value;
                                    setCardTheme(newTheme);
                                    // Auto-sync item theme to match card background theme
                                    setImageTheme(newTheme);
                                }}
                            >
                                <option value="Nature">🌲 Nature</option>
                                <option value="Fire">🔥 Fire</option>
                                <option value="Ice">❄️ Ice</option>
                                <option value="Lightning">⚡ Lightning</option>
                                <option value="Arcane">🔮 Arcane</option>
                                <option value="Divine">✨ Divine</option>
                                <option value="Necrotic">💀 Necrotic</option>
                                <option value="Ocean">🌊 Ocean</option>
                                <option value="Shadow">🌑 Shadow</option>
                                <option value="Celestial">🌌 Celestial</option>
                                <option value="Blood">🩸 Blood</option>
                                <option value="Industrial">⚙️ Industrial</option>
                                <option value="Iron">🔨 Iron/Forge</option>
                                <option value="Old Scroll">📜 Ancient Library</option>
                                <option value="Elemental">💫 Elemental Chaos</option>
                            </select>
                            <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7em', marginTop: '4px', display: 'block' }}>
                                Used when clicking "BG" button below
                            </small>
                        </div>

                        <div className="form-group" style={{ marginTop: '0.5rem' }}>
                            <label>זום רקע (Background Zoom)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="range"
                                    min="1.0"
                                    max="1.5"
                                    step="0.05"
                                    value={state.settings?.front?.offsets?.backgroundScale ?? 1}
                                    onChange={(e) => updateOffset('backgroundScale', parseFloat(e.target.value), 'front')}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ minWidth: '40px', textAlign: 'right' }}>
                                    {(state.settings?.front?.offsets?.backgroundScale ?? 1).toFixed(2)}x
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {bgError && (
                    <div className="error-message">
                        ⚠️ {bgError}
                    </div>
                )}

                {genError && (
                    <div className="error-message">
                        ⚠️ {genError}
                    </div>
                )}

                {imageError && (
                    <div className="error-message">
                        ⚠️ Image: {imageError}
                    </div>
                )}
            </div>

            {/* Sticky Action Buttons - Fixed footer bottom-right */}
            <div className="sticky-buttons">
                {/* CREATE CARD button on the left */}
                <button onClick={handleCreate} className="create-btn">
                    CREATE CARD ✨
                </button>
                {/* Vertical stack of 3 colored buttons on the right */}
                <div className="button-stack-vertical">
                    <button
                        onClick={handleGenerateImage}
                        className="generate-btn image-btn compact"
                        disabled={isGeneratingImage}
                    >
                        {isGeneratingImage ? '🔄' : 'IMG 🎨'}
                    </button>
                    <button
                        onClick={handleGenerateWithAI}
                        className="generate-btn ai-text-btn compact"
                        disabled={isGenerating}
                    >
                        {isGenerating ? '🔄' : 'AI 🤖'}
                    </button>
                    <button
                        onClick={handleGenerateBackground}
                        className="generate-btn bg-btn compact"
                        disabled={isGeneratingBg}
                    >
                        {isGeneratingBg ? '🔄' : 'BG 🖼️'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ItemCreationForm;
