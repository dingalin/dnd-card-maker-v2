/**
 * Services Index
 * Central export point for all service modules
 *
 * This file provides easy imports and better code navigation.
 * Usage: import { BlobURLRegistry, GeminiService } from './services/index';
 */

// Memory management
export { BlobURLRegistry } from './blob-registry';

// Main AI Service
// @ts-ignore
export { default as GeminiService } from '../gemini-service';

// Card Viewer
export { CardViewerService } from './CardViewerService';

// Image Generation
// @ts-ignore
export { generateImageGetImg } from './GetImgService';

// Style Configs
export { FLUX_STYLE_CONFIGS, getColorName, getElementalEnhancement, getRarityQuality } from './style-configs';
