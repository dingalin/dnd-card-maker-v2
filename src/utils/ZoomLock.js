/**
 * ZoomLock - DISABLED
 * Feature was causing display issues, disabled for now
 */

class ZoomLock {
    constructor() {
        // Disabled - do nothing
        console.log('🔒 ZoomLock disabled');
    }

    enable() { }
    disable() { }
    toggle() { return false; }
    setBaseline() { }
}

const zoomLock = new ZoomLock();
window.zoomLock = zoomLock;

export default zoomLock;
export { ZoomLock };
