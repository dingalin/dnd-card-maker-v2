/**
 * BlobURLRegistry - Memory Leak Prevention
 * Tracks and manages blob URLs to prevent memory leaks
 */

declare global {
    interface Window {
        blobURLRegistry?: typeof BlobURLRegistry;
    }
}

export const BlobURLRegistry = {
    urls: new Map<string, number>(), // url -> timestamp
    maxAge: 5 * 60 * 1000, // 5 minutes - URLs older than this get auto-cleaned
    maxCount: 20, // Max blob URLs to keep

    register(url: string): string {
        this.urls.set(url, Date.now());
        this.cleanup();
        return url;
    },

    revoke(url: string | null | undefined): void {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
            this.urls.delete(url);
        }
    },

    cleanup(): void {
        const now = Date.now();
        // Remove old URLs
        for (const [url, timestamp] of this.urls) {
            if (now - timestamp > this.maxAge) {
                URL.revokeObjectURL(url);
                this.urls.delete(url);
                console.log('🧹 BlobURLRegistry: Cleaned old URL');
            }
        }
        // If still over limit, remove oldest
        while (this.urls.size > this.maxCount) {
            const oldest = [...this.urls.entries()].sort((a, b) => a[1] - b[1])[0];
            if (oldest) {
                URL.revokeObjectURL(oldest[0]);
                this.urls.delete(oldest[0]);
                console.log('🧹 BlobURLRegistry: Cleaned excess URL');
            }
        }
    },

    // Force cleanup all - call when navigating away or when memory is tight
    revokeAll(): void {
        for (const url of this.urls.keys()) {
            URL.revokeObjectURL(url);
        }
        this.urls.clear();
        console.log('🧹 BlobURLRegistry: All URLs revoked');
    }
};

// Expose for manual cleanup if needed
if (typeof window !== 'undefined') {
    window.blobURLRegistry = BlobURLRegistry;
}

export default BlobURLRegistry;
