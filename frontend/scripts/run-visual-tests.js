#!/usr/bin/env node

/**
 * Visual Regression Test Runner
 * Comprehensive script for running visual regression tests with different configurations
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const config = {
  baseCommand: "npx playwright test",
  configFile: "playwright-visual.config.ts",
  outputDir: "visual-test-results",
  reportDir: "playwright-report-visual",
};

// Test suites
const testSuites = {
  all: {
    description: "Run all visual regression tests",
    command: `${config.baseCommand} --config=${config.configFile}`,
  },
  desktop: {
    description: "Run desktop browser visual tests",
    command: `${config.baseCommand} --config=${config.configFile} --project=chromium-desktop --project=firefox-desktop --project=webkit-desktop`,
  },
  mobile: {
    description: "Run mobile device visual tests",
    command: `${config.baseCommand} --config=${config.configFile} --project=mobile-chrome --project=mobile-safari --project=tablet-chrome`,
  },
  crossBrowser: {
    description: "Run cross-browser color validation tests",
    command: `${config.baseCommand} --config=${config.configFile} --project=chromium-cross-browser --project=firefox-cross-browser --project=webkit-cross-browser`,
  },
  darkMode: {
    description: "Run dark mode visual tests",
    command: `${config.baseCommand} --config=${config.configFile} --project=dark-mode-desktop --project=dark-mode-mobile`,
  },
  highDpi: {
    description: "Run high DPI visual tests",
    command: `${config.baseCommand} --config=${config.configFile} --project=high-dpi`,
  },
  components: {
    description: "Run component-specific visual tests",
    command: `${config.baseCommand} --config=${config.configFile} visual-regression.spec.ts`,
  },
  accessibility: {
    description: "Run accessibility color tests",
    command: `${config.baseCommand} --config=${config.configFile} --grep="accessibility|contrast|colorblind"`,
  },
};

// Utility functions
function createOutputDirectories() {
  const dirs = [config.outputDir, config.reportDir, "test-results"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

function runCommand(command, description) {
  console.log(`\n🎯 ${description}`);
  console.log(`📋 Command: ${command}\n`);

  try {
    const startTime = Date.now();
    execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Completed in ${duration}s`);
    return true;
  } catch (error) {
    console.error(`\n❌ Failed with exit code: ${error.status}`);
    return false;
  }
}

function generateReport() {
  console.log("\n📊 Generating visual regression report...");

  const reportCommand = `${config.baseCommand} show-report ${config.reportDir}`;
  console.log(`Report available at: ${config.reportDir}/index.html`);

  // Generate summary
  const summaryPath = path.join(config.outputDir, "summary.json");
  const summary = {
    timestamp: new Date().toISOString(),
    testSuites: Object.keys(testSuites),
    reportPath: config.reportDir,
    resultsPath: config.outputDir,
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Summary written to: ${summaryPath}`);
}

function updateScreenshots() {
  console.log("\n📸 Updating reference screenshots...");
  const updateCommand = `${config.baseCommand} --config=${config.configFile} --update-snapshots`;
  return runCommand(updateCommand, "Updating all reference screenshots");
}

function cleanupOldResults() {
  console.log("\n🧹 Cleaning up old test results...");

  const dirsToClean = [config.reportDir, "test-results"];
  dirsToClean.forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`Cleaned: ${dir}`);
    }
  });
}

function showHelp() {
  console.log(`
🎨 Visual Regression Test Runner

Usage: node run-visual-tests.js [command] [options]

Commands:
`);

  Object.entries(testSuites).forEach(([key, suite]) => {
    console.log(`  ${key.padEnd(15)} ${suite.description}`);
  });

  console.log(`
Options:
  --update          Update reference screenshots
  --clean           Clean old results before running
  --report          Generate and show report after tests
  --help            Show this help message

Examples:
  node run-visual-tests.js all
  node run-visual-tests.js desktop --clean
  node run-visual-tests.js mobile --update
  node run-visual-tests.js components --report
`);
}

function parseArguments() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {
    update: args.includes("--update"),
    clean: args.includes("--clean"),
    report: args.includes("--report"),
    help: args.includes("--help") || command === "help",
  };

  return { command, options };
}

// Main execution
function main() {
  const { command, options } = parseArguments();

  if (options.help || !command) {
    showHelp();
    return;
  }

  if (!testSuites[command]) {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }

  console.log("🎨 Visual Regression Test Runner");
  console.log("================================\n");

  // Setup
  createOutputDirectories();

  if (options.clean) {
    cleanupOldResults();
  }

  // Handle update screenshots
  if (options.update) {
    const success = updateScreenshots();
    if (!success) {
      process.exit(1);
    }
    return;
  }

  // Run tests
  const suite = testSuites[command];
  const success = runCommand(suite.command, suite.description);

  if (options.report) {
    generateReport();
  }

  if (!success) {
    console.log("\n❌ Visual regression tests failed");
    process.exit(1);
  } else {
    console.log("\n✅ Visual regression tests completed successfully");
  }
}

// Error handling
process.on("uncaughtException", (error) => {
  console.error("\n💥 Uncaught Exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  testSuites,
  runCommand,
  generateReport,
  updateScreenshots,
};
