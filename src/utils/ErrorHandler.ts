// @ts-nocheck
/**
 * ErrorHandler - Centralized error handling
 * Provides consistent error management across the application
 */

/**
 * Error severity levels
 */
export enum ErrorLevel {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical'
}

export interface ErrorHandlerOptions {
    level?: ErrorLevel;
    showToast?: boolean;
    rethrow?: boolean;
}

declare global {
    interface Window {
        uiManager?: any; // To be typed later
    }
}

/**
 * Handle an error with consistent logging and UI feedback
 */
export function handleError(error: Error | string | unknown, context: string, options: ErrorHandlerOptions = {}): void {
    const {
        level = ErrorLevel.ERROR,
        showToast = true,
        rethrow = false
    } = options;

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : null;

    // Console logging with context
    const logMessage = `[${context}] ${message}`;

    switch (level) {
        case ErrorLevel.INFO:
            console.info(logMessage);
            break;
        case ErrorLevel.WARNING:
            console.warn(logMessage);
            break;
        case ErrorLevel.CRITICAL:
            console.error('🚨 CRITICAL:', logMessage, stack);
            break;
        default:
            console.error(logMessage, stack);
    }

    // UI feedback
    if (showToast && window.uiManager) {
        window.uiManager.showToast(message, level === ErrorLevel.WARNING ? 'warning' : 'error');
    }

    // Optional rethrow
    if (rethrow) {
        throw error;
    }
}

/**
 * Create an error handler bound to a specific context
 */
export function createErrorHandler(context: string) {
    return (error: any, options: ErrorHandlerOptions = {}) => handleError(error, context, options);
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T, context: string, options: ErrorHandlerOptions = {}): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
    return async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(error, context, options);
            return null;
        }
    };
}

/**
 * Try to execute a function, return fallback on error
 */
export function tryCatch<T>(fn: () => T, fallback: T, context: string = 'Unknown'): T {
    try {
        return fn();
    } catch (error) {
        handleError(error, context, { level: ErrorLevel.WARNING, showToast: false });
        return fallback;
    }
}

export default {
    handleError,
    createErrorHandler,
    withErrorHandling,
    tryCatch,
    ErrorLevel
};
