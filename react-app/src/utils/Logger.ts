/**
 * Logger Utility
 * Centralizes logging to allow filtering in production and consistent formatting.
 */

const IS_DEV = import.meta.env.DEV;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class LoggerService {
    private formatMessage(module: string, message: string): string {
        return `[${module}] ${message}`;
    }

    /**
     * Debug logs - Only shown in Development
     */
    debug(module: string, message: string, data?: any) {
        if (!IS_DEV) return;

        const formatted = this.formatMessage(module, message);
        if (data) {
            console.log(formatted, data);
        } else {
            console.log(formatted);
        }
    }

    /**
     * Info logs - Significant events
     */
    info(module: string, message: string, data?: any) {
        // We might want to keep some info logs in prod, or strict dev only
        // For now, let's keep info in prod but maybe less verbose
        const formatted = this.formatMessage(module, message);
        if (data) {
            console.info(formatted, data);
        } else {
            console.info(formatted);
        }
    }

    /**
     * Warning logs - Potential issues
     */
    warn(module: string, message: string, data?: any) {
        const formatted = this.formatMessage(module, message);
        if (data) {
            console.warn(formatted, data);
        } else {
            console.warn(formatted);
        }
    }

    /**
     * Error logs - Critical failures
     */
    error(module: string, message: string, error?: any) {
        const formatted = this.formatMessage(module, message);
        if (error) {
            console.error(formatted, error);
        } else {
            console.error(formatted);
        }
    }

    /**
     * Group logs together
     */
    group(label: string, fn: () => void) {
        if (!IS_DEV) {
            fn();
            return;
        }
        console.group(label);
        try {
            fn();
        } finally {
            console.groupEnd();
        }
    }
}

export const Logger = new LoggerService();
