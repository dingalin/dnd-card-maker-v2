/**
 * Unit tests for style configurations
 */
import { describe, it, expect } from 'vitest';
import { STYLE_CONFIGS, FLUX_STYLE_CONFIGS } from './styleConfigs';

describe('styleConfigs', () => {
    describe('STYLE_CONFIGS', () => {
        it('should have watercolor style defined', () => {
            expect(STYLE_CONFIGS['watercolor']).toBeDefined();
            expect(STYLE_CONFIGS['watercolor'].primary).toContain('watercolor');
        });

        it('should have all required properties for each style', () => {
            Object.entries(STYLE_CONFIGS).forEach(([_styleName, config]) => {
                expect(config.primary).toBeDefined();
                expect(config.technique).toBeDefined();
                expect(config.finish).toBeDefined();
                expect(typeof config.primary).toBe('string');
                expect(typeof config.technique).toBe('string');
                expect(typeof config.finish).toBe('string');
            });
        });

        it('should have at least 15 style options', () => {
            const styleCount = Object.keys(STYLE_CONFIGS).length;
            expect(styleCount).toBeGreaterThanOrEqual(15);
        });
    });

    describe('FLUX_STYLE_CONFIGS', () => {
        it('should have realistic style defined', () => {
            expect(FLUX_STYLE_CONFIGS['realistic']).toBeDefined();
            expect(FLUX_STYLE_CONFIGS['realistic'].primary).toContain('realistic');
        });

        it('should have anime style with cel shading', () => {
            expect(FLUX_STYLE_CONFIGS['anime']).toBeDefined();
            expect(FLUX_STYLE_CONFIGS['anime'].technique).toContain('cel shading');
        });

        it('should have pixel style with retro game aesthetics', () => {
            expect(FLUX_STYLE_CONFIGS['pixel']).toBeDefined();
            expect(FLUX_STYLE_CONFIGS['pixel'].primary).toContain('pixel');
        });

        it('should have all required properties for each style', () => {
            Object.entries(FLUX_STYLE_CONFIGS).forEach(([_styleName, config]) => {
                expect(config.primary).toBeDefined();
                expect(config.technique).toBeDefined();
                expect(config.finish).toBeDefined();
            });
        });

        it('should match STYLE_CONFIGS for common styles', () => {
            // Both configs should have the same style names
            const commonStyles = ['watercolor', 'oil', 'anime', 'pixel', 'sketch'];

            commonStyles.forEach(style => {
                expect(STYLE_CONFIGS[style]).toBeDefined();
                expect(FLUX_STYLE_CONFIGS[style]).toBeDefined();
            });
        });
    });
});
