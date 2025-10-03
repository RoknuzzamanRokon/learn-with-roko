#!/usr/bin/env node

/**
 * CSS validation script to check if Tailwind CSS and custom styles are working properly
 */

const fs = require("fs");
const path = require("path");

class CSSValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validates the CSS setup
   */
  validate() {
    console.log("🔍 Validating CSS setup...\n");

    this.checkTailwindConfig();
    this.checkPostCSSConfig();
    this.checkGlobalCSS();
    this.checkCSSVariables();

    this.displayResults();
  }

  /**
   * Checks Tailwind configuration
   */
  checkTailwindConfig() {
    const configPath = path.join(__dirname, "../tailwind.config.ts");

    if (!fs.existsSync(configPath)) {
      this.errors.push("Tailwind config file not found");
      return;
    }

    const config = fs.readFileSync(configPath, "utf8");

    // Check for correct content paths
    if (!config.includes("./app/**/*.{js,ts,jsx,tsx,mdx}")) {
      this.warnings.push(
        "App directory not included in Tailwind content paths"
      );
    }

    if (!config.includes("./src/**/*.{js,ts,jsx,tsx,mdx}")) {
      this.warnings.push(
        "Src directory not included in Tailwind content paths"
      );
    }

    console.log("✅ Tailwind config validated");
  }

  /**
   * Checks PostCSS configuration
   */
  checkPostCSSConfig() {
    const configPath = path.join(__dirname, "../postcss.config.mjs");

    if (!fs.existsSync(configPath)) {
      this.errors.push("PostCSS config file not found");
      return;
    }

    const config = fs.readFileSync(configPath, "utf8");

    if (!config.includes("@tailwindcss/postcss")) {
      this.errors.push("Tailwind CSS PostCSS plugin not configured");
    }

    if (!config.includes("autoprefixer")) {
      this.warnings.push("Autoprefixer not configured");
    }

    console.log("✅ PostCSS config validated");
  }

  /**
   * Checks global CSS file
   */
  checkGlobalCSS() {
    const cssPath = path.join(__dirname, "../app/globals.css");

    if (!fs.existsSync(cssPath)) {
      this.errors.push("Global CSS file not found");
      return;
    }

    const css = fs.readFileSync(cssPath, "utf8");

    // Check for correct Tailwind import
    if (!css.includes('@import "tailwindcss"')) {
      this.errors.push("Incorrect Tailwind CSS import in globals.css");
    }

    // Check for old imports
    if (
      css.includes('@import "tailwindcss/base"') ||
      css.includes('@import "tailwindcss/components"') ||
      css.includes('@import "tailwindcss/utilities"')
    ) {
      this.warnings.push(
        'Old Tailwind CSS v3 imports detected - should use single @import "tailwindcss"'
      );
    }

    console.log("✅ Global CSS validated");
  }

  /**
   * Checks CSS variables
   */
  checkCSSVariables() {
    const cssPath = path.join(__dirname, "../app/globals.css");
    const css = fs.readFileSync(cssPath, "utf8");

    const requiredVariables = [
      "--primary-600",
      "--primary-700",
      "--white",
      "--gray-50",
      "--gray-100",
      "--gray-900",
      "--success-600",
      "--warning-600",
      "--error-600",
    ];

    const missingVariables = requiredVariables.filter(
      (variable) => !css.includes(variable)
    );

    if (missingVariables.length > 0) {
      this.warnings.push(
        `Missing CSS variables: ${missingVariables.join(", ")}`
      );
    }

    console.log("✅ CSS variables validated");
  }

  /**
   * Displays validation results
   */
  displayResults() {
    console.log("\n📊 Validation Results:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("🎉 All CSS configurations are valid!");
    } else {
      if (this.errors.length > 0) {
        console.log("\n❌ Errors:");
        this.errors.forEach((error) => console.log(`   • ${error}`));
      }

      if (this.warnings.length > 0) {
        console.log("\n⚠️  Warnings:");
        this.warnings.forEach((warning) => console.log(`   • ${warning}`));
      }
    }

    console.log("\n💡 Next steps:");
    console.log('   • Run "npm run dev" to start development server');
    console.log('   • Run "npm run build" to test production build');
    console.log("   • Check browser console for any CSS-related errors");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new CSSValidator();
  validator.validate();
}

module.exports = { CSSValidator };
