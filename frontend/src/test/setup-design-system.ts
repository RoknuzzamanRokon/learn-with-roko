// Simple setup for design system tests
import { vi } from 'vitest';

// Mock DOM environment for design system tests
Object.defineProperty(global, 'window', {
    value: {
        CSS: {
            supports: vi.fn(),
        },
        matchMedia: vi.fn(),
        getComputedStyle: vi.fn(),
    },
    writable: true,
});

Object.defineProperty(global, 'document', {
    value: {
        documentElement: {
            style: {
                setProperty: vi.fn(),
                removeProperty: vi.fn(),
            },
            classList: {
                add: vi.fn(),
            },
        },
    },
    writable: true,
});

// Mock Option constructor for color validation
Object.defineProperty(global, 'Option', {
    value: vi.fn().mockImplementation(() => ({
        style: { color: '' },
    })),
    writable: true,
});