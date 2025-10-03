export interface ColorPalette {
    '50': string;
    '100': string;
    '200': string;
    '300': string;
    '400': string;
    '500': string;
    '600': string;
    '700': string;
    '800': string;
    '900': string;
}

export interface AccentColors {
    purple: string;
    teal: string;
}

export interface ThemeConfig {
    id: string;
    name: string;
    colors: {
        primary: ColorPalette;
        neutral: ColorPalette;
        success: ColorPalette;
        warning: ColorPalette;
        error: ColorPalette;
        accent: AccentColors;
    };
    isDefault: boolean;
    isCustomizable: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ComponentStyleConfig {
    component: string;
    variants: {
        [key: string]: {
            background?: string;
            color?: string;
            border?: string;
            hover?: ComponentStyleState;
            active?: ComponentStyleState;
            disabled?: ComponentStyleState;
        };
    };
}

export interface ComponentStyleState {
    background?: string;
    color?: string;
    border?: string;
}

export interface ThemeValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    contrastRatios?: {
        [key: string]: number;
    };
}

export interface ColorAccessibilityResult {
    isValid: boolean;
    contrastRatio?: number;
    warnings: string[];
}

export interface ThemePreferences {
    userId: string;
    themeId: string;
    customizations?: Partial<ThemeConfig>;
    appliedAt: string;
}