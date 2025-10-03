/**
 * CSS purging utilities for removing unused color utilities in production
 * Optimizes bundle size by eliminating unused Tailwind color classes
 */

export interface PurgingConfig {
    enabled: boolean;
    safelist: string[];
    blocklist: string[];
    keyframes: boolean;
    fontFace: boolean;
    variables: boolean;
}

export const DEFAULT_PURGING_CONFIG: PurgingConfig = {
    enabled: process.env.NODE_ENV === 'production',
    safelist: [
        // Always keep critical color classes
        'text-primary-600',
        'text-gray-900',
        'text-white',
        'bg-primary-600',
        'bg-gray-50',
        'bg-gray-100',
        'border-gray-200',
        'border-primary-600',
        // Status colors
        'text-success-600',
        'text-warning-600',
        'text-error-600',
        'bg-success-50',
        'bg-warning-50',
        'bg-error-50',
        // Interactive states
        'hover:bg-primary-700',
        'focus:border-primary-600',
        'focus:ring-primary-500'
    ],
    blocklist: [
        // Remove unused color variations
        '*-25',
        '*-75',
        '*-150',
        '*-250',
        '*-350',
        '*-450',
        '*-550',
        '*-650',
        '*-750',
        '*-850',
        '*-950'
    ],
    keyframes: true,
    fontFace: true,
    variables: true
};

/**
 * CSS usage analyzer for identifying unused color utilities
 */
export class CSSUsageAnalyzer {
    private usedClasses: Set<string> = new Set();
    private colorClasses: Set<string> = new Set();

    constructor() {
        this.initializeColorClasses();
    }

    /**
     * Initializes the set of all possible color classes
     */
    private initializeColorClasses(): void {
        const colors = ['primary', 'gray', 'success', 'warning', 'error', 'accent-purple', 'accent-teal'];
        const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
        const properties = ['text', 'bg', 'border', 'ring', 'divide'];
        const states = ['', 'hover:', 'focus:', 'active:', 'disabled:'];

        for (const color of colors) {
            for (const shade of shades) {
                for (const property of properties) {
                    for (const state of states) {
                        this.colorClasses.add(`${state}${property}-${color}-${shade}`);
                    }
                }
            }
        }
    }

    /**
     * Analyzes HTML/JSX content to find used color classes
     */
    analyzeContent(content: string): Set<string> {
        const classRegex = /class(?:Name)?=["']([^"']+)["']/g;
        const usedInContent = new Set<string>();

        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const classes = match[1].split(/\s+/);
            for (const cls of classes) {
                if (this.colorClasses.has(cls)) {
                    usedInContent.add(cls);
                    this.usedClasses.add(cls);
                }
            }
        }

        return usedInContent;
    }

    /**
     * Analyzes multiple files for color class usage
     */
    async analyzeFiles(filePaths: string[]): Promise<Map<string, Set<string>>> {
        const results = new Map<string, Set<string>>();

        for (const filePath of filePaths) {
            try {
                // In a real implementation, you would read the file content
                // For this example, we'll simulate the analysis
                const usedClasses = this.simulateFileAnalysis(filePath);
                results.set(filePath, usedClasses);
            } catch (error) {
                console.warn(`Failed to analyze file: ${filePath}`, error);
            }
        }

        return results;
    }

    /**
     * Simulates file analysis (in real implementation, would read actual files)
     */
    private simulateFileAnalysis(filePath: string): Set<string> {
        const commonClasses = new Set([
            'text-gray-900',
            'text-primary-600',
            'bg-white',
            'bg-gray-50',
            'border-gray-200',
            'hover:bg-primary-700'
        ]);

        // Add file-specific classes based on path
        if (filePath.includes('dashboard')) {
            commonClasses.add('text-success-600');
            commonClasses.add('bg-success-50');
        }

        if (filePath.includes('auth')) {
            commonClasses.add('text-error-600');
            commonClasses.add('bg-error-50');
        }

        return commonClasses;
    }

    /**
     * Gets all used color classes across analyzed content
     */
    getUsedClasses(): Set<string> {
        return new Set(this.usedClasses);
    }

    /**
     * Gets unused color classes that can be purged
     */
    getUnusedClasses(): Set<string> {
        const unused = new Set<string>();

        for (const colorClass of this.colorClasses) {
            if (!this.usedClasses.has(colorClass)) {
                unused.add(colorClass);
            }
        }

        return unused;
    }

    /**
     * Generates purging statistics
     */
    getStatistics(): {
        totalClasses: number;
        usedClasses: number;
        unusedClasses: number;
        purgingPercentage: number;
    } {
        const totalClasses = this.colorClasses.size;
        const usedClasses = this.usedClasses.size;
        const unusedClasses = totalClasses - usedClasses;
        const purgingPercentage = (unusedClasses / totalClasses) * 100;

        return {
            totalClasses,
            usedClasses,
            unusedClasses,
            purgingPercentage
        };
    }
}

/**
 * CSS purging optimizer for production builds
 */
export class CSSPurgingOptimizer {
    private config: PurgingConfig;
    private analyzer: CSSUsageAnalyzer;

    constructor(config: PurgingConfig = DEFAULT_PURGING_CONFIG) {
        this.config = config;
        this.analyzer = new CSSUsageAnalyzer();
    }

    /**
     * Optimizes CSS by removing unused color utilities
     */
    async optimizeCSS(cssContent: string, contentFiles: string[]): Promise<{
        optimizedCSS: string;
        removedClasses: string[];
        sizeReduction: number;
    }> {
        if (!this.config.enabled) {
            return {
                optimizedCSS: cssContent,
                removedClasses: [],
                sizeReduction: 0
            };
        }

        // Analyze content files to find used classes
        await this.analyzer.analyzeFiles(contentFiles);
        const usedClasses = this.analyzer.getUsedClasses();
        const unusedClasses = this.analyzer.getUnusedClasses();

        // Apply safelist and blocklist
        const classesToRemove = this.applyFilters(unusedClasses);

        // Remove unused classes from CSS
        const optimizedCSS = this.removeUnusedClasses(cssContent, classesToRemove);

        // Calculate size reduction
        const originalSize = new Blob([cssContent]).size;
        const optimizedSize = new Blob([optimizedCSS]).size;
        const sizeReduction = ((originalSize - optimizedSize) / originalSize) * 100;

        return {
            optimizedCSS,
            removedClasses: Array.from(classesToRemove),
            sizeReduction
        };
    }

    /**
     * Applies safelist and blocklist filters
     */
    private applyFilters(unusedClasses: Set<string>): Set<string> {
        const filtered = new Set<string>();

        for (const className of unusedClasses) {
            // Skip if in safelist
            if (this.config.safelist.some(safe => this.matchesPattern(className, safe))) {
                continue;
            }

            // Include if in blocklist or not protected
            if (this.config.blocklist.some(blocked => this.matchesPattern(className, blocked))) {
                filtered.add(className);
            } else {
                filtered.add(className);
            }
        }

        return filtered;
    }

    /**
     * Checks if a class name matches a pattern (supports wildcards)
     */
    private matchesPattern(className: string, pattern: string): boolean {
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(className);
        }
        return className === pattern;
    }

    /**
     * Removes unused classes from CSS content
     */
    private removeUnusedClasses(cssContent: string, classesToRemove: Set<string>): string {
        let optimizedCSS = cssContent;

        for (const className of classesToRemove) {
            // Remove utility class definitions
            const classRegex = new RegExp(`\\.${this.escapeRegex(className)}\\s*{[^}]*}`, 'g');
            optimizedCSS = optimizedCSS.replace(classRegex, '');

            // Remove responsive variants
            const responsiveRegex = new RegExp(`@media[^{]*{[^}]*\\.${this.escapeRegex(className)}\\s*{[^}]*}[^}]*}`, 'g');
            optimizedCSS = optimizedCSS.replace(responsiveRegex, '');
        }

        // Clean up empty media queries and rules
        optimizedCSS = this.cleanupEmptyRules(optimizedCSS);

        return optimizedCSS;
    }

    /**
     * Escapes special regex characters in class names
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Removes empty CSS rules and media queries
     */
    private cleanupEmptyRules(cssContent: string): string {
        // Remove empty rules
        let cleaned = cssContent.replace(/[^}]*{\s*}/g, '');

        // Remove empty media queries
        cleaned = cleaned.replace(/@media[^{]*{\s*}/g, '');

        // Remove multiple consecutive newlines
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

        return cleaned.trim();
    }

    /**
     * Generates optimization report
     */
    generateReport(): {
        statistics: ReturnType<CSSUsageAnalyzer['getStatistics']>;
        config: PurgingConfig;
        timestamp: string;
    } {
        return {
            statistics: this.analyzer.getStatistics(),
            config: this.config,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Webpack plugin integration for CSS purging
 */
export class CSSPurgingWebpackPlugin {
    private optimizer: CSSPurgingOptimizer;

    constructor(config?: Partial<PurgingConfig>) {
        this.optimizer = new CSSPurgingOptimizer({
            ...DEFAULT_PURGING_CONFIG,
            ...config
        });
    }

    apply(compiler: any): void {
        compiler.hooks.emit.tapAsync('CSSPurgingPlugin', (compilation: any, callback: any) => {
            // Find CSS assets
            const cssAssets = Object.keys(compilation.assets).filter(name => name.endsWith('.css'));

            // Find content files
            const contentFiles = Object.keys(compilation.assets).filter(name =>
                name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.ts') || name.endsWith('.tsx')
            );

            // Process each CSS asset
            Promise.all(cssAssets.map(async (assetName) => {
                const asset = compilation.assets[assetName];
                const cssContent = asset.source();

                const { optimizedCSS, removedClasses, sizeReduction } = await this.optimizer.optimizeCSS(
                    cssContent,
                    contentFiles
                );

                // Update the asset with optimized CSS
                compilation.assets[assetName] = {
                    source: () => optimizedCSS,
                    size: () => optimizedCSS.length
                };

                // Log optimization results
                console.log(`CSS Purging Results for ${assetName}:`);
                console.log(`- Removed ${removedClasses.length} unused classes`);
                console.log(`- Size reduction: ${sizeReduction.toFixed(2)}%`);
            })).then(() => callback()).catch(callback);
        });
    }
}

/**
 * Next.js integration helper
 */
export function createNextJSPurgingConfig(contentPaths: string[]): any {
    return {
        content: contentPaths,
        safelist: DEFAULT_PURGING_CONFIG.safelist,
        blocklist: DEFAULT_PURGING_CONFIG.blocklist,
        defaultExtractor: (content: string) => {
            const analyzer = new CSSUsageAnalyzer();
            return Array.from(analyzer.analyzeContent(content));
        }
    };
}