import { CardData } from './card';

export interface AppState {
    cardData: CardData | null;
    settings: AppSettings;
    ui: UIState;
}

export interface AppSettings {
    offsets: OffsetSettings;
    fontSizes: FontSizeSettings;
    styles: StyleSettings;
}

export interface OffsetSettings {
    cardTitle: number;
    cardType: number;
    stats: number;
    description: number;
    [key: string]: number;
}

export interface FontSizeSettings {
    cardTitle: number;
    cardType: number;
    stats: number;
    description: number;
    [key: string]: number;
}

export interface StyleSettings {
    theme: string;
    highContrast: boolean;
}

export interface UIState {
    isLoading: boolean;
    currentTab: string;
    isMobileMenuOpen: boolean;
    previewScale: number;
}
