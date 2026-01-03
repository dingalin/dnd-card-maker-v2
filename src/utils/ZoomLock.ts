/**
 * ZoomLock - DISABLED
 * Feature was causing display issues, disabled for now
 */

export class ZoomLock {
    constructor() {
        // Disabled - do nothing
        console.log('🔒 ZoomLock disabled');
    }

    enable(): void { }
    disable(): void { }
    toggle(): boolean { return false; }
    setBaseline(): void { }
}

const zoomLock = new ZoomLock();

declare global {
    interface Window {
        zoomLock: ZoomLock;
    }
}

window.zoomLock = zoomLock;

export default zoomLock;
