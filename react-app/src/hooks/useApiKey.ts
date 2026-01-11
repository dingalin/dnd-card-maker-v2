import { useState, useEffect } from 'react';

const API_KEY_STORAGE = 'gemini_api_key';

export function useApiKey() {
    const [apiKey, setApiKey] = useState<string>('');
    const [isConfigured, setIsConfigured] = useState(false);

    // Load API key on mount
    useEffect(() => {
        const stored = localStorage.getItem(API_KEY_STORAGE);
        if (stored) {
            setApiKey(stored);
            setIsConfigured(true);
        }
    }, []);

    const saveApiKey = (key: string) => {
        localStorage.setItem(API_KEY_STORAGE, key);
        setApiKey(key);
        setIsConfigured(!!key);
    };

    const clearApiKey = () => {
        localStorage.removeItem(API_KEY_STORAGE);
        setApiKey('');
        setIsConfigured(false);
    };

    return {
        apiKey,
        isConfigured,
        saveApiKey,
        clearApiKey,
    };
}
