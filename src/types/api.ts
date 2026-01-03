export interface GeminiRequest {
    prompt: string;
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
}

export interface GeminiResponse {
    text: string;
    usage?: TokenUsage;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface ImageGenerationRequest {
    prompt: string;
    width?: number;
    height?: number;
    style?: string;
    model?: 'dall-e-3' | 'stable-diffusion' | 'flux-schnell';
}

export interface GeminiConfig {
    apiKey?: string;
    password?: string;
    useWorker: boolean;
    baseUrl: string;
}

export interface ImageGenerationResponse {
    url: string;
    revisedPrompt?: string;
}
