#!/usr/bin/env node

/**
 * Backend connectivity checker
 * Helps users diagnose and fix backend connection issues
 */

const http = require("http");
const https = require("https");

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function checkBackend() {
  console.log("🔍 Checking backend connectivity...\n");

  try {
    const url = new URL(API_BASE_URL);
    const protocol = url.protocol === "https:" ? https : http;

    const response = await new Promise((resolve, reject) => {
      const req = protocol.get(`${API_BASE_URL}/health`, (res) => {
        resolve(res);
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
    });

    if (response.statusCode === 200) {
      console.log("✅ Backend is running and accessible!");
      console.log(`   URL: ${API_BASE_URL}`);
      console.log(
        `   Status: ${response.statusCode} ${response.statusMessage}`
      );
    } else {
      console.log("⚠️  Backend responded but with an error:");
      console.log(
        `   Status: ${response.statusCode} ${response.statusMessage}`
      );
    }
  } catch (error) {
    console.log("❌ Backend is not accessible");
    console.log(`   URL: ${API_BASE_URL}`);
    console.log(`   Error: ${error.message}\n`);

    console.log("🔧 Troubleshooting steps:");
    console.log("   1. Start the backend server:");
    console.log("      cd backend");
    console.log(
      "      python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000\n"
    );

    console.log("   2. Check if the port is already in use:");
    console.log("      netstat -an | findstr :8000  (Windows)");
    console.log("      lsof -i :8000  (Mac/Linux)\n");

    console.log("   3. Verify the API URL in your environment:");
    console.log(`      Current: ${API_BASE_URL}`);
    console.log("      Set NEXT_PUBLIC_API_URL if different\n");

    console.log("   4. Check firewall and network settings");
    console.log("   5. Ensure Python dependencies are installed:");
    console.log("      pip install -r requirements.txt");
  }
}

if (require.main === module) {
  checkBackend();
}

module.exports = { checkBackend };
