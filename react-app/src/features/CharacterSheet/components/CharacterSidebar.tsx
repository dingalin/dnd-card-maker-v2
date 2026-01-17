// import { useState } from 'react'; // Removed unused
import { useTranslation } from 'react-i18next';
import { CHARACTER_OPTIONS } from '../data/characterOptions';
import type { SelectOption } from '../data/characterOptions';
import './CharacterSidebar.css';

// ... props definition
interface CharacterSidebarProps {
    formData: CharacterFormData;
    onFormChange: (data: CharacterFormData) => void;
    onGeneratePortrait: (options: CharacterFormData) => void;
    isGenerating?: boolean;
}

export interface CharacterFormData {
    name: string;
    gender: string;
    race: string;
    charClass: string;
    background: string;
    artStyle: string;
    portraitStyle: string;
    pose: string;
}

export default function CharacterSidebar({
    formData,
    onFormChange,
    onGeneratePortrait,
    isGenerating
}: CharacterSidebarProps) {
    const { i18n } = useTranslation();
    const isHebrew = i18n.language === 'he';

    // Removed internal state

    const updateField = (field: keyof CharacterFormData, value: string) => {
        onFormChange({ ...formData, [field]: value });
    };

    const getLabel = (opt: SelectOption) => isHebrew ? opt.label : opt.labelEn;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGeneratePortrait(formData);
    };

    const renderSelect = (
        id: string,
        value: string,
        options: SelectOption[],
        field: keyof CharacterFormData
    ) => (
        <select
            id={id}
            className="sidebar-select"
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                    {getLabel(opt)}
                </option>
            ))}
        </select>
    );

    return (
        <div className="character-sidebar">
            <div className="sidebar-header">
                <h3>✨ יצירת דמות</h3>
            </div>

            <form onSubmit={handleSubmit} className="sidebar-form">
                {/* Character Name Removed */}

                {/* Row 1: Gender & Race */}
                <div className="form-row">
                    <div className="form-group">
                        {renderSelect('char-gender', formData.gender, CHARACTER_OPTIONS.genders, 'gender')}
                    </div>
                    <div className="form-group">
                        {renderSelect('char-race', formData.race, CHARACTER_OPTIONS.races, 'race')}
                    </div>
                </div>

                {/* Row 2: Class & Pose */}
                <div className="form-row">
                    <div className="form-group">
                        {renderSelect('char-class', formData.charClass, CHARACTER_OPTIONS.classes, 'charClass')}
                    </div>
                    <div className="form-group">
                        {renderSelect('char-pose', formData.pose, CHARACTER_OPTIONS.poses, 'pose')}
                    </div>
                </div>

                <div className="sidebar-divider" />

                {/* Row 3: Art Style & Portrait Style */}
                <div className="form-row">
                    <div className="form-group">
                        {renderSelect('char-art-style', formData.artStyle, CHARACTER_OPTIONS.artStyles, 'artStyle')}
                    </div>
                    <div className="form-group">
                        {renderSelect('char-portrait-style', formData.portraitStyle, CHARACTER_OPTIONS.portraitStyles, 'portraitStyle')}
                    </div>
                </div>

                {/* Row 4: Background (Full Width) */}
                <div className="form-group">
                    {renderSelect('char-background', formData.background, CHARACTER_OPTIONS.backgrounds, 'background')}
                </div>

                {/* Generate Button */}
                <button
                    type="submit"
                    className="generate-btn"
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <span className="spinner-icon">⏳</span>
                            מייצר...
                        </>
                    ) : (
                        <>
                            צור דמות
                        </>
                    )}
                </button>

                {isGenerating && (
                    <div className="generation-status">
                        יוצר תמונת דמות...
                    </div>
                )}
            </form>
        </div>
    );
}
