import { useState, useEffect } from 'react';

const PASSWORD_STORAGE = 'worker_password';

export function useWorkerPassword() {
    const [password, setPassword] = useState<string>('');
    const [isConfigured, setIsConfigured] = useState(false);

    // Load password on mount
    useEffect(() => {
        const stored = localStorage.getItem(PASSWORD_STORAGE);
        if (stored) {
            setPassword(stored);
            setIsConfigured(true);
        }
    }, []);

    const savePassword = (pwd: string) => {
        localStorage.setItem(PASSWORD_STORAGE, pwd);
        setPassword(pwd);
        setIsConfigured(!!pwd);
    };

    const clearPassword = () => {
        localStorage.removeItem(PASSWORD_STORAGE);
        setPassword('');
        setIsConfigured(false);
    };

    return {
        password,
        isConfigured,
        savePassword,
        clearPassword,
    };
}
