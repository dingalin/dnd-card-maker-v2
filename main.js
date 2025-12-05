// CSS imports for Vite bundling
import './style.css';
import './css/layout.css';
import './css/components/buttons.css';
import './css/components/panels.css';
import './css/components/toast.css';
import './css/components/scroll-menu.css';
import './css/components/forms.css';
import './ui-improvements.css';

import './component-loader.js';
import { initializeApp } from './src/app-init.js';

// Global error handlers
window.onerror = function (msg, url, line, col, error) {
    console.error("Global Error:", msg, url, line, col, error);
    return false;
};

window.addEventListener('unhandledrejection', function (event) {
    console.error("Unhandled Rejection:", event.reason);
});

// Wait for components to load
if (window.areComponentsLoaded) {
    initializeApp();
} else {
    document.addEventListener('componentsLoaded', initializeApp);
}
