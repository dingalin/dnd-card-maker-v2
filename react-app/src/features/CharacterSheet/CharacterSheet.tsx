import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useCharacter } from '../../store/CharacterContext';
import { useDragDrop } from './hooks/useDragDrop';
import type { DragHandlers } from './hooks/useDragDrop';
import EquipmentGrid from './components/EquipmentGrid';
import BackpackGrid from './components/BackpackGrid';
import CharacterSidebar from './components/CharacterSidebar';
import type { CharacterFormData } from './components/CharacterSidebar';
import { useImageGenerator } from '../../hooks/useImageGenerator';
import { useGemini } from '../../hooks/useGemini';
import { useWorkerPassword } from '../../hooks/useWorkerPassword';
import type { EquipmentSlotId, EquippedItem } from './types/character';
import { getSmartLootContext } from '../../utils/SmartLootService';
import { HeadlessCardGenerator } from './components/HeadlessCardGenerator';
import type { HeadlessGeneratorHandle } from './components/HeadlessCardGenerator';
import { CardViewerModal } from '../../components/Modals/CardViewerModal';
import { useCardContext } from '../../store'; // Add CardContext import
import './CharacterSheet.css';

function CharacterSheet() {
    const {
        state,
        setName,
        setPortraitUrl,
        equipFromBackpack,
        unequipToBackpack,
        moveInBackpack,
        equipItem,
        unequipItem, // Add unequipItem
        removeFromBackpack, // Add removeFromBackpack
    } = useCharacter();

    // Headless Card Generator Ref
    const headlessGenRef = useRef<HeadlessGeneratorHandle>(null);

    const navigate = useNavigate(); // Uncomment useNavigate
    const { loadState } = useCardContext(); // Get loadState from CardContext
    // const location = useLocation() as any;
    const { generateImage } = useImageGenerator();
    const { password } = useWorkerPassword();
    const [isGenerating, setIsGenerating] = useState(false);

    // Lifted State for Character Form
    const [characterForm, setCharacterForm] = useState<CharacterFormData>({
        name: '',
        gender: 'male',
        race: 'human',
        charClass: 'fighter',
        background: 'dungeon',
        artStyle: 'oil_painting',
        portraitStyle: 'portrait',
        pose: 'standing',
    });

    const { activeItem, handleDragStart, handleDragEnd } = useDragDrop();

    // Configure sensors for drag
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Min distance before drag starts
            },
        })
    );

    // Drag handlers for state updates
    const dragHandlers: DragHandlers = {
        onEquipFromBackpack: equipFromBackpack,
        onUnequipToBackpack: unequipToBackpack,
        onMoveInBackpack: moveInBackpack,
        onSwapEquipment: (fromSlot, toSlot) => {
            // Swap two equipment items
            const fromItem = state.equipment[fromSlot];
            const toItem = state.equipment[toSlot];
            equipItem(fromSlot, toItem || null);
            equipItem(toSlot, fromItem || null);
        },
    };

    const { generateItem } = useGemini();
    const [loadingSlots, setLoadingSlots] = useState<Record<string, boolean>>({});

    // Viewer State (Track Source ID to allow live updates)
    const [viewingId, setViewingId] = useState<EquipmentSlotId | number | null>(null);
    const [viewingSource, setViewingSource] = useState<'equipment' | 'backpack' | null>(null);

    // Derived Item from State
    const viewingItem = viewingSource === 'equipment'
        ? state.equipment[viewingId as EquipmentSlotId]
        : viewingSource === 'backpack'
            ? state.backpack[viewingId as number]
            : null;

    // Close viewer if item is gone (e.g. deleted) - moved to useEffect to avoid state update during render
    useEffect(() => {
        if (viewingSource && !viewingItem) {
            setViewingId(null);
            setViewingSource(null);
        }
    }, [viewingSource, viewingItem]);

    const handleSlotClick = (slotId: EquipmentSlotId, item: EquippedItem | null) => {
        if (item) {
            setViewingId(slotId);
            setViewingSource('equipment');
        }
    };

    const handleBackpackClick = (index: number, item: EquippedItem | null) => {
        if (item) {
            setViewingId(index);
            setViewingSource('backpack');
        }
    };

    // Viewer Actions
    const handleViewerDelete = () => {
        if (!viewingSource || !viewingItem) return;

        if (confirm(`למחוק את ${viewingItem.name}?`)) {
            if (viewingSource === 'equipment') {
                unequipItem(viewingId as EquipmentSlotId);
            } else {
                removeFromBackpack(viewingId as number);
            }
            // Close viewer
            setViewingId(null);
            setViewingSource(null);
        }
    };

    const handleViewerEdit = () => {
        if (!viewingItem?.cardData) return;

        // Get card settings (if stored on item, otherwise try defaults)
        let cardSettings = (viewingItem as any).settings || null;

        // Create a clean copy of cardData without huge base64 thumbnails
        // (the itemImageUrl might be a massive base64 string causing quota issues)
        const cleanCardData = { ...viewingItem.cardData };

        // Try to save to localStorage, but handle quota errors gracefully
        try {
            localStorage.setItem('dnd_current_card', JSON.stringify({
                cardData: cleanCardData,
                settings: cardSettings || {}
            }));
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
                console.warn('📦 localStorage quota exceeded, stripping image data...');
                // Strip large base64 images and try again
                if (cleanCardData.itemImageUrl?.startsWith('data:')) {
                    cleanCardData.itemImageUrl = null;
                }
                if (cleanCardData.front?.imageUrl?.startsWith('data:')) {
                    cleanCardData.front.imageUrl = null;
                }
                try {
                    localStorage.setItem('dnd_current_card', JSON.stringify({
                        cardData: cleanCardData,
                        settings: cardSettings || {}
                    }));
                    console.log('✅ Saved without image data');
                } catch (e2) {
                    console.warn('⚠️ Could not save to localStorage, proceeding anyway');
                }
            }
        }

        // Directly load into CardContext (this is immediate, no remount needed!)
        loadState(viewingItem.cardData, cardSettings || undefined);

        // Close the viewer and navigate
        setViewingId(null);
        setViewingSource(null);
        navigate('/');
    };

    const handleViewerRegenerate = () => {
        if (viewingSource === 'equipment' && viewingId) {
            handleAutoGenerate(viewingId as EquipmentSlotId);
            // Viewer stays open and will update when generation finishes!
        }
    };

    const handleGetBackImage = async (): Promise<string | null> => {
        if (!viewingItem?.cardData || !headlessGenRef.current) return null;

        // We need settings. If not stored on item, try to retrieve from localStorage or use defaults.
        // In the future, we should store settings on the item.
        // For now, try to get from localStorage as best effort if it matches, otherwise use defaults.
        let settings = null;
        try {
            const savedCardRaw = localStorage.getItem('dnd_current_card');
            if (savedCardRaw) {
                const saved = JSON.parse(savedCardRaw);
                // Simple heuristic: if names match, use these settings
                if (saved.cardData?.name === viewingItem.name) {
                    settings = saved.settings;
                }
            }
        } catch (e) { }

        return headlessGenRef.current.generateThumbnail(viewingItem.cardData, settings, 'back');
    };

    // Generate high-res front image for zoom view
    const handleGetFrontImage = async (): Promise<string | null> => {
        if (!viewingItem?.cardData || !headlessGenRef.current) return null;

        let settings = null;
        try {
            const savedCardRaw = localStorage.getItem('dnd_current_card');
            if (savedCardRaw) {
                const saved = JSON.parse(savedCardRaw);
                if (saved.cardData?.name === viewingItem.name) {
                    settings = saved.settings;
                }
            }
        } catch (e) { }

        return headlessGenRef.current.generateThumbnail(viewingItem.cardData, settings, 'front');
    };

    const handleAutoGenerate = async (slotId: EquipmentSlotId) => {
        // Prevent double clicks
        if (loadingSlots[slotId]) return;

        // Set loading state for this slot
        setLoadingSlots(prev => ({ ...prev, [slotId]: true }));

        try {
            console.log(`🎲 Starting Headless Generation for ${slotId}...`);

            // 1. Get Context
            const lootContext = getSmartLootContext(
                slotId,
                characterForm.charClass,
                characterForm.background
            );

            // 2. Generate Text (Force Common Rarity for quick loot)
            // const rarity = 'Common';
            const typeMap: Record<string, string> = {
                'Weapon': 'נשק',
                'Armor': 'שריון',
                'Wondrous Item': 'חפץ פלא',
                'Ring': 'טבעת',
                'Potion': 'שיקוי'
            };
            const hebrewType = typeMap[lootContext.baseType] || 'חפץ פלא';
            const hebrewRarity = 'נפוץ'; // Common in Hebrew

            // Read last used style from local storage or default
            const storedStyle = (localStorage.getItem('dnd_image_style') as any) || 'oil';
            const storedModel = (localStorage.getItem('dnd_image_model') as any) || 'flux';

            // Retrieve Last Used Card Settings (Offsets, Scale, etc.)
            let settings: any = null;
            let backgroundUrl: string | null = null;
            try {
                // Try to get exact last state
                const savedCardRaw = localStorage.getItem('dnd_current_card');
                if (savedCardRaw) {
                    const savedCard = JSON.parse(savedCardRaw);
                    settings = savedCard.settings;
                    // Try to get background URL from saved card data
                    if (savedCard.cardData?.backgroundUrl) {
                        backgroundUrl = savedCard.cardData.backgroundUrl;
                    }
                } else {
                    // Fallback to defaults
                    const savedDefaults = localStorage.getItem('dnd_user_defaults');
                    if (savedDefaults) {
                        settings = JSON.parse(savedDefaults);
                    }
                }
            } catch (e) {
                console.warn('Failed to load settings for headless generation', e);
            }

            const textResult = await generateItem(
                {
                    type: hebrewType,
                    subtype: lootContext.subtype,
                    rarity: hebrewRarity,
                    level: 1,
                    theme: lootContext.theme
                },
                password
            );

            // 3. Generate Image
            const visualPrompt = `${lootContext.visualHint}. ${textResult.description}`;
            const imageUrl = await generateImage({
                visualPrompt,
                itemType: hebrewType,
                itemSubtype: lootContext.subtype,
                abilityDesc: textResult.abilityDesc,
                itemName: textResult.name,
                model: storedModel,
                style: storedStyle,
                backgroundOption: 'no-background',
                theme: lootContext.theme || 'fantasy',
                rarity: hebrewRarity
            }, password);

            // 4. Create Card Data
            const newCard = {
                name: textResult.name,
                typeHe: textResult.typeHe,
                subtype: lootContext.subtype,
                rarityHe: textResult.rarityHe,
                abilityName: textResult.abilityName,
                abilityDesc: textResult.abilityDesc,
                description: textResult.description,
                gold: textResult.gold,
                quickStats: textResult.quickStats || '',
                backgroundUrl: backgroundUrl, // Use retrieved background
                front: {
                    title: textResult.name,
                    type: lootContext.subtype,
                    rarity: textResult.rarityHe,
                    quickStats: textResult.quickStats || '',
                    gold: textResult.gold + ' זהב',
                    imageUrl: imageUrl
                },
                back: {
                    title: textResult.abilityName,
                    mechanics: textResult.abilityDesc,
                    lore: textResult.description
                },
                itemImageUrl: imageUrl
            };

            // 5. Generate Full Card Thumbnail (Headless)
            let fullCardThumbnail = imageUrl; // Fallback to icon
            if (headlessGenRef.current) {
                console.log('🖼️ Generating full card thumbnail with settings...');
                const generatedThumb = await headlessGenRef.current.generateThumbnail(newCard, settings);
                if (generatedThumb) {
                    fullCardThumbnail = generatedThumb;
                    console.log('✅ Full card thumbnail generated!');
                }
            }

            // 6. Save and Equip
            // We need a unique ID for the equipment slot
            const uniqueId = `gen-${Date.now()}`;

            equipItem(slotId, {
                uniqueId,
                name: newCard.name,
                nameHe: newCard.name,
                type: newCard.typeHe,
                rarity: newCard.rarityHe,
                thumbnail: fullCardThumbnail || '',
                cardData: newCard
            });

            console.log(`✅ Generated and equipped: ${newCard.name}`);

        } catch (error) {
            console.error('Headless generation failed:', error);
            // Optionally show error toast
        } finally {
            // Clear loading state
            setLoadingSlots(prev => ({ ...prev, [slotId]: false }));
        }
    };



    // Generate character portrait with AI
    const handleGeneratePortrait = async (formData: CharacterFormData) => {
        setIsGenerating(true);
        setName(formData.name);

        // Build prompt for portrait generation
        // Create a focused subject description without style pollution
        const styleDesc = formData.portraitStyle === 'full_body'
            ? 'full body shot, showing entire character from head to toe'
            : 'close up portrait, head and shoulders';

        // Map UI style names to Config style keys
        const styleKeyMap: Record<string, string> = {
            'oil_painting': 'oil',
            'watercolor_lineart': 'watercolor',
            // Direct mappings
            'realistic': 'realistic',
            'dark_fantasy': 'dark_fantasy',
            'anime': 'anime',
            'comic_book': 'comic_book',
            'manga_action': 'manga_action',
            'premium_fantasy': 'premium_fantasy',
            'ink_drawing': 'ink_drawing',
            'epic_fantasy': 'epic_fantasy',
            'vintage_etching': 'vintage_etching',
            'stained_glass': 'stained_glass',
            'sketch': 'sketch',
            'pixel': 'pixel',
            'synthwave': 'synthwave'
        };

        const configStyle = styleKeyMap[formData.artStyle] || formData.artStyle;

        // Simple subject description - let useImageGenerator handle the style wrapper
        const prompt = `${styleDesc} of a ${formData.gender} ${formData.race} ${formData.charClass}, ${formData.background !== 'none' ? formData.background + ' background,' : 'plain background,'} ${formData.pose} pose`;

        try {
            const imageUrl = await generateImage({
                visualPrompt: prompt,
                model: 'flux',
                style: configStyle as any, // Pass the mapped style key
                backgroundOption: 'natural',
                width: 768,  // Vertical aspect ratio (3:4)
                height: 1024,
                isCharacter: true // Use character specific prompting (no floating items)
            }, password);
            if (imageUrl) {
                setPortraitUrl(imageUrl);
            }
        } catch (error) {
            console.error('Portrait generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFormChange = (newData: CharacterFormData) => {
        setCharacterForm(newData);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={(event) => handleDragEnd(event, dragHandlers)}
        >
            <div className="character-sheet-page">
                {/* Left: Equipment Grid (includes Portrait) */}
                <div className="equipment-area">
                    <EquipmentGrid
                        equipment={state.equipment}
                        portraitUrl={state.portraitUrl}
                        onSlotClick={handleSlotClick}
                        onAutoGenerate={handleAutoGenerate}
                        loadingSlots={loadingSlots}
                    />
                </div>

                {/* Center: Backpack with scroll */}
                <div className="backpack-area">
                    <div className="backpack-scroll">
                        <BackpackGrid
                            items={state.backpack}
                            onSlotClick={handleBackpackClick}
                        />
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="character-sidebar-wrapper">
                    <CharacterSidebar
                        formData={characterForm}
                        onFormChange={handleFormChange}
                        onGeneratePortrait={handleGeneratePortrait}
                        isGenerating={isGenerating}
                    />
                </div>
            </div>

            {/* Hidden Headless Generator */}
            <HeadlessCardGenerator ref={headlessGenRef} />

            {/* Drag Overlay */}
            <DragOverlay>
                {activeItem ? (
                    <div className="drag-overlay-item">
                        <img
                            src={activeItem.item.thumbnail}
                            alt={activeItem.item.name}
                            style={{ width: 60, height: 60, objectFit: 'contain' }}
                        />
                    </div>
                ) : null}
            </DragOverlay>

            {/* Card Viewer Modal */}
            <CardViewerModal
                isOpen={!!viewingItem}
                onClose={() => { setViewingId(null); setViewingSource(null); }}
                imageSrc={loadingSlots[viewingId as string] ? null : viewingItem?.thumbnail || null} // Hide image if regenerating
                title={viewingItem?.name}
                onDelete={handleViewerDelete}
                onEdit={handleViewerEdit}
                onRegenerate={viewingSource === 'equipment' ? handleViewerRegenerate : undefined}
                getBackImage={handleGetBackImage}
                getFrontImage={handleGetFrontImage}
            />
        </DndContext>
    );
}

export default CharacterSheet;
