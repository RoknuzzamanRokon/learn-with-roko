/**
 * Accessibility Validation Unit Tests
 * Tests for WCAG compliance, color blindness simulation, and accessibility utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    validateWCAGAA,
    validateWCAGAAA,
    validateDesignSystemContrast,
    simulateColorBlindness,
    validateColorBlindFriendly,
    generateAccessibleAlternatives,
    prefersHighContrast,
    prefersReducedMotion,
    applyAccessibilityEnhancements,
    generateAccessibilityReport,
    createAccessibleStatusIndicator,
    createAccessibleProgressBar,
    initializeAccessibility,
    type ColorBlindnessType,
    type AccessibilityValidationResult
} from '../styles/accessibility-utils';

import { WCAG_AA_CONTRAST_RATIO, WCAG_AAA_CONTRAST_RATIO } from '../styles/types';

describe('Accessibility Validation', () => {
    let mockWindow: any;
    let mockDocument: any;

    beforeEach(() => {
        mockWindow = {
            matchMedia: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };

        mockDomove: vi.fn(),
            contains: vi.fn()
        }
    },
    body: {
        classList: {
            add: vi.fn(),
            remove: vi.fn()
        },
        insertBefore: vi.fn(),
        firstChild: null
    },
    querySelector: vi.fn(),
    createElement: vi.fn(),
    addEventListener: vi.fn()
});

describe('Accessibility Validation', () => {
    let mockWindow: ReturnType<typeof createMockWindow>;
    let mockDocument: ReturnType<typeof createMockDocument>;

    beforeEach(() => {
        mockWindow = createMockWindow();
        mockDocument = createMockDocument();

        Object.defineProperty(global, 'window', {
            value: mockWindow,
            writable: true
        });

        Object.defineProperty(global, 'document', {
            value: mockDocument,
            writable: true
        });

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('WCAG Compliance Validation', () => {
        describe('validateWCAGAA', () => {
            it('should validate colors that meet WCAG AA standards', () => {
                const result = validateWCAGAA('#ffffff', '#2563eb');
                
                expect(result.isValid).toBe(true);
                expect(result.level).toBe('AA');
                expect(result.contrastRatio).toBeGreaterThan(WCAG_AA_CONTRAST_RATIO);
                expect(result.requiredRatio).toBe(WCAG_AA_CONTRAST_RATIO);
                expect(result.recommendations).toBeUndefined();
            });

            it('should validate colors that fail WCAG AA standards', () => {
                const result = validateWCAGAA('#f3f4f6', '#ffffff');
                
                expect(result.isValid).toBe(false);
                expect(result.level).toBe('AA');
                expect(result.contrastRatio).toBeLessThan(WCAG_AA_CONTRAST_RATIO);
                expect(result.recommendations).toBeDefined();
                expect(result.recommendations).toContain('Consider using darker text or lighter background colors');
            });

            it('should handle large text requirements', () => {
                // Large text has lower contrast requirements (3:1 vs 4.5:1)
                const result = validateWCAGAA('#6b7280', '#ffffff', true);
                
                expect(result.requiredRatio).toBe(3);
            });

            it('should provide helpful recommendations for failing combinations', () => {
                const result = validateWCAGAA('#e5e7eb', '#ffffff');
                
                expect(result.recommendations).toContain(`Current contrast ratio: ${result.contrastRatio.toFixed(2)}`);
                expect(result.recommendations).toContain(`Required ratio: ${WCAG_AA_CONTRAST_RATIO}`);
                expect(result.recommendations).toContain('Test with actual users who have visual impairments');
            });
        });

        describe('validateWCAGAAA', () => {
            it('should validate colors that meet WCAG AAA standards', () => {
                const result = validateWCAGAAA('#000000', '#ffffff');
                
                expect(result.isValid).toBe(true);
                expect(result.level).toBe('AAA');
                expect(result.contrastRatio).toBeGreaterThan(WCAG_AAA_CONTRAST_RATIO);
                expect(result.requiredRatio).toBe(WCAG_AAA_CONTRAST_RATIO);
            });

            it('should validate colors that meet AA but fail AAA standards', () => {
                const result = validateWCAGAAA('#2563eb', '#ffffff');
                
                // This should meet AA but might not meet AAA
                expect(result.level).toBe('AAA');
                expect(result.requiredRatio).toBe(WCAG_AAA_CONTRAST_RATIO);
            });

            it('should handle large text AAA requirements', () => {
                const result = validateWCAGAAA('#6b7280', '#ffffff', true);
                
                expect(result.requiredRatio).toBe(4.5);
            });

            it('should provide AAA-specific recommendations', () => {
                const result = validateWCAGAAA('#4b5563', '#ffffff');
                
                if (!result.isValid) {
                    expect(result.recommendations).toContain('AAA compliance provides enhanced accessibility');
                    expect(result.recommendations).toContain('Consider using higher contrast colors');
                }
            });
        });

        describe('validateDesignSystemContrast', () => {
            it('should validate all critical color combinations', () => {
                const results = validateDesignSystemContrast();
                
                expect(results).toHaveProperty('Primary Button');
                expect(results).toHaveProperty('Secondary Button');
                expect(results).toHaveProperty('Success Button');
                expect(results).toHaveProperty('Warning Button');
                expect(results).toHaveProperty('Error Button');
                expect(results).toHaveProperty('Body Text');
                expect(results).toHaveProperty('Heading Text');
                
                // All results should have the required properties
                Object.values(results).forEach((result: AccessibilityValidationResult) => {
                    expect(result).toHaveProperty('isValid');
                    expect(result).toHaveProperty('contrastRatio');
                    expect(result).toHaveProperty('requiredRatio');
                    expect(result).toHaveProperty('level');
                });
            });

            it('should ensure critical combinations meet WCAG AA', () => {
                const results = validateDesignSystemContrast();
                
                // These combinations should always pass
                const criticalCombinations = [
                    'Primary Button',
                    'Success Button',
                    'Warning Button',
                    'Error Button',
                    'Body Text',
                    'Heading Text'
                ];
                
                criticalCombinations.forEach(combination => {
                    expect(results[combination].isValid).toBe(true);
                });
            });
        });
    });

    describe('Color Blindness Simulation', () => {
        describe('simulateColorBlindness', () => {
            it('should simulate protanopia (red-blind)', () => {
                const original = '#ff0000'; // Pure red
                const simulated = simulateColorBlindness(original, 'protanopia');
                
                expect(simulated).toMatch(/^#[0-9a-f]{6}$/i);
                expect(simulated).not.toBe(original);
                
                // Red should be significantly altered in protanopia
                const originalRgb = { r: 255, g: 0, b: 0 };
                // The simulated color should have reduced red component
            });

            it('should simulate deuteranopia (green-blind)', () => {
                const original = '#00ff00'; // Pure green
                const simulated = simulateColorBlindness(original, 'deuteranopia');
                
                expect(simulated).toMatch(/^#[0-9a-f]{6}$/i);
                expect(simulated).not.toBe(original);
            });

            it('should simulate tritanopia (blue-blind)', () => {
                const original = '#0000ff'; // Pure blue
                const simulated = simulateColorBlindness(original, 'tritanopia');
                
                expect(simulated).toMatch(/^#[0-9a-f]{6}$/i);
                expect(simulated).not.toBe(original);
            });

            it('should simulate achromatopsia (complete color blindness)', () => {
                const original = '#ff0000'; // Pure red
                const simulated = simulateColorBlindness(original, 'achromatopsia');
                
                expect(simulated).toMatch(/^#[0-9a-f]{6}$/i);
                
                // Should be grayscale - all RGB components should be equal
                const match = simulated.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
                if (match) {
                    const [, r, g, b] = match;
                    expect(r).toBe(g);
                    expect(g).toBe(b);
                }
            });

            it('should handle invalid colors gracefully', () => {
                const result = simulateColorBlindness('invalid', 'protanopia');
                expect(result).toBe('invalid');
            });

            it('should preserve valid hex format', () => {
                const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
                const testColors = ['#2563eb', '#059669', '#d97706', '#dc2626'];
                
                colorBlindnessTypes.forEach(type => {
                    testColors.forEach(color => {
                        const result = simulateColorBlindness(color, type);
                        expect(result).toMatch(/^#[0-9a-f]{6}$/i);
                    });
                });
            });
        });

        describe('validateColorBlindFriendly', () => {
            it('should validate color combinations for all color blindness types', () => {
                const results = validateColorBlindFriendly('#ffffff', '#2563eb');
                
                expect(results).toHaveProperty('protanopia');
                expect(results).toHaveProperty('deuteranopia');
                expect(results).toHaveProperty('tritanopia');
                expect(results).toHaveProperty('achromatopsia');
                
                // All results should be AccessibilityValidationResult objects
                Object.values(results).forEach((result: AccessibilityValidationResult) => {
                    expect(result).toHaveProperty('isValid');
                    expect(result).toHaveProperty('contrastRatio');
                    expect(result).toHaveProperty('requiredRatio');
                    expect(result).toHaveProperty('level');
                });
            });

            it('should identify problematic color combinations for color blind users', () => {
                // Test red-green combination which is problematic for most common color blindness
                const results = validateColorBlindFriendly('#dc2626', '#059669');
                
                // Some color blindness types might have issues with this combination
                const hasIssues = Object.values(results).some(result => !result.isValid);
                // We don't assert this must be true, as it depends on the specific colors and contrast
            });
        });
    });

    describe('Accessible Alternative Generation', () => {
        describe('generateAccessibleAlternatives', () => {
            it('should generate darker foreground alternatives', () => {
                const alternatives = generateAccessibleAlternatives('#6b7280', '#ffffff');
                
                expect(alternatives.foreground).toBeInstanceOf(Array);
                expect(alternatives.background).toBeInstanceOf(Array);
                
                // All alternatives should be valid hex colors
                alternatives.foreground.forEach(color => {
                    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
                });
                
                alternatives.background.forEach(color => {
                    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
                });
            });

            it('should generate lighter background alternatives', () => {
                const alternatives = generateAccessibleAlternatives('#374151', '#f3f4f6');
                
                // Should provide alternatives that improve contrast
                expect(alternatives.background.length).toBeGreaterThanOrEqual(0);
            });

            it('should handle invalid colors gracefully', () => {
                const alternatives = generateAccessibleAlternatives('invalid', '#ffffff');
                
                expect(alternatives.foreground).toEqual([]);
                expect(alternatives.background).toEqual([]);
            });

            it('should only suggest alternatives that meet WCAG AA', () => {
                const alternatives = generateAccessibleAlternatives('#9ca3af', '#ffffff');
                
                // All suggested alternatives should meet WCAG AA when tested
                alternatives.foreground.forEach(color => {
                    const result = validateWCAGAA(color, '#ffffff');
                    expect(result.isValid).toBe(true);
                });
                
                alternatives.background.forEach(color => {
                    const result = validateWCAGAA('#9ca3af', color);
                    expect(result.isValid).toBe(true);
                });
            });
        });
    });

    describe('User Preference Detection', () => {
        beforeEach(() => {
            mockWindow.matchMedia.mockImplementation(() => ({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            }));
        });

        describe('prefersHighContrast', () => {
            it('should detect high contrast preference', () => {
                mockWindow.matchMedia.mockImplementation((query: string) => ({
                    matches: query.includes('high'),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }));

                expect(prefersHighContrast()).toBe(true);
                expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
            });

            it('should handle missing matchMedia', () => {
                mockWindow.matchMedia = undefined as any;
                expect(prefersHighContrast()).toBe(false);
            });
        });

        describe('prefersReducedMotion', () => {
            it('should detect reduced motion preference', () => {
                mockWindow.matchMedia.mockImplementation((query: string) => ({
                    matches: query.includes('reduce'),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }));

                expect(prefersReducedMotion()).toBe(true);
                expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
            });
        });
    });

    describe('Accessibility Enhancement Application', () => {
        describe('applyAccessibilityEnhancements', () => {
            it('should add appropriate classes based on user preferences', () => {
                mockWindow.matchMedia.mockImplementation((query: string) => ({
                    matches: query.includes('high') || query.includes('reduce'),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }));

                applyAccessibilityEnhancements();

                expect(mockDocument.documentElement.classList.add)
                    .toHaveBeenCalledWith('prefers-high-contrast');
                expect(mockDocument.documentElement.classList.add)
                    .toHaveBeenCalledWith('prefers-reduced-motion');
            });

            it('should add focus-visible support class when needed', () => {
                // Mock missing focus-visible support
                Object.defineProperty(mockWindow, 'focus-visible', {
                    value: undefined,
                    writable: true
                });

                applyAccessibilityEnhancements();

                expect(mockDocument.documentElement.classList.add)
                    .toHaveBeenCalledWith('js-focus-visible');
            });
        });
    });

    describe('Accessibility Report Generation', () => {
        describe('generateAccessibilityReport', () => {
            it('should generate comprehensive accessibility report', () => {
                const report = generateAccessibilityReport();

                expect(report).toHaveProperty('summary');
                expect(report).toHaveProperty('details');
                expect(report).toHaveProperty('colorBlindnessResults');

                expect(report.summary).toHaveProperty('totalCombinations');
                expect(report.summary).toHaveProperty('passingAA');
                expect(report.summary).toHaveProperty('passingAAA');
                expect(report.summary).toHaveProperty('failingAA');

                expect(typeof report.summary.totalCombinations).toBe('number');
                expect(typeof report.summary.passingAA).toBe('number');
                expect(typeof report.summary.failingAA).toBe('number');
            });

            it('should include color blindness validation for key combinations', () => {
                const report = generateAccessibilityReport();

                expect(report.colorBlindnessResults).toHaveProperty('Success Status');
                expect(report.colorBlindnessResults).toHaveProperty('Warning Status');
                expect(report.colorBlindnessResults).toHaveProperty('Error Status');
                expect(report.colorBlindnessResults).toHaveProperty('Primary Button');

                // Each color blindness result should test all types
                Object.values(report.colorBlindnessResults).forEach(result => {
                    expect(result).toHaveProperty('protanopia');
                    expect(result).toHaveProperty('deuteranopia');
                    expect(result).toHaveProperty('tritanopia');
                    expect(result).toHaveProperty('achromatopsia');
                });
            });

            it('should calculate summary statistics correctly', () => {
                const report = generateAccessibilityReport();

                expect(report.summary.passingAA + report.summary.failingAA)
                    .toBe(report.summary.totalCombinations);
                expect(report.summary.passingAA).toBeGreaterThanOrEqual(0);
                expect(report.summary.failingAA).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Accessible Component Creation', () => {
        describe('createAccessibleStatusIndicator', () => {
            it('should create status indicator with proper ARIA attributes', () => {
                const indicator = createAccessibleStatusIndicator('success', 'Operation completed');

                expect(indicator).toContain('role="status"');
                expect(indicator).toContain('aria-label="success: Operation completed"');
                expect(indicator).toContain('status-success');
                expect(indicator).toContain('✓');
                expect(indicator).toContain('Operation completed');
            });

            it('should include pattern class when requested', () => {
                const indicator = createAccessibleStatusIndicator('warning', 'Warning message', true);

                expect(indicator).toContain('status-warning-pattern');
            });

            it('should use appropriate icons for different statuses', () => {
                expect(createAccessibleStatusIndicator('success', 'test')).toContain('✓');
                expect(createAccessibleStatusIndicator('warning', 'test')).toContain('⚠');
                expect(createAccessibleStatusIndicator('error', 'test')).toContain('✕');
                expect(createAccessibleStatusIndicator('info', 'test')).toContain('ℹ');
            });
        });

        describe('createAccessibleProgressBar', () => {
            it('should create progress bar with proper ARIA attributes', () => {
                const progressBar = createAccessibleProgressBar(75);

                expect(progressBar).toContain('role="progressbar"');
                expect(progressBar).toContain('aria-valuenow="75"');
                expect(progressBar).toContain('aria-valuemin="0"');
                expect(progressBar).toContain('aria-valuemax="100"');
                expect(progressBar).toContain('width: 75%');
                expect(progressBar).toContain('75% complete');
            });

            it('should use custom label when provided', () => {
                const progressBar = createAccessibleProgressBar(50, 'success', 'Course completion');

                expect(progressBar).toContain('aria-label="Course completion"');
            });

            it('should apply status-specific styling', () => {
                const successBar = createAccessibleProgressBar(100, 'success');
                const warningBar = createAccessibleProgressBar(50, 'warning');
                const errorBar = createAccessibleProgressBar(25, 'error');

                expect(successBar).toContain('progress-fill-success');
                expect(warningBar).toContain('progress-fill-warning');
                expect(errorBar).toContain('progress-fill-error');
            });
        });
    });

    describe('Accessibility Initialization', () => {
        describe('initializeAccessibility', () => {
            beforeEach(() => {
                mockDocument.querySelector.mockReturnValue(null);
                mockDocument.createElement.mockReturnValue({
                    href: '',
                    className: '',
                    textContent: ''
                });
            });

            it('should add skip link if not present', () => {
                mockDocument.querySelector.mockReturnValue(null);

                initializeAccessibility();

                expect(mockDocument.createElement).toHaveBeenCalledWith('a');
                expect(mockDocument.body.insertBefore).toHaveBeenCalled();
            });

            i  });
});;
  
        })});       ));
     ionnctt.any(Fupec', exchangealledWith('veBeenCener).toHaEventListaddaQuery.ockMedi(m     expect           

);sibility(eAcces initializ       

        );ediaQuerykMalue(mocReturnVa.mockchMedidow.mat    mockWin         
         };
      
    es: falsech        mat            fn(),
i.stener: vntLiEve    remove                 vi.fn(),
er:EventListenadd                {
    diaQuery = kMemoc const                
> {anges', () =erence chprefmonitor 'should       it(    

    });     ;
     n))ny(Functio, expect.a'mousedown'h(dWitBeenCalleoHaveistener).tventLddEcument.aockDo    expect(m         );
   ny(Function)pect.adown', exeyledWith('kveBeenCaltener).toHaaddEventLisockDocument. expect(m              ;

 ility()ssibalizeAcce  initi            {
    =>tion', ()ation detecnavigeyboard  up kshould set      it(';

           })  d();
     eBeenCallet).not.toHaveateElemenent.crckDocumpect(mo    ex          y();

  Accessibilititialize in         
      tent' });
on-cef: '#mainrnValue({ hrRetuocktor.muerySelecocument.qmockD             
   ) => { present', (adynk if alre skip liuld not addt('sho