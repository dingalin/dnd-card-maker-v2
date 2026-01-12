/**
 * Centralized Logging Utility
 * 
 * Provides structured logging with automatic dev/production filtering.
 * In production builds, DEBUG and INFO logs are stripped automatically.
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

class LoggerService {
    private minLevel: LogLevel;
    private isDev: boolean;

    constructor() {
        this.isDev = import.meta.env.DEV;
        this.minLevel = this.isDev ? LogLevel.DEBUG : LogLevel.WARN;
    }

    /**
     * Debug-level logging (development only)
     * Use for detailed troubleshooting, value inspection, algorithm steps
     */
    debug(module: string, message: string, ...args: any[]): void {
        if (this.minLevel <= LogLevel.DEBUG) {
            console.log(`🔍 [${module}]`, message, ...args);
        }
    }

    /**
     * Info-level logging (development only)
     * Use for significant events, state changes, user actions
     */
    info(module: string, message: string, ...args: any[]): void {
        if (this.minLevel <= LogLevel.INFO) {
            console.log(`ℹ️ [${module}]`, message, ...args);
        }
    }

    /**
     * Warning-level logging (all environments)
     * Use for recoverable errors, deprecation notices, unusual states
     */
    warn(module: string, message: string, ...args: any[]): void {
        if (this.minLevel <= LogLevel.WARN) {
            console.warn(`⚠️ [${module}]`, message, ...args);
        }
    }

    /**
     * Error-level logging (all environments)
     * Use for exceptions, critical failures, data corruption
     */
    error(module: string, message: string, error?: Error, ...args: any[]): void {
        if (this.minLevel <= LogLevel.ERROR) {
            if (error) {
                console.error(`❌ [${module}]`, message, error, ...args);
            } else {
                console.error(`❌ [${module}]`, message, ...args);
            }
        }
    }

    /**
     * Performance timing utility
     * Usage:
     *   const timer = Logger.time('MyOperation');
     *   // ... do work ...
     *   timer.end();
     */
    time(label: string): { end: () => void } {
        if (!this.isDev) {
            return { end: () => { } }; // No-op in production
        }

        const start = performance.now();
        return {
            end: () => {
                const duration = performance.now() - start;
                this.debug('Performance', `${label} took ${duration.toFixed(2)}ms`);
            }
        };
    }

    /**
     * Group related logs (development only)
     */
    group(label: string, callback: () => void): void {
        if (!this.isDev) {
            callback();
            return;
        }

        console.group(label);
        try {
            callback();
        } finally {
            console.groupEnd();
        }
    }
}

// Export singleton instance
export const Logger = new LoggerService();

// Convenience exports for common use cases
export const log = {
    debug: (module: string, msg: string, ...args: any[]) => Logger.debug(module, msg, ...args),
    info: (module: string, msg: string, ...args: any[]) => Logger.info(module, msg, ...args),
    warn: (module: string, msg: string, ...args: any[]) => Logger.warn(module, msg, ...args),
    error: (module: string, msg: string, err?: Error, ...args: any[]) => Logger.error(module, msg, err, ...args),
};
