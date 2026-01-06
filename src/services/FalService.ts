import { API } from '../config/index';

export interface FalOptions {
    image_size?: string;
    num_inference_steps?: number;
    output_format?: string;
    [key: string]: any;
}

export class FalService {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        // Use centralized config for API URL
        this.baseUrl = API.WORKER_URL.replace(/\/$/, ''); // Remove trailing slash
    }

    async generateImage(prompt: string, options: FalOptions = {}): Promise<string> {
        // The worker expects a single endpoint
        const endpoint = this.baseUrl;

        // Construct the payload expected by the worker (Action-Based)
        const workerPayload = {
            password: this.apiKey, // User enters the Proxy Password
            action: 'fal-zimage',
            data: {
                prompt: prompt,
                image_size: 'square_hd', // Options: square_hd, square, portrait_4_3, landscape_4_3
                num_inference_steps: 8,
                output_format: 'jpeg',
                ...options
            }
        };

        console.log("FalService: Sending to Worker...", { action: 'fal-zimage' });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workerPayload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Worker Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) throw new Error(data.error);
        return data.image || data.images?.[0];
    }
}
