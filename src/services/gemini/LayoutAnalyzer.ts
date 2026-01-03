/**
 * LayoutAnalyzer - Handles AI-powered card layout analysis
 * Extracted from GeminiService for better code organization
 */

import { API } from '../../config/index';
import { GeminiConfig } from '../../types/api';

// Cloudflare Worker URL for secure API access
const WORKER_URL = API.WORKER_URL;

interface ThemeCacheEntry {
    theme: string;
    timestamp: number;
}

interface ContentInfo {
    name: string;
    nameLength: number;
    type: string;
    hasImage: boolean;
    hasStats: boolean;
    descriptionLength: number;
}

interface LayoutSuggestions {
    rarity: number;
    type: number;
    name: number;
    imageYOffset: number;
    imageScale: number;
    coreStats: number;
    stats: number;
    gold: number;
    nameSize: number;
    reasoning: string;
}

// Cache for detected themes to avoid redundant API calls
const templateThemeCache = new Map<string, ThemeCacheEntry>(); // templateUrl -> { theme, timestamp }
const THEME_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Valid themes for detection
export const VALID_THEMES = [
    'Fire', 'Nature', 'Arcane', 'Divine', 'Necrotic', 'Ice',
    'Lightning', 'Ocean', 'Shadow', 'Celestial', 'Blood',
    'Industrial', 'Iron', 'Old Scroll', 'Elemental'
];

/**
 * Detect the theme of a card template using Gemini Vision
 * @param {GeminiConfig} geminiConfig - Configuration with apiKey, password, useWorker, baseUrl
 * @param {string} templateImageUrl - URL or base64 of the template image
 * @returns {Promise<string>} - Detected theme (e.g., 'Fire', 'Ocean', 'Arcane')
 */
export async function detectTemplateTheme(geminiConfig: GeminiConfig, templateImageUrl: string): Promise<string> {
    const { apiKey, password, useWorker, baseUrl } = geminiConfig;

    if (!templateImageUrl) {
        console.log('🎨 No template provided, using default theme: Nature');
        return 'Nature';
    }

    // Check cache first
    const cached = templateThemeCache.get(templateImageUrl);
    if (cached && (Date.now() - cached.timestamp < THEME_CACHE_DURATION)) {
        console.log(`🎨 Using cached theme: ${cached.theme}`);
        return cached.theme;
    }

    const prompt = buildThemeDetectionPrompt();

    try {
        // Convert URL to base64 if needed
        const { base64Data, mimeType } = await processTemplateImage(templateImageUrl);

        const parts: any[] = [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } }
        ];

        const payload = { contents: [{ parts }] };

        let data;
        if (useWorker) {
            data = await callViaWorker(password!, 'gemini-generate', {
                model: 'gemini-2.0-flash',
                contents: payload.contents
            });
        } else {
            const response = await fetch(`${baseUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Gemini API request failed');
            data = await response.json();
        }

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('No response from Gemini');
        }

        const detectedTheme = data.candidates[0].content.parts[0].text.trim();

        // Validate the response is a valid theme
        const matchedTheme = VALID_THEMES.find(t =>
            detectedTheme.toLowerCase() === t.toLowerCase() ||
            detectedTheme.toLowerCase().includes(t.toLowerCase())
        );

        const finalTheme = matchedTheme || 'Nature';
        console.log(`🎨 AI detected template theme: "${detectedTheme}" → Using: ${finalTheme}`);

        // Cache the result
        templateThemeCache.set(templateImageUrl, {
            theme: finalTheme,
            timestamp: Date.now()
        });

        return finalTheme;

    } catch (error) {
        console.error('🎨 Theme detection failed:', error);
        return 'Nature'; // Fallback to Nature theme
    }
}

/**
 * AI-powered layout analysis for card positioning
 */
export async function analyzeCardLayout(
    geminiConfig: GeminiConfig,
    cardImageBase64: string,
    contentInfo: ContentInfo
): Promise<LayoutSuggestions> {
    const { apiKey, password, useWorker, baseUrl } = geminiConfig;

    const prompt = buildLayoutAnalysisPrompt(contentInfo);

    const parts: any[] = [
        { text: prompt },
        {
            inline_data: {
                mime_type: "image/png",
                data: cardImageBase64.replace(/^data:image\/\w+;base64,/, '')
            }
        }
    ];

    const payload = {
        contents: [{ parts }]
    };

    try {
        console.log("LayoutAnalyzer: Analyzing card layout with AI Vision...");

        let data;
        if (useWorker) {
            data = await callViaWorker(password!, 'gemini-generate', {
                model: 'gemini-2.0-flash',
                contents: payload.contents
            });
        } else {
            const response = await fetch(`${baseUrl}?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Layout analysis failed");
            }

            data = await response.json();
        }

        if (!data.candidates || !data.candidates[0]) {
            throw new Error("No layout suggestions returned");
        }

        const text = data.candidates[0].content.parts[0].text;
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const suggestions = JSON.parse(jsonStr) as LayoutSuggestions;

        console.log("LayoutAnalyzer: Layout suggestions:", suggestions);
        return suggestions;

    } catch (error: any) {
        console.error("Layout Analysis Error:", error);
        throw new Error("Failed to analyze card layout: " + error.message);
    }
}

// Build theme detection prompt
function buildThemeDetectionPrompt(): string {
    return `You are a fantasy card game designer. Analyze this D&D card template/border image and determine its PRIMARY THEME.

VALID THEMES (pick EXACTLY ONE):
- Fire: flames, embers, volcanic, red/orange colors, heat effects
- Nature: plants, vines, leaves, forest, green/brown organic elements
- Arcane: magical runes, purple/blue mystical energy, wizard symbols
- Divine: holy symbols, gold/white radiance, angelic, celestial light
- Necrotic: skulls, bones, death, green/purple decay, ghostly
- Ice: frost, snow, crystals, blue/white frozen elements
- Lightning: electricity, storms, crackling energy, blue/yellow
- Ocean: water, waves, sea creatures, tentacles, coral, turquoise/blue aquatic
- Shadow: darkness, void, black/purple creeping shadows
- Celestial: stars, moons, cosmic, nebula, space themes
- Blood: crimson red, thorns, violent, dark red
- Industrial: gears, metal, steampunk, mechanical
- Iron: weapons, armor, chains, battle-worn metal
- Old Scroll: parchment, ancient paper, sepia, aged document
- Elemental: mixed elements, chaotic, rainbow primal energy

RESPONSE: Return ONLY the theme name (one word or two words exactly as written above, e.g., "Ocean" or "Old Scroll"). No explanation, no punctuation.`;
}

// Build layout analysis prompt
function buildLayoutAnalysisPrompt(contentInfo: ContentInfo): string {
    return `
You are a professional D&D card designer. Your goal is to achieve a CLEAN, BALANCED layout like a professional trading card.

IDEAL CARD LAYOUT (top to bottom):
1. RARITY - small text at very top center (נפוץ, נדיר, etc.)
2. TYPE - weapon/armor type below rarity (מגל (פשוט), חרב ארוכה (קרבי))
3. NAME - large bold title, centered (עוקץ האבן)
4. IMAGE - circular item image in the center, properly sized
5. CORE STATS - damage or AC below image (1d4 חותך (קל))
6. QUICK STATS - brief ability description (יוצר שטח קשה פעם ביום)
7. GOLD - coin value at bottom (50)

CARD CONTENT INFO:
- Item Name: "${contentInfo.name}" (${contentInfo.nameLength} characters)
- Item Type: "${contentInfo.type}"
- Has Item Image: ${contentInfo.hasImage}
- Has Stats (damage/AC): ${contentInfo.hasStats}
- Description Length: ${contentInfo.descriptionLength} words

CURRENT CARD IMAGE IS ATTACHED. Compare it to the ideal layout.

YOUR TASK:
Suggest Y-offset adjustments to achieve the ideal layout. Values are in PIXELS.
- NEGATIVE values = move element UP
- POSITIVE values = move element DOWN

OFFSET GUIDELINES:
- rarity: position at -200 to -100 (should be at TOP)
- type: position at -150 to -50 (below rarity)
- name: position at -50 to 50 (prominent title area)
- imageYOffset: -100 to 100 (center the image nicely)
- imageScale: 0.8 to 1.5 (size the image appropriately)
- coreStats: 600 to 750 (damage/AC below image, around 680 is good)
- stats: 700 to 800 (quick description below damage)
- gold: -20 to 20 (fine-tune bottom position)

FONT SIZE:
- nameSize: 40-70 (use smaller for longer names, default 56)

Return ONLY a JSON object (no markdown):
{
  "rarity": -100,
  "type": -38,
  "name": 0,
  "imageYOffset": 0,
  "imageScale": 1.0,
  "coreStats": 680,
  "stats": 0,
  "gold": 0,
  "nameSize": 56,
  "reasoning": "Brief explanation"
}
`;
}

// Process template image for API
async function processTemplateImage(templateImageUrl: string): Promise<{ base64Data: string; mimeType: string }> {
    let base64Data = "";
    let mimeType = 'image/png';

    if (templateImageUrl.startsWith('data:')) {
        const matches = templateImageUrl.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
        }
    } else {
        // Fetch and convert to base64
        const response = await fetch(templateImageUrl);
        const blob = await response.blob();
        mimeType = blob.type || 'image/png';
        const buffer = await blob.arrayBuffer();
        base64Data = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    }

    return { base64Data, mimeType };
}

// Helper function to call through Worker
async function callViaWorker(password: string, action: string, data: any) {
    let response;
    try {
        response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: password,
                action: action,
                data: data
            })
        });
    } catch (networkError) {
        console.error("Worker Network Error:", networkError);
        throw new Error(`Connection Failed. Is the Worker URL correct? (${WORKER_URL})`);
    }

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Incorrect Password (401). Please check your key.");
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            throw new Error(error.error || `Worker Error ${response.status}`);
        } else {
            const text = await response.text();
            if (text.includes('Access')) {
                throw new Error(`Cloudflare Access Blocked (Status ${response.status}). Check Settings.`);
            }
            throw new Error(`Worker Error ${response.status}: ${text.substring(0, 50)}...`);
        }
    }

    return response.json();
}

// Clear theme cache (useful for testing)
export function clearThemeCache(): void {
    templateThemeCache.clear();
}

export default { detectTemplateTheme, analyzeCardLayout, clearThemeCache, VALID_THEMES };
