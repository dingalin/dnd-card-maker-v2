import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
    base: '/dnd-card-maker/', // Base path for GitHub Pages
    build: {
        outDir: 'dist',
    },
    plugins: [
        viteStaticCopy({
            targets: [
                { src: 'components/*', dest: 'components' },
                { src: 'ui-improvements.css', dest: '.' },
                { src: 'component-loader.js', dest: '.' },
                { src: 'navigation-manager.js', dest: '.' },
                { src: 'ui-helpers.js', dest: '.' },
                { src: 'css/**/*', dest: 'css' }
            ]
        })
    ]
})
