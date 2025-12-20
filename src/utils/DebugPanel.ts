/**
 * DebugPanel - Visual panel for real-time error and log display
 * Shows errors, warnings, and debug info in a collapsible panel
 */

import { getErrorHistory } from './ErrorLogger.js';

interface LogEntry {
    type: 'error' | 'warning' | 'info';
    timestamp: string;
    source: string;
    message: string;
    details?: string;
}

class DebugPanel {
    private panel: HTMLElement | null = null;
    private logContainer: HTMLElement | null = null;
    private isExpanded: boolean = false;
    private logs: LogEntry[] = [];
    private errorCount: number = 0;
    private warningCount: number = 0;
    private maxLogs: number = 50;
    private isDragging: boolean = false;
    private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

    constructor() {
        this.init();
    }

    private init(): void {
        // Only init in development or when explicitly enabled
        if (!this.shouldShow()) return;

        this.createPanel();
        this.hookConsole();
        this.listenForErrors();
        this.setupDrag();
    }

    private setupDrag(): void {
        if (!this.panel) return;

        const header = this.panel.querySelector('.debug-header') as HTMLElement;
        if (!header) return;

        header.style.cursor = 'move';

        header.addEventListener('mousedown', (e: MouseEvent) => {
            // Don't start drag if clicking on buttons
            if ((e.target as HTMLElement).closest('button')) return;

            this.isDragging = true;
            const rect = this.panel!.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (!this.isDragging || !this.panel) return;

            let newX = e.clientX - this.dragOffset.x;
            let newY = e.clientY - this.dragOffset.y;

            // Keep within viewport bounds
            const rect = this.panel.getBoundingClientRect();
            newX = Math.max(0, Math.min(newX, window.innerWidth - rect.width));
            newY = Math.max(0, Math.min(newY, window.innerHeight - rect.height));

            this.panel.style.left = `${newX}px`;
            this.panel.style.top = `${newY}px`;
            this.panel.style.bottom = 'auto';
            this.panel.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    private shouldShow(): boolean {
        // Show if: localhost, or debug=true in URL, or localStorage flag
        return (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.search.includes('debug=true') ||
            localStorage.getItem('debugPanel') === 'true'
        );
    }

    private createPanel(): void {
        // Create panel element
        this.panel = document.createElement('div');
        this.panel.id = 'debug-panel';
        this.panel.innerHTML = `
            <div class="debug-header" id="debug-header">
                <span class="debug-title">🔧 Debug</span>
                <span class="debug-counts">
                    <span class="error-count" id="debug-error-count">0</span>
                    <span class="warning-count" id="debug-warning-count">0</span>
                </span>
                <button class="debug-clear" id="debug-clear" title="Clear">🗑️</button>
                <button class="debug-toggle" id="debug-toggle">▼</button>
            </div>
            <div class="debug-content" id="debug-content">
                <div class="debug-logs" id="debug-logs"></div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #debug-panel {
                position: fixed;
                bottom: 10px;
                left: 10px;
                width: 350px;
                max-height: 400px;
                background: rgba(30, 30, 40, 0.95);
                border: 1px solid #444;
                border-radius: 8px;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                color: #eee;
                z-index: 99999;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                overflow: hidden;
                transition: all 0.2s ease;
            }

            #debug-panel.collapsed {
                width: auto;
            }

            .debug-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: rgba(50, 50, 60, 0.9);
                cursor: pointer;
                user-select: none;
            }

            .debug-title {
                font-weight: bold;
                flex: 1;
            }

            .debug-counts {
                display: flex;
                gap: 6px;
            }

            .error-count, .warning-count {
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
            }

            .error-count {
                background: #ff4444;
                color: white;
            }

            .warning-count {
                background: #ffaa00;
                color: #333;
            }

            .debug-clear, .debug-toggle {
                background: none;
                border: none;
                color: #aaa;
                cursor: pointer;
                font-size: 14px;
                padding: 4px;
            }

            .debug-clear:hover, .debug-toggle:hover {
                color: #fff;
            }

            .debug-content {
                max-height: 300px;
                overflow-y: auto;
                display: none;
            }

            #debug-panel.expanded .debug-content {
                display: block;
            }

            #debug-panel.expanded .debug-toggle {
                transform: rotate(180deg);
            }

            .debug-logs {
                padding: 8px;
            }

            .debug-log {
                padding: 6px 8px;
                margin-bottom: 4px;
                border-radius: 4px;
                border-left: 3px solid;
                background: rgba(0,0,0,0.3);
            }

            .debug-log.error {
                border-color: #ff4444;
                background: rgba(255, 68, 68, 0.1);
            }

            .debug-log.warning {
                border-color: #ffaa00;
                background: rgba(255, 170, 0, 0.1);
            }

            .debug-log.info {
                border-color: #4488ff;
                background: rgba(68, 136, 255, 0.1);
            }

            .debug-log-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }

            .debug-log-source {
                font-weight: bold;
                color: #88ccff;
            }

            .debug-log-time {
                color: #888;
                font-size: 10px;
            }

            .debug-log-message {
                word-break: break-word;
            }

            .debug-log-details {
                margin-top: 4px;
                padding: 4px;
                background: rgba(0,0,0,0.3);
                border-radius: 3px;
                font-size: 10px;
                color: #aaa;
                max-height: 60px;
                overflow: auto;
            }

            .debug-empty {
                text-align: center;
                padding: 20px;
                color: #666;
            }

            @media (max-width: 768px) {
                #debug-panel {
                    width: calc(100% - 20px);
                    bottom: 5px;
                    left: 5px;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.panel);

        this.logContainer = document.getElementById('debug-logs');

        // Event listeners
        document.getElementById('debug-header')?.addEventListener('click', () => this.toggle());
        document.getElementById('debug-clear')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clear();
        });

        this.updateCounts();
        this.showEmpty();
    }

    private toggle(): void {
        if (!this.panel) return;
        this.isExpanded = !this.isExpanded;
        this.panel.classList.toggle('expanded', this.isExpanded);
    }

    private hookConsole(): void {
        // Intercept console.error
        const originalError = console.error;
        console.error = (...args: unknown[]) => {
            this.addLog('error', 'Console', args.map(a => String(a)).join(' '));
            originalError.apply(console, args);
        };

        // Intercept console.warn
        const originalWarn = console.warn;
        console.warn = (...args: unknown[]) => {
            this.addLog('warning', 'Console', args.map(a => String(a)).join(' '));
            originalWarn.apply(console, args);
        };
    }

    private listenForErrors(): void {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.addLog('error', 'Uncaught', event.message, event.filename);
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.addLog('error', 'Promise', String(event.reason));
        });

        // Custom app error events
        window.addEventListener('app-error', ((event: CustomEvent) => {
            const { source, message, error } = event.detail;
            this.addLog('error', source, message, error);
        }) as EventListener);
    }

    public addLog(type: 'error' | 'warning' | 'info', source: string, message: string, details?: string): void {
        const entry: LogEntry = {
            type,
            timestamp: new Date().toLocaleTimeString(),
            source,
            message,
            details
        };

        this.logs.unshift(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }

        if (type === 'error') this.errorCount++;
        if (type === 'warning') this.warningCount++;

        this.updateCounts();
        this.renderLog(entry);

        // Auto-expand on error
        if (type === 'error' && !this.isExpanded) {
            this.toggle();
        }
    }

    private renderLog(entry: LogEntry): void {
        if (!this.logContainer) return;

        // Remove empty message if exists
        const empty = this.logContainer.querySelector('.debug-empty');
        if (empty) empty.remove();

        const logEl = document.createElement('div');
        logEl.className = `debug-log ${entry.type}`;
        logEl.innerHTML = `
            <div class="debug-log-header">
                <span class="debug-log-source">[${entry.source}]</span>
                <span class="debug-log-time">${entry.timestamp}</span>
            </div>
            <div class="debug-log-message">${this.escapeHtml(entry.message)}</div>
            ${entry.details ? `<div class="debug-log-details">${this.escapeHtml(entry.details)}</div>` : ''}
        `;

        this.logContainer.insertBefore(logEl, this.logContainer.firstChild);
    }

    private updateCounts(): void {
        const errorEl = document.getElementById('debug-error-count');
        const warnEl = document.getElementById('debug-warning-count');
        if (errorEl) errorEl.textContent = String(this.errorCount);
        if (warnEl) warnEl.textContent = String(this.warningCount);
    }

    private showEmpty(): void {
        if (!this.logContainer) return;
        this.logContainer.innerHTML = '<div class="debug-empty">No logs yet ✨</div>';
    }

    public clear(): void {
        this.logs = [];
        this.errorCount = 0;
        this.warningCount = 0;
        this.updateCounts();
        this.showEmpty();
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    public show(): void {
        if (this.panel) this.panel.style.display = 'block';
    }

    public hide(): void {
        if (this.panel) this.panel.style.display = 'none';
    }
}

// Create singleton instance
const debugPanel = new DebugPanel();

export default debugPanel;
export { DebugPanel };
