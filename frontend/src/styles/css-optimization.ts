/**
 * CSS custom property optimization utilities for better performance
 * Optimizes CSS variable usage and reduces redundancy
 */

export interface OptimizationConfig {
    minifyVariables: boolean;
    deduplicateRules: boolean;
    optimizeSelectors: boolean;
    compressColors: boolean;
    removeUnusedVariables: boolean;
}

export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
    minifyVariables: true,
    deduplicateRules: true,
    optimizeSelectors: true,
    compressColors: true,
    removeUnusedVariables: true
};

/**
 * CSS variable usage tracker
 */
export class CSSVariableTracker {
    private definedVariables: Map<string, string> = new Map();
    private usedVariables: Set<string> = new Set();
    private variableReferences: Map<string, number> = new Map();

    /**
     * Analyzes CSS content to track variable definitions and usage
     */
    analyzeCSS(cssContent: string): void {
        this.extractVariableDefinitions(cssContent);
        this.extractVariableUsage(cssContent);
    }

    /**
     * Extracts CSS variable definitions from content
     */
    private extractVariableDefinitions(cssContent: string): void {
        const variableDefRegex = /--([\w-]+):\s*([^;]+);/g;
        let match;

        while ((match = variableDefRegex.exec(cssContent)) !== null) {
            const [, name, value] = match;
            this.definedVariables.set(`--${name}`, value.trim());
        }
    }

    /**
     * Extracts CSS variable usage from content
     */
    private extractVariableUsage(cssContent: string): void {
        const variableUseRegex = /var\((--[\w-]+)(?:,\s*([^)]+))?\)/g;
        let match;

        while ((match = variableUseRegex.exec(cssContent)) !== null) {
            const [, varName] = match;
            this.usedVariables.add(varName);

            const currentCount = this.variableReferences.get(varName) || 0;
            this.variableReferences.set(varName, currentCount + 1);
        }
    }

    /**
     * Gets unused CSS variables
     */
    getUnusedVariables(): string[] {
        const unused: string[] = [];

        for (const [varName] of this.definedVariables) {
            if (!this.usedVariables.has(varName)) {
                unused.push(varName);
            }
        }

        return unused;
    }

    /**
     * Gets variable usage statistics
     */
    getUsageStatistics(): {
        totalDefined: number;
        totalUsed: number;
        unused: number;
        mostUsed: Array<{ variable: string; count: number }>;
    } {
        const mostUsed = Array.from(this.variableReferences.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([variable, count]) => ({ variable, count }));

        return {
            totalDefined: this.definedVariables.size,
            totalUsed: this.usedVariables.size,
            unused: this.definedVariables.size - this.usedVariables.size,
            mostUsed
        };
    }

    /**
     * Gets all defined variables
     */
    getDefinedVariables(): Map<string, string> {
        return new Map(this.definedVariables);
    }

    /**
     * Gets all used variables
     */
    getUsedVariables(): Set<string> {
        return new Set(this.usedVariables);
    }
}

/**
 * CSS optimization engine
 */
export class CSSOptimizer {
    private config: OptimizationConfig;
    private tracker: CSSVariableTracker;

    constructor(config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG) {
        this.config = config;
        this.tracker = new CSSVariableTracker();
    }

    /**
     * Optimizes CSS content for better performance
     */
    optimize(cssContent: string): {
        optimizedCSS: string;
        optimizations: string[];
        sizeReduction: number;
    } {
        let optimized = cssContent;
        const optimizations: string[] = [];
        const originalSize = new Blob([cssContent]).size;

        // Track variables before optimization
        this.tracker.analyzeCSS(cssContent);

        if (this.config.removeUnusedVariables) {
            const result = this.removeUnusedVariables(optimized);
            optimized = result.css;
            if (result.removedCount > 0) {
                optimizations.push(`Removed ${result.removedCount} unused CSS variables`);
            }
        }

        if (this.config.deduplicateRules) {
            const result = this.deduplicateRules(optimized);
            optimized = result.css;
            if (result.removedCount > 0) {
                optimizations.push(`Deduplicated ${result.removedCount} CSS rules`);
            }
        }

        if (this.config.compressColors) {
            const result = this.compressColors(optimized);
            optimized = result.css;
            if (result.compressedCount > 0) {
                optimizations.push(`Compressed ${result.compressedCount} color values`);
            }
        }

        if (this.config.optimizeSelectors) {
            const result = this.optimizeSelectors(optimized);
            optimized = result.css;
            if (result.optimizedCount > 0) {
                optimizations.push(`Optimized ${result.optimizedCount} selectors`);
            }
        }

        if (this.config.minifyVariables) {
            optimized = this.minifyCSS(optimized);
            optimizations.push('Minified CSS content');
        }

        const optimizedSize = new Blob([optimized]).size;
        const sizeReduction = ((originalSize - optimizedSize) / originalSize) * 100;

        return {
            optimizedCSS: optimized,
            optimizations,
            sizeReduction
        };
    }

    /**
     * Removes unused CSS variables
     */
    private removeUnusedVariables(cssContent: string): { css: string; removedCount: number } {
        const unusedVariables = this.tracker.getUnusedVariables();
        let optimized = cssContent;
        let removedCount = 0;

        for (const varName of unusedVariables) {
            const varRegex = new RegExp(`\\s*${this.escapeRegex(varName)}:\\s*[^;]+;`, 'g');
            const beforeLength = optimized.length;
            optimized = optimized.replace(varRegex, '');

            if (optimized.length < beforeLength) {
                removedCount++;
            }
        }

        return { css: optimized, removedCount };
    }

    /**
     * Deduplicates identical CSS rules
     */
    private deduplicateRules(cssContent: string): { css: string; removedCount: number } {
        const ruleMap = new Map<string, string>();
        const ruleRegex = /([^{]+)\s*{\s*([^}]+)\s*}/g;
        let match;
        let removedCount = 0;

        // Extract all rules
        while ((match = ruleRegex.exec(cssContent)) !== null) {
            const [fullMatch, selector, declarations] = match;
            const normalizedDeclarations = this.normalizeDeclarations(declarations);

            if (ruleMap.has(normalizedDeclarations)) {
                // Combine selectors for identical rules
                const existingSelector = ruleMap.get(normalizedDeclarations)!;
                const combinedSelector = `${existingSelector}, ${selector.trim()}`;
                ruleMap.set(normalizedDeclarations, combinedSelector);
                removedCount++;
            } else {
                ruleMap.set(normalizedDeclarations, selector.trim());
            }
        }

        // Rebuild CSS with deduplicated rules
        let optimized = cssContent.replace(ruleRegex, '');

        for (const [declarations, selector] of ruleMap) {
            optimized += `${selector} { ${declarations} }\n`;
        }

        return { css: optimized, removedCount };
    }

    /**
     * Compresses color values (hex shorthand, etc.)
     */
    private compressColors(cssContent: string): { css: string; compressedCount: number } {
        let optimized = cssContent;
        let compressedCount = 0;

        // Convert 6-digit hex to 3-digit where possible
        const hexRegex = /#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g;
        optimized = optimized.replace(hexRegex, (match, r, g, b) => {
            compressedCount++;
            return `#${r}${g}${b}`;
        });

        // Convert rgb() to hex where beneficial
        const rgbRegex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;
        optimized = optimized.replace(rgbRegex, (match, r, g, b) => {
            const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
            if (hex.length <= match.length) {
                compressedCount++;
                return hex;
            }
            return match;
        });

        return { css: optimized, compressedCount };
    }

    /**
     * Optimizes CSS selectors
     */
    private optimizeSelectors(cssContent: string): { css: string; optimizedCount: number } {
        let optimized = cssContent;
        let optimizedCount = 0;

        // Remove redundant universal selectors
        optimized = optimized.replace(/\*\s*\+\s*/g, '+ ');
        optimized = optimized.replace(/\*\s*>\s*/g, '> ');

        // Optimize descendant selectors
        optimized = optimized.replace(/\s+>/g, ' >');
        optimized = optimized.replace(/>\s+/g, '> ');

        // Count optimizations (simplified)
        const originalSelectors = (cssContent.match(/[^{]+{/g) || []).length;
        const optimizedSelectors = (optimized.match(/[^{]+{/g) || []).length;
        optimizedCount = Math.max(0, originalSelectors - optimizedSelectors);

        return { css: optimized, optimizedCount };
    }

    /**
     * Minifies CSS content
     */
    private minifyCSS(cssContent: string): string {
        return cssContent
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove whitespace around special characters
            .replace(/\s*{\s*/g, '{')
            .replace(/;\s*/g, ';')
            .replace(/}\s*/g, '}')
            .replace(/:\s*/g, ':')
            .replace(/,\s*/g, ',')
            // Remove trailing semicolons
            .replace(/;}/g, '}')
            .trim();
    }

    /**
     * Normalizes CSS declarations for comparison
     */
    private normalizeDeclarations(declarations: string): string {
        return declarations
            .split(';')
            .map(decl => decl.trim())
            .filter(decl => decl.length > 0)
            .sort()
            .join(';');
    }

    /**
     * Escapes special regex characters
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Gets optimization statistics
     */
    getStatistics(): ReturnType<CSSVariableTracker['getUsageStatistics']> {
        return this.tracker.getUsageStatistics();
    }
}

/**
 * Performance-optimized CSS loader for runtime
 */
export class OptimizedCSSLoader {
    private cache: Map<string, string> = new Map();
    private optimizer: CSSOptimizer;

    constructor(config?: OptimizationConfig) {
        this.optimizer = new CSSOptimizer(config);
    }

    /**
     * Loads and optimizes CSS with caching
     */
    async loadOptimizedCSS(url: string, useCache: boolean = true): Promise<string> {
        if (useCache && this.cache.has(url)) {
            return this.cache.get(url)!;
        }

        try {
            // In a real implementation, you would fetch the CSS
            const cssContent = await this.fetchCSS(url);
            const { optimizedCSS } = this.optimizer.optimize(cssContent);

            if (useCache) {
                this.cache.set(url, optimizedCSS);
            }

            return optimizedCSS;
        } catch (error) {
            console.error(`Failed to load CSS from ${url}:`, error);
            throw error;
        }
    }

    /**
     * Simulates CSS fetching (replace with actual fetch in real implementation)
     */
    private async fetchCSS(url: string): Promise<string> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 10));

        // Return mock CSS content
        return `
      :root { --primary-600: #2563eb; --gray-900: #111827; }
      .btn-primary { background: var(--primary-600); color: white; }
      .text-gray-900 { color: var(--gray-900); }
    `;
    }

    /**
     * Clears the CSS cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Gets cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

/**
 * Build-time CSS optimization integration
 */
export function createOptimizationPlugin(config?: OptimizationConfig) {
    return {
        name: 'css-optimization',
        generateBundle(options: any, bundle: any) {
            const optimizer = new CSSOptimizer(config);

            for (const [fileName, chunk] of Object.entries(bundle)) {
                if (fileName.endsWith('.css') && (chunk as any).source) {
                    const { optimizedCSS, optimizations, sizeReduction } = optimizer.optimize((chunk as any).source);

                    (chunk as any).source = optimizedCSS;

                    console.log(`CSS Optimization Results for ${fileName}:`);
                    console.log(`- Size reduction: ${sizeReduction.toFixed(2)}%`);
                    console.log(`- Optimizations: ${optimizations.join(', ')}`);
                }
            }
        }
    };
}