#!/usr/bin/env node

/**
 * Build script with CSS optimization and critical CSS generation
 * Integrates all performance optimizations for production builds
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Import optimization utilities
const { CriticalCSSExtractor } = require("../src/styles/critical-css");
const { CSSPurgingOptimizer } = require("../src/styles/css-purging");
const { CSSOptimizer } = require("../src/styles/css-optimization");

class BuildOptimizer {
  constructor() {
    this.buildDir = path.join(__dirname, "../.next");
    this.staticDir = path.join(this.buildDir, "static");
    this.cssDir = path.join(this.staticDir, "css");

    this.criticalExtractor = new CriticalCSSExtractor();
    this.purgingOptimizer = new CSSPurgingOptimizer();
    this.cssOptimizer = new CSSOptimizer();
  }

  /**
   * Main build process with optimizations
   */
  async build() {
    console.log("🚀 Starting optimized build process...");

    try {
      // Step 1: Run standard Next.js build
      console.log("📦 Building Next.js application...");
      execSync("npm run build", { stdio: "inherit" });

      // Step 2: Generate critical CSS
      console.log("⚡ Generating critical CSS...");
      await this.generateCriticalCSS();

      // Step 3: Optimize CSS files
      console.log("🎯 Optimizing CSS files...");
      await this.optimizeCSSFiles();

      // Step 4: Generate optimization report
      console.log("📊 Generating optimization report...");
      await this.generateOptimizationReport();

      console.log("✅ Build optimization completed successfully!");
    } catch (error) {
      console.error("❌ Build optimization failed:", error);
      process.exit(1);
    }
  }

  /**
   * Generates critical CSS for different page types
   */
  async generateCriticalCSS() {
    const pages = [
      { path: "/", name: "home" },
      { path: "/auth/login", name: "auth" },
      { path: "/dashboard", name: "dashboard" },
      { path: "/learn/course", name: "course-player" },
      { path: "/admin", name: "admin" },
    ];

    const criticalCSSDir = path.join(this.buildDir, "critical-css");

    // Create critical CSS directory
    if (!fs.existsSync(criticalCSSDir)) {
      fs.mkdirSync(criticalCSSDir, { recursive: true });
    }

    for (const page of pages) {
      try {
        const criticalCSS = this.criticalExtractor.getCriticalCSSForPage(
          page.path
        );
        const filePath = path.join(criticalCSSDir, `${page.name}.css`);

        fs.writeFileSync(filePath, criticalCSS);
        console.log(
          `  ✓ Generated critical CSS for ${page.name} (${this.getFileSize(
            filePath
          )})`
        );
      } catch (error) {
        console.warn(
          `  ⚠ Failed to generate critical CSS for ${page.name}:`,
          error.message
        );
      }
    }

    // Generate inline critical CSS for HTML injection
    const inlineCSS = this.criticalExtractor.generateInlineCSS();
    if (inlineCSS) {
      const inlinePath = path.join(criticalCSSDir, "inline.html");
      fs.writeFileSync(inlinePath, inlineCSS);
      console.log(
        `  ✓ Generated inline critical CSS (${this.getFileSize(inlinePath)})`
      );
    }
  }

  /**
   * Optimizes all CSS files in the build directory
   */
  async optimizeCSSFiles() {
    if (!fs.existsSync(this.cssDir)) {
      console.log("  ℹ No CSS files found to optimize");
      return;
    }

    const cssFiles = fs
      .readdirSync(this.cssDir)
      .filter((file) => file.endsWith(".css"));
    const contentFiles = this.findContentFiles();

    for (const cssFile of cssFiles) {
      const filePath = path.join(this.cssDir, cssFile);
      const originalContent = fs.readFileSync(filePath, "utf8");
      const originalSize = originalContent.length;

      try {
        // Apply CSS purging
        const purgingResult = await this.purgingOptimizer.optimizeCSS(
          originalContent,
          contentFiles
        );

        // Apply general CSS optimization
        const optimizationResult = this.cssOptimizer.optimize(
          purgingResult.optimizedCSS
        );

        // Write optimized CSS
        fs.writeFileSync(filePath, optimizationResult.optimizedCSS);

        const finalSize = optimizationResult.optimizedCSS.length;
        const totalReduction =
          ((originalSize - finalSize) / originalSize) * 100;

        console.log(`  ✓ Optimized ${cssFile}:`);
        console.log(
          `    - Size: ${this.formatBytes(originalSize)} → ${this.formatBytes(
            finalSize
          )}`
        );
        console.log(`    - Reduction: ${totalReduction.toFixed(2)}%`);
        console.log(
          `    - Purged classes: ${purgingResult.removedClasses.length}`
        );
        console.log(
          `    - Optimizations: ${optimizationResult.optimizations.join(", ")}`
        );
      } catch (error) {
        console.warn(`  ⚠ Failed to optimize ${cssFile}:`, error.message);
      }
    }
  }

  /**
   * Finds all content files for CSS purging analysis
   */
  findContentFiles() {
    const contentFiles = [];
    const searchDirs = ["./app", "./src"];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        this.findFilesRecursively(dir, /\.(js|jsx|ts|tsx)$/, contentFiles);
      }
    }

    return contentFiles;
  }

  /**
   * Recursively finds files matching a pattern
   */
  findFilesRecursively(dir, pattern, results) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.findFilesRecursively(filePath, pattern, results);
      } else if (pattern.test(file)) {
        results.push(filePath);
      }
    }
  }

  /**
   * Generates comprehensive optimization report
   */
  async generateOptimizationReport() {
    const reportPath = path.join(this.buildDir, "optimization-report.json");

    const report = {
      timestamp: new Date().toISOString(),
      buildInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      cssOptimization: {
        criticalCSS: this.getCriticalCSSStats(),
        purging: this.purgingOptimizer.generateReport(),
        optimization: this.cssOptimizer.getStatistics(),
      },
      performance: {
        buildTime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`  ✓ Generated optimization report: ${reportPath}`);

    // Display summary
    this.displayOptimizationSummary(report);
  }

  /**
   * Gets critical CSS statistics
   */
  getCriticalCSSStats() {
    const criticalCSSDir = path.join(this.buildDir, "critical-css");

    if (!fs.existsSync(criticalCSSDir)) {
      return { files: 0, totalSize: 0 };
    }

    const files = fs.readdirSync(criticalCSSDir);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(criticalCSSDir, file);
      totalSize += fs.statSync(filePath).size;
    }

    return {
      files: files.length,
      totalSize,
      averageSize: files.length > 0 ? totalSize / files.length : 0,
    };
  }

  /**
   * Displays optimization summary
   */
  displayOptimizationSummary(report) {
    console.log("\n📊 Optimization Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const { criticalCSS, purging, optimization } = report.cssOptimization;

    console.log(`🎯 Critical CSS:`);
    console.log(`   Files generated: ${criticalCSS.files}`);
    console.log(`   Total size: ${this.formatBytes(criticalCSS.totalSize)}`);

    console.log(`🧹 CSS Purging:`);
    console.log(`   Classes analyzed: ${purging.statistics.totalDefined}`);
    console.log(`   Unused classes: ${purging.statistics.unused}`);
    console.log(
      `   Purging rate: ${purging.statistics.purgingPercentage.toFixed(2)}%`
    );

    console.log(`⚡ CSS Optimization:`);
    console.log(`   Variables defined: ${optimization.totalDefined}`);
    console.log(`   Variables used: ${optimization.totalUsed}`);
    console.log(`   Unused variables: ${optimization.unused}`);

    console.log(`💾 Performance:`);
    console.log(`   Build time: ${report.performance.buildTime.toFixed(2)}s`);
    console.log(
      `   Memory usage: ${this.formatBytes(
        report.performance.memoryUsage.heapUsed
      )}`
    );

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }

  /**
   * Gets file size in bytes
   */
  getFileSize(filePath) {
    try {
      return this.formatBytes(fs.statSync(filePath).size);
    } catch {
      return "unknown";
    }
  }

  /**
   * Formats bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

// Run build optimization if called directly
if (require.main === module) {
  const optimizer = new BuildOptimizer();
  optimizer.build().catch(console.error);
}

module.exports = { BuildOptimizer };
