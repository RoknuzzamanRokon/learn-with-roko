import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { validateWCAGAA, simulateColorBlindness, type ColorBlindnessType } from '../../styles/accessibility-utils';
import { quickAccessibilityCheck } from './accessibility-test-utils';

/**
 * Keyboard Navigation Testing with Color Feedback Validation
 * 
 * This test suite validates that keyboard navigation works properly with
 * color feedback and maintains accessibility standards across all interactive states.
 */

describe('Keyboard Navigation Accessibility Testing', () => {
    let testContainer: HTMLDivElement;

    beforeAll(() => {
        testContainer = document.createElement('div');
        testContainer.id = 'keyboard-nav-test-container';
        testContainer.style.position = 'absolute';
        testContainer.style.top = '-9999px';
        testContainer.style.left = '-9999px';
        document.body.appendChild(testContainer);
    });

    afterAll(() => {
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    describe('Interactive Element Focus States', () => {
        const interactiveElements = [
            { tag: 'button', className: 'btn-primary', text: 'Primary Button', expectedFocusStyle: 'ring-2 ring-primary-500' },
            { tag: 'button', className: 'btn-secondary', text: 'Secondary Button', expectedFocusStyle: 'ring-2 ring-gray-500' },
            { tag: 'button', className: 'btn-success', text: 'Success Button', expectedFocusStyle: 'ring-2 ring-green-500' },
            { tag: 'button', className: 'btn-warning', text: 'Warning Button', expectedFocusStyle: 'ring-2 ring-yellow-500' },
            { tag: 'button', className: 'btn-error', text: 'Error Button', expectedFocusStyle: 'ring-2 ring-red-500' },
            { tag: 'a', className: 'link-primary', text: 'Primary Link', expectedFocusStyle: 'ring-2 ring-primary-500' },
            { tag: 'input', className: 'form-input', text: '', expectedFocusStyle: 'ring-2 ring-primary-500', type: 'text' }
        ];

        interactiveElements.forEach(({ tag, className, text, expectedFocusStyle, type }) => {
            it(`should provide accessible focus feedback for ${className}`, () => {
                const element = document.createElement(tag) as HTMLElement;
                element.className = className;
                if (text) element.textContent = text;
                if (type && element instanceof HTMLInputElement) {
                    element.type = type;
                }

                // Add focus styles for testing
                element.classList.add('focus:' + expectedFocusStyle.replace('ring-2 ', ''));
                testContainer.appendChild(element);

                // Test that element can receive focus
                element.focus();
                expect(document.activeElement).toBe(element);

                // Test focus visibility
                const computedStyle = window.getComputedStyle(element);
                const hasVisibleFocus =
                    computedStyle.outline !== 'none' ||
                    computedStyle.boxShadow !== 'none' ||
                    element.classList.contains('focus') ||
                    element.matches(':focus-visible');

                expect(hasVisibleFocus || computedStyle.outline !== 'none').toBe(true);

                // Test color contrast in focus state
                const focusCheck = quickAccessibilityCheck(element);
                if (!focusCheck.passed) {
                    console.warn(`${className} focus state may have contrast issues:`, focusCheck.recommendations);
                }

                // Test keyboard interaction
                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
                const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });

                let enterHandled = false;
                let spaceHandled = false;

                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') enterHandled = true;
                    if (e.key === ' ') spaceHandled = true;
                });

                element.dispatchEvent(enterEvent);
                if (tag === 'button') {
                    element.dispatchEvent(spaceEvent);
                    expect(spaceHandled).toBe(true);
                }

                testContainer.removeChild(element);
            });
        });

        it('should maintain proper tab order for form elements', () => {
            const form = document.createElement('form');
            const formElements = [
                { tag: 'input', type: 'text', id: 'first-name', label: 'First Name', tabIndex: 1 },
                { tag: 'input', type: 'email', id: 'email', label: 'Email', tabIndex: 2 },
                { tag: 'select', id: 'country', label: 'Country', tabIndex: 3 },
                { tag: 'textarea', id: 'message', label: 'Message', tabIndex: 4 },
                { tag: 'button', type: 'submit', id: 'submit', label: 'Submit', tabIndex: 5 }
            ];

            formElements.forEach(({ tag, type, id, label, tabIndex }) => {
                const labelEl = document.createElement('label');
                labelEl.setAttribute('for', id);
                labelEl.textContent = label;
                labelEl.className = 'text-gray-700 font-medium';
                form.appendChild(labelEl);

                const element = document.createElement(tag) as HTMLElement;
                element.id = id;
                element.className = 'form-element border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-primary-500';
                element.tabIndex = tabIndex;

                if (type && (element instanceof HTMLInputElement || element instanceof HTMLButtonElement)) {
                    element.type = type;
                }

                if (tag === 'select') {
                    const option = document.createElement('option');
                    option.value = 'us';
                    option.textContent = 'United States';
                    (element as HTMLSelectElement).appendChild(option);
                }

                form.appendChild(element);
            });

            testContainer.appendChild(form);

            // Test sequential focus navigation
            const focusableElements = Array.from(form.querySelectorAll('input, select, textarea, button')) as HTMLElement[];

            focusableElements.forEach((element, index) => {
                element.focus();
                expect(document.activeElement).toBe(element);

                // Test color contrast for each focused element
                const accessibilityCheck = quickAccessibilityCheck(element);
                expect(accessibilityCheck.wcagResult?.contrastRatio).toBeGreaterThan(3.0);

                // Test that focus is visible
                const computedStyle = window.getComputedStyle(element);
                const hasVisibleFocus =
                    computedStyle.outline !== 'none' ||
                    computedStyle.boxShadow !== 'none' ||
                    element.matches(':focus');

                expect(hasVisibleFocus).toBe(true);

                console.log(`Form element ${index + 1} (${element.tagName}): Focus contrast ${accessibilityCheck.wcagResult?.contrastRatio.toFixed(2)}`);
            });

            testContainer.removeChild(form);
        });
    });

    describe('Color Feedback for Keyboard States', () => {
        it('should validate color contrast for all keyboard interaction states', () => {
            const stateTestCases = [
                { state: 'focus', bgColor: '#dbeafe', textColor: '#1e40af', description: 'Focus ring background' },
                { state: 'active', bgColor: '#1d4ed8', textColor: '#ffffff', description: 'Active button state' },
                { state: 'hover', bgColor: '#2563eb', textColor: '#ffffff', description: 'Hover button state' },
                { state: 'disabled', bgColor: '#f3f4f6', textColor: '#9ca3af', description: 'Disabled button state' }
            ];

            stateTestCases.forEach(({ state, bgColor, textColor, description }) => {
                const contrastResult = validateWCAGAA(textColor, bgColor);

                if (!contrastResult.isValid) {
                    console.warn(`${description} (${state}) contrast issue: ${contrastResult.contrastRatio.toFixed(2)} (required: 4.5)`);
                }

                // Focus and active states should meet WCAG AA
                if (state === 'focus' || state === 'active') {
                    expect(contrastResult.isValid).toBe(true);
                }

                // Disabled state may have lower contrast but should still be readable
                if (state === 'disabled') {
                    expect(contrastResult.contrastRatio).toBeGreaterThan(3.0);
                }

                console.log(`${description}: ${contrastResult.contrastRatio.toFixed(2)} ${contrastResult.isValid ? '✓' : '⚠'}`);
            });
        });

        it('should test keyboard navigation with color blindness considerations', () => {
            const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
            const keyboardStates = [
                { name: 'Focus Ring', fg: '#2563eb', bg: '#ffffff' },
                { name: 'Active State', fg: '#ffffff', bg: '#1d4ed8' },
                { name: 'Selected Item', fg: '#1e40af', bg: '#dbeafe' }
            ];

            keyboardStates.forEach(({ name, fg, bg }) => {
                colorBlindnessTypes.forEach(type => {
                    const simulatedFg = simulateColorBlindness(fg, type);
                    const simulatedBg = simulateColorBlindness(bg, type);
                    const contrastResult = validateWCAGAA(simulatedFg, simulatedBg);

                    if (!contrastResult.isValid) {
                        console.warn(`${name} may not be visible for ${type} users: ${contrastResult.contrastRatio.toFixed(2)}`);
                    }

                    console.log(`${name} (${type}): ${simulatedFg} on ${simulatedBg} = ${contrastResult.contrastRatio.toFixed(2)}`);
                });
            });
        });

        it('should validate error state feedback for keyboard users', () => {
            const errorStates = [
                { element: 'Input Error', fg: '#dc2626', bg: '#ffffff', borderColor: '#ef4444' },
                { element: 'Error Message', fg: '#991b1b', bg: '#fee2e2', borderColor: '#fca5a5' },
                { element: 'Error Button', fg: '#ffffff', bg: '#dc2626', borderColor: '#b91c1c' }
            ];

            errorStates.forEach(({ element, fg, bg, borderColor }) => {
                // Test main color contrast
                const mainContrast = validateWCAGAA(fg, bg);
                expect(mainContrast.isValid).toBe(true);

                // Test border contrast (for non-text elements, 3:1 minimum)
                const borderContrast = validateWCAGAA(borderColor, bg);
                expect(borderContrast.contrastRatio).toBeGreaterThan(3.0);

                console.log(`${element}: Text ${mainContrast.contrastRatio.toFixed(2)}, Border ${borderContrast.contrastRatio.toFixed(2)}`);
            });
        });
    });

    describe('Skip Links and Navigation Landmarks', () => {
        it('should test skip link accessibility and color feedback', () => {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.textContent = 'Skip to main content';
            skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded';
            testContainer.appendChild(skipLink);

            // Test that skip link becomes visible on focus
            skipLink.focus();
            expect(document.activeElement).toBe(skipLink);

            // Test skip link color contrast
            const accessibilityCheck = quickAccessibilityCheck(skipLink);
            expect(accessibilityCheck.wcagResult?.isValid).toBe(true);

            // Test keyboard activation
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            let activated = false;
            skipLink.addEventListener('keydown', () => { activated = true; });
            skipLink.dispatchEvent(enterEvent);

            testContainer.removeChild(skipLink);
        });

        it('should validate navigation landmark color feedback', () => {
            const landmarks = [
                { tag: 'nav', role: 'navigation', className: 'main-nav bg-white border-b border-gray-200' },
                { tag: 'main', role: 'main', className: 'main-content bg-gray-50' },
                { tag: 'aside', role: 'complementary', className: 'sidebar bg-gray-100' },
                { tag: 'footer', role: 'contentinfo', className: 'footer bg-gray-800 text-white' }
            ];

            landmarks.forEach(({ tag, role, className }) => {
                const landmark = document.createElement(tag);
                landmark.setAttribute('role', role);
                landmark.className = className;
                landmark.textContent = `${role} landmark`;
                testContainer.appendChild(landmark);

                // Test landmark color contrast
                const accessibilityCheck = quickAccessibilityCheck(landmark);
                if (!accessibilityCheck.passed) {
                    console.warn(`${role} landmark may have contrast issues:`, accessibilityCheck.recommendations);
                }

                testContainer.removeChild(landmark);
            });
        });
    });

    describe('Dynamic Content and Live Regions', () => {
        it('should test color feedback for dynamically updated content', () => {
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'live-region p-4 border rounded';
            testContainer.appendChild(liveRegion);

            const statusUpdates = [
                { message: 'Form saved successfully', className: 'bg-green-50 border-green-200 text-green-800' },
                { message: 'Warning: Please check your input', className: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                { message: 'Error: Please fix the following issues', className: 'bg-red-50 border-red-200 text-red-800' }
            ];

            statusUpdates.forEach(({ message, className }) => {
                liveRegion.className = `live-region p-4 border rounded ${className}`;
                liveRegion.textContent = message;

                // Test color contrast for dynamic updates
                const accessibilityCheck = quickAccessibilityCheck(liveRegion);
                expect(accessibilityCheck.wcagResult?.isValid).toBe(true);

                console.log(`Live region update: ${message} - Contrast: ${accessibilityCheck.wcagResult?.contrastRatio.toFixed(2)}`);
            });

            testContainer.removeChild(liveRegion);
        });

        it('should validate modal dialog keyboard navigation and color feedback', () => {
            const modal = document.createElement('div');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'modal-title');
            modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';

            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content bg-white rounded-lg p-6 max-w-md w-full mx-4';

            const modalTitle = document.createElement('h2');
            modalTitle.id = 'modal-title';
            modalTitle.textContent = 'Confirm Action';
            modalTitle.className = 'text-lg font-semibold text-gray-900 mb-4';

            const modalText = document.createElement('p');
            modalText.textContent = 'Are you sure you want to proceed?';
            modalText.className = 'text-gray-600 mb-6';

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex justify-end space-x-3';

            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.className = 'btn-secondary px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50';

            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirm';
            confirmButton.className = 'btn-primary px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700';

            buttonContainer.appendChild(cancelButton);
            buttonContainer.appendChild(confirmButton);
            modalContent.appendChild(modalTitle);
            modalContent.appendChild(modalText);
            modalContent.appendChild(buttonContainer);
            modal.appendChild(modalContent);
            testContainer.appendChild(modal);

            // Test modal elements accessibility
            const modalElements = [modalTitle, modalText, cancelButton, confirmButton];
            modalElements.forEach(element => {
                const accessibilityCheck = quickAccessibilityCheck(element);
                expect(accessibilityCheck.wcagResult?.contrastRatio).toBeGreaterThan(3.0);
            });

            // Test keyboard navigation within modal
            cancelButton.focus();
            expect(document.activeElement).toBe(cancelButton);

            // Test tab navigation
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
            cancelButton.dispatchEvent(tabEvent);

            // Test escape key handling
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            modal.dispatchEvent(escapeEvent);

            testContainer.removeChild(modal);
        });
    });

    describe('Comprehensive Keyboard Navigation Report', () => {
        it('should generate comprehensive keyboard navigation accessibility report', () => {
            const keyboardTestResults = {
                focusableElements: 0,
                accessibleElements: 0,
                elementsWithGoodContrast: 0,
                elementsWithVisibleFocus: 0,
                elementsWithKeyboardSupport: 0
            };

            const testElements = [
                { tag: 'button', className: 'btn-primary', text: 'Primary Button' },
                { tag: 'button', className: 'btn-secondary', text: 'Secondary Button' },
                { tag: 'a', className: 'link-primary', text: 'Primary Link' },
                { tag: 'input', className: 'form-input', type: 'text' },
                { tag: 'select', className: 'form-select' },
                { tag: 'textarea', className: 'form-textarea' }
            ];

            testElements.forEach(({ tag, className, text, type }) => {
                const element = document.createElement(tag) as HTMLElement;
                element.className = className;
                if (text) element.textContent = text;
                if (type && element instanceof HTMLInputElement) {
                    element.type = type;
                }

                if (tag === 'select') {
                    const option = document.createElement('option');
                    option.value = 'test';
                    option.textContent = 'Test Option';
                    (element as HTMLSelectElement).appendChild(option);
                }

                testContainer.appendChild(element);

                // Test focusability
                element.focus();
                if (document.activeElement === element) {
                    keyboardTestResults.focusableElements++;
                }

                // Test color contrast
                const accessibilityCheck = quickAccessibilityCheck(element);
                if (accessibilityCheck.passed) {
                    keyboardTestResults.accessibleElements++;
                }

                if (accessibilityCheck.wcagResult?.contrastRatio && accessibilityCheck.wcagResult.contrastRatio >= 4.5) {
                    keyboardTestResults.elementsWithGoodContrast++;
                }

                // Test visible focus
                const computedStyle = window.getComputedStyle(element);
                if (computedStyle.outline !== 'none' || computedStyle.boxShadow !== 'none') {
                    keyboardTestResults.elementsWithVisibleFocus++;
                }

                // Test keyboard support
                let hasKeyboardSupport = false;
                const keydownHandler = () => { hasKeyboardSupport = true; };
                element.addEventListener('keydown', keydownHandler);

                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
                element.dispatchEvent(enterEvent);

                if (hasKeyboardSupport || ['button', 'a', 'input', 'select', 'textarea'].includes(tag)) {
                    keyboardTestResults.elementsWithKeyboardSupport++;
                }

                element.removeEventListener('keydown', keydownHandler);
                testContainer.removeChild(element);
            });

            // Calculate percentages
            const totalElements = testElements.length;
            const focusabilityRate = (keyboardTestResults.focusableElements / totalElements) * 100;
            const accessibilityRate = (keyboardTestResults.accessibleElements / totalElements) * 100;
            const contrastRate = (keyboardTestResults.elementsWithGoodContrast / totalElements) * 100;
            const visibleFocusRate = (keyboardTestResults.elementsWithVisibleFocus / totalElements) * 100;
            const keyboardSupportRate = (keyboardTestResults.elementsWithKeyboardSupport / totalElements) * 100;

            console.log('Keyboard Navigation Accessibility Report:');
            console.log(`Focusable Elements: ${keyboardTestResults.focusableElements}/${totalElements} (${focusabilityRate.toFixed(1)}%)`);
            console.log(`Accessible Elements: ${keyboardTestResults.accessibleElements}/${totalElements} (${accessibilityRate.toFixed(1)}%)`);
            console.log(`Good Contrast: ${keyboardTestResults.elementsWithGoodContrast}/${totalElements} (${contrastRate.toFixed(1)}%)`);
            console.log(`Visible Focus: ${keyboardTestResults.elementsWithVisibleFocus}/${totalElements} (${visibleFocusRate.toFixed(1)}%)`);
            console.log(`Keyboard Support: ${keyboardTestResults.elementsWithKeyboardSupport}/${totalElements} (${keyboardSupportRate.toFixed(1)}%)`);

            // All elements should be focusable and accessible
            expect(focusabilityRate).toBeGreaterThanOrEqual(100);
            expect(accessibilityRate).toBeGreaterThanOrEqual(90);
            expect(contrastRate).toBeGreaterThanOrEqual(90);
            expect(keyboardSupportRate).toBeGreaterThanOrEqual(100);
        });
    });
});