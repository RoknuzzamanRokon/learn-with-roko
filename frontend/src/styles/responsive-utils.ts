// Responsive Design Utility Functions

/**
 * Breakpoint definitions matching CSS media queries
 */
export const BREAKPOINTS = {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    large: 1280,
    xl: 1536
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Device type detection
 */
export interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouch: boolean;
    hasHover: boolean;
    pixelRatio: number;
    orientation: 'portrait' | 'landscape';
    colorScheme: 'light' | 'dark';
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
}

/**
 * Get current device information
 */
export const getDeviceInfo = (): DeviceInfo => {
    if (typeof window === 'undefined') {
        return {
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            isTouch: false,
            hasHover: true,
            pixelRatio: 1,
            orientation: 'landscape',
            colorScheme: 'light',
            prefersReducedMotion: false,
            prefersHighContrast: false
        };
    }

    const width = window.innerWidth;
    const isMobile = width < BREAKPOINTS.tablet;
    const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
    const isDesktop = width >= BREAKPOINTS.desktop;

    return {
        isMobile,
        isTablet,
        isDesktop,
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        hasHover: window.matchMedia('(hover: hover)').matches,
        pixelRatio: window.devicePixelRatio || 1,
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches
    };
};

/**
 * Check if current viewport matches a breakpoint
 */
export const matchesBreakpoint = (breakpoint: Breakpoint, direction: 'up' | 'down' = 'up'): boolean => {
    if (typeof window === 'undefined') return false;

    const width = window.innerWidth;
    const breakpointValue = BREAKPOINTS[breakpoint];

    return direction === 'up' ? width >= breakpointValue : width < breakpointValue;
};

/**
 * Get current active breakpoint
 */
export const getCurrentBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;

    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.large) return 'large';
    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    return 'mobile';
};

/**
 * Responsive value selector based on breakpoint
 */
export const getResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>, fallback: T): T => {
    const currentBreakpoint = getCurrentBreakpoint();

    // Try current breakpoint first
    if (values[currentBreakpoint] !== undefined) {
        return values[currentBreakpoint]!;
    }

    // Fallback to smaller breakpoints
    const breakpointOrder: Breakpoint[] = ['xl', 'large', 'desktop', 'tablet', 'mobile'];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

    for (let i = currentIndex + 1; i < breakpointOrder.length; i++) {
        const breakpoint = breakpointOrder[i];
        if (values[breakpoint] !== undefined) {
            return values[breakpoint]!;
        }
    }

    return fallback;
};

/**
 * Touch-friendly interaction utilities
 */
export const getTouchTargetSize = (): number => {
    const deviceInfo = getDeviceInfo();

    if (deviceInfo.isMobile) {
        return 44; // iOS minimum touch target
    } else if (deviceInfo.isTablet) {
        return 40;
    }
    return 32; // Desktop
};

/**
 * Apply responsive classes based on device capabilities
 */
export const applyResponsiveClasses = (): void => {
    if (typeof window === 'undefined') return;

    const deviceInfo = getDeviceInfo();
    const html = document.documentElement;

    // Remove existing responsive classes
    html.classList.remove('is-mobile', 'is-tablet', 'is-desktop', 'has-touch', 'has-hover', 'high-dpi');

    // Add device type classes
    if (deviceInfo.isMobile) html.classList.add('is-mobile');
    if (deviceInfo.isTablet) html.classList.add('is-tablet');
    if (deviceInfo.isDesktop) html.classList.add('is-desktop');

    // Add interaction capability classes
    if (deviceInfo.isTouch) html.classList.add('has-touch');
    if (deviceInfo.hasHover) html.classList.add('has-hover');

    // Add display quality classes
    if (deviceInfo.pixelRatio >= 2) html.classList.add('high-dpi');

    // Add orientation class
    html.classList.remove('portrait', 'landscape');
    html.classList.add(deviceInfo.orientation);

    // Add color scheme class
    html.classList.remove('light-mode', 'dark-mode');
    html.classList.add(`${deviceInfo.colorScheme}-mode`);
};

/**
 * Responsive font size calculator
 */
export const getResponsiveFontSize = (baseSize: number): string => {
    const deviceInfo = getDeviceInfo();

    let scale = 1;
    if (deviceInfo.isMobile) {
        scale = 0.875; // Slightly smaller on mobile
    } else if (deviceInfo.isTablet) {
        scale = 0.9375; // Slightly smaller on tablet
    }

    return `${baseSize * scale}rem`;
};

/**
 * Responsive spacing calculator
 */
export const getResponsiveSpacing = (baseSpacing: number): string => {
    const deviceInfo = getDeviceInfo();

    let scale = 1;
    if (deviceInfo.isMobile) {
        scale = 0.75; // Tighter spacing on mobile
    } else if (deviceInfo.isTablet) {
        scale = 0.875; // Slightly tighter on tablet
    }

    return `${baseSpacing * scale}rem`;
};

/**
 * Dark mode utilities
 */
export const isDarkMode = (): boolean => {
    if (typeof window === 'undefined') return false;

    // Check for manual override first
    const stored = localStorage.getItem('color-scheme');
    if (stored) {
        return stored === 'dark';
    }

    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Toggle dark mode
 */
export const toggleDarkMode = (): void => {
    if (typeof window === 'undefined') return;

    const currentMode = isDarkMode();
    const newMode = currentMode ? 'light' : 'dark';

    localStorage.setItem('color-scheme', newMode);
    document.documentElement.setAttribute('data-color-scheme', newMode);

    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('colorSchemeChange', {
        detail: { colorScheme: newMode }
    }));
};

/**
 * Initialize dark mode based on preference
 */
export const initializeDarkMode = (): void => {
    if (typeof window === 'undefined') return;

    const preferredMode = isDarkMode() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-color-scheme', preferredMode);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
        // Only update if user hasn't manually set a preference
        if (!localStorage.getItem('color-scheme')) {
            const newMode = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-color-scheme', newMode);
            window.dispatchEvent(new CustomEvent('colorSchemeChange', {
                detail: { colorScheme: newMode }
            }));
        }
    });
};

/**
 * Responsive grid column calculator
 */
export const getResponsiveColumns = (
    mobile: number = 1,
    tablet: number = 2,
    desktop: number = 3,
    large: number = 4
): number => {
    return getResponsiveValue({
        mobile,
        tablet,
        desktop,
        large,
        xl: large
    }, desktop);
};

/**
 * Create responsive CSS custom properties
 */
export const setResponsiveProperties = (): void => {
    if (typeof window === 'undefined') return;

    const deviceInfo = getDeviceInfo();
    const root = document.documentElement;

    // Set touch target size
    root.style.setProperty('--touch-target-size', `${getTouchTargetSize()}px`);

    // Set responsive padding
    const padding = getResponsiveSpacing(1);
    root.style.setProperty('--responsive-padding', padding);

    // Set responsive font scale
    const fontScale = deviceInfo.isMobile ? '0.875' : '1';
    root.style.setProperty('--font-scale', fontScale);

    // Set grid columns
    const columns = getResponsiveColumns();
    root.style.setProperty('--grid-columns', columns.toString());
};

/**
 * Responsive image loading utility
 */
export const getResponsiveImageSrc = (
    baseSrc: string,
    sizes: { mobile?: string; tablet?: string; desktop?: string } = {}
): string => {
    const deviceInfo = getDeviceInfo();

    if (deviceInfo.isMobile && sizes.mobile) {
        return sizes.mobile;
    } else if (deviceInfo.isTablet && sizes.tablet) {
        return sizes.tablet;
    } else if (deviceInfo.isDesktop && sizes.desktop) {
        return sizes.desktop;
    }

    return baseSrc;
};

/**
 * Initialize all responsive features
 */
export const initializeResponsiveDesign = (): void => {
    if (typeof window === 'undefined') return;

    // Apply initial classes and properties
    applyResponsiveClasses();
    setResponsiveProperties();
    initializeDarkMode();

    // Listen for resize events
    let resizeTimeout: NodeJS.Timeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            applyResponsiveClasses();
            setResponsiveProperties();
        }, 150);
    });

    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            applyResponsiveClasses();
            setResponsiveProperties();
        }, 100);
    });
};

/**
 * Responsive animation duration based on motion preference
 */
export const getAnimationDuration = (baseDuration: number = 200): number => {
    if (typeof window === 'undefined') return baseDuration;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return prefersReducedMotion ? 0 : baseDuration;
};

/**
 * Create responsive breakpoint observer
 */
export const createBreakpointObserver = (
    callback: (breakpoint: Breakpoint) => void
): (() => void) => {
    if (typeof window === 'undefined') return () => { };

    let currentBreakpoint = getCurrentBreakpoint();

    const checkBreakpoint = () => {
        const newBreakpoint = getCurrentBreakpoint();
        if (newBreakpoint !== currentBreakpoint) {
            currentBreakpoint = newBreakpoint;
            callback(newBreakpoint);
        }
    };

    window.addEventListener('resize', checkBreakpoint);

    // Return cleanup function
    return () => {
        window.removeEventListener('resize', checkBreakpoint);
    };
};