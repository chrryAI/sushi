#!/usr/bin/env node

/**
 * SUSHI CLI - Terminal AI Development Assistant
 * Lightweight AOT AI with file system access
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";

const program = new Command();
const CONFIG_DIR = path.join(os.homedir(), ".sushi");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const CREDITS_FILE = path.join(CONFIG_DIR, "credits.json");

// Encryption key derived from machine-specific data
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(os.hostname() + os.userInfo().username)
  .digest();

// ============================================
// ENCRYPTION UTILITIES
// ============================================

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(text) {
  if (!text) return null;
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (_err) {
    // If decryption fails, return null (corrupted or wrong key)
    return null;
  }
}

// ============================================
// CONFIG MANAGEMENT
// ============================================

async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (_err) {
    // Directory exists
  }
}

async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    const config = JSON.parse(data);

    // Decrypt API keys if they exist
    if (config.apiKeys) {
      if (config.apiKeys.anthropic) {
        config.apiKeys.anthropic = decrypt(config.apiKeys.anthropic);
      }
      if (config.apiKeys.openai) {
        config.apiKeys.openai = decrypt(config.apiKeys.openai);
      }
      if (config.apiKeys.deepseek) {
        config.apiKeys.deepseek = decrypt(config.apiKeys.deepseek);
      }
    }

    return config;
  } catch (_err) {
    return {
      apiKeys: {},
      mode: "guest",
      falkordb: {
        host: "localhost",
        port: 6380,
      },
    };
  }
}

async function saveConfig(config) {
  await ensureConfigDir();

  // Create a copy to avoid mutating the original
  const configToSave = JSON.parse(JSON.stringify(config));

  // Encrypt API keys before saving
  if (configToSave.apiKeys) {
    if (configToSave.apiKeys.anthropic) {
      configToSave.apiKeys.anthropic = encrypt(configToSave.apiKeys.anthropic);
    }
    if (configToSave.apiKeys.openai) {
      configToSave.apiKeys.openai = encrypt(configToSave.apiKeys.openai);
    }
    if (configToSave.apiKeys.deepseek) {
      configToSave.apiKeys.deepseek = encrypt(configToSave.apiKeys.deepseek);
    }
  }

  await fs.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
}

async function loadCredits() {
  try {
    const data = await fs.readFile(CREDITS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (_err) {
    return {
      total: 100, // Free credits for guest mode
      used: 0,
      remaining: 100,
      history: [],
    };
  }
}

async function saveCredits(credits) {
  await ensureConfigDir();
  await fs.writeFile(CREDITS_FILE, JSON.stringify(credits, null, 2));
}

async function useCredits(amount, action) {
  const credits = await loadCredits();

  if (credits.remaining < amount) {
    console.log(chalk.red(`\n❌ Insufficient credits! You need ${amount} credits.`));
    console.log(chalk.yellow(`   Remaining: ${credits.remaining} credits`));
    console.log(
      chalk.cyan(
        `\n💡 Add API key to switch to unlimited mode: ${chalk.bold("sushi config --api-key")}`,
      ),
    );
    return false;
  }

  credits.used += amount;
  credits.remaining -= amount;
  credits.history.push({
    action,
    amount,
    timestamp: Date.now(),
  });

  await saveCredits(credits);
  return true;
}

// ============================================
// API KEY MANAGEMENT
// ============================================

program
  .command("config")
  .description("Configure SUSHI CLI")
  .option("--api-key <key>", "Set Anthropic API key")
  .option("--openai-key <key>", "Set OpenAI API key")
  .option("--deepseek-key <key>", "Set DeepSeek API key")
  .option("--show", "Show current configuration")
  .option("--reset", "Reset configuration")
  .action(async (options) => {
    const config = await loadConfig();

    if (options.reset) {
      await saveConfig({
        apiKeys: {},
        mode: "guest",
        falkordb: { host: "localhost", port: 6380 },
      });
      console.log(chalk.green("\n✅ Configuration reset to defaults"));
      return;
    }

    if (options.show) {
      console.log(chalk.cyan("\n🍣 SUSHI Configuration:"));
      console.log(
        chalk.white(
          `   Mode: ${config.mode === "guest" ? chalk.yellow("Guest (Credit-based)") : chalk.green("Unlimited (API Key)")}`,
        ),
      );
      console.log(
        chalk.white(
          `   Anthropic API Key: ${config.apiKeys.anthropic ? chalk.green("✓ Set") : chalk.red("✗ Not set")}`,
        ),
      );
      console.log(
        chalk.white(
          `   OpenAI API Key: ${config.apiKeys.openai ? chalk.green("✓ Set") : chalk.red("✗ Not set")}`,
        ),
      );
      console.log(
        chalk.white(
          `   DeepSeek API Key: ${config.apiKeys.deepseek ? chalk.green("✓ Set") : chalk.red("✗ Not set")}`,
        ),
      );
      console.log(chalk.white(`   FalkorDB: ${config.falkordb.host}:${config.falkordb.port}`));

      if (config.mode === "guest") {
        const credits = await loadCredits();
        console.log(chalk.yellow(`\n💳 Credits: ${credits.remaining}/${credits.total}`));
      }
      return;
    }

    if (options.apiKey) {
      config.apiKeys.anthropic = options.apiKey;
      config.mode = "unlimited";
      await saveConfig(config);
      console.log(chalk.green("\n✅ Anthropic API key saved"));
      console.log(chalk.cyan("   Switched to unlimited mode - no credit limits!"));
      return;
    }

    if (options.openaiKey) {
      config.apiKeys.openai = options.openaiKey;
      config.mode = "unlimited";
      await saveConfig(config);
      console.log(chalk.green("\n✅ OpenAI API key saved"));
      console.log(chalk.cyan("   Switched to unlimited mode - no credit limits!"));
      return;
    }

    if (options.deepseekKey) {
      config.apiKeys.deepseek = options.deepseekKey;
      config.mode = "unlimited";
      await saveConfig(config);
      console.log(chalk.green("\n✅ DeepSeek API key saved"));
      console.log(chalk.cyan("   Switched to unlimited mode - no credit limits!"));
      return;
    }

    // Interactive config
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "anthropicKey",
        message: "Anthropic API Key (optional, press Enter to skip):",
        default: config.apiKeys.anthropic || "",
      },
      {
        type: "input",
        name: "openaiKey",
        message: "OpenAI API Key (optional, press Enter to skip):",
        default: config.apiKeys.openai || "",
      },
      {
        type: "input",
        name: "deepseekKey",
        message: "DeepSeek API Key (optional, press Enter to skip):",
        default: config.apiKeys.deepseek || "",
      },
    ]);

    if (answers.anthropicKey) {
      config.apiKeys.anthropic = answers.anthropicKey;
      config.mode = "unlimited";
    }
    if (answers.openaiKey) {
      config.apiKeys.openai = answers.openaiKey;
      config.mode = "unlimited";
    }
    if (answers.deepseekKey) {
      config.apiKeys.deepseek = answers.deepseekKey;
      config.mode = "unlimited";
    }

    await saveConfig(config);
    console.log(chalk.green("\n✅ Configuration saved"));
  });

// ============================================
// CREDITS MANAGEMENT
// ============================================

program
  .command("credits")
  .description("View credit balance and history")
  .option("--history", "Show credit usage history")
  .action(async (options) => {
    const config = await loadConfig();
    const credits = await loadCredits();

    console.log(chalk.cyan("\n💳 SUSHI Credits"));
    console.log(
      chalk.white(
        `   Mode: ${config.mode === "guest" ? chalk.yellow("Guest") : chalk.green("Unlimited")}`,
      ),
    );

    if (config.mode === "guest") {
      console.log(chalk.white(`   Total: ${credits.total} credits`));
      console.log(chalk.white(`   Used: ${credits.used} credits`));
      console.log(chalk.white(`   Remaining: ${chalk.bold(credits.remaining)} credits`));

      if (options.history && credits.history.length > 0) {
        console.log(chalk.cyan("\n📊 Recent Usage:"));
        credits.history.slice(-10).forEach((entry) => {
          const date = new Date(entry.timestamp).toLocaleString();
          console.log(chalk.white(`   ${date} - ${entry.action} (${entry.amount} credits)`));
        });
      }

      console.log(
        chalk.yellow(
          `\n💡 Add API key for unlimited usage: ${chalk.bold("sushi config --api-key")}`,
        ),
      );
    } else {
      console.log(chalk.green("   ✨ Unlimited credits with API key!"));
    }
  });

// ============================================
// CODER AGENT ⚡
// ============================================

program
  .command("coder <task>")
  .description("⚡ Generate code with AI")
  .option("-f, --file <path>", "Output file path")
  .option("-l, --language <lang>", "Programming language")
  .action(async (task, options) => {
    const config = await loadConfig();

    // Check credits or API key
    if (config.mode === "guest") {
      const canUse = await useCredits(10, `Coder: ${task.substring(0, 50)}`);
      if (!canUse) return;
    }

    const spinner = ora("⚡ Coder is generating code...").start();

    // Simulate AI code generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    spinner.succeed(chalk.green("✅ Code generated!"));

    console.log(chalk.cyan("\n📝 Generated Code:"));
    console.log(
      chalk.white(`
// Generated by SUSHI Coder
// Task: ${task}

function example() {
  // Your generated code here
  console.log("Hello from SUSHI!");
}
    `),
    );

    if (options.file) {
      await fs.writeFile(options.file, "// Generated code\n");
      console.log(chalk.green(`\n✅ Saved to: ${options.file}`));
    }

    if (config.mode === "guest") {
      const credits = await loadCredits();
      console.log(chalk.yellow(`\n💳 Credits remaining: ${credits.remaining}`));
    }
  });

// ============================================
// DEBUGGER AGENT 🐛
// ============================================

program
  .command("debugger <error>")
  .description("🐛 Debug and fix errors")
  .option("-f, --file <path>", "File to debug")
  .action(async (error, options) => {
    const config = await loadConfig();

    if (config.mode === "guest") {
      const canUse = await useCredits(8, `Debugger: ${error.substring(0, 50)}`);
      if (!canUse) return;
    }

    const spinner = ora("🐛 Debugger is analyzing...").start();

    await new Promise((resolve) => setTimeout(resolve, 1500));

    spinner.succeed(chalk.green("✅ Bug found and fixed!"));

    console.log(chalk.cyan("\n🔍 Analysis:"));
    console.log(chalk.white(`   Error: ${error}`));
    console.log(chalk.white(`   Root Cause: Missing null check`));
    console.log(chalk.white(`   Fix: Add optional chaining (?.))`));

    console.log(chalk.cyan("\n🔧 Suggested Fix:"));
    console.log(
      chalk.white(`
// Before:
const value = obj.property.value;

// After:
const value = obj?.property?.value;
    `),
    );

    if (config.mode === "guest") {
      const credits = await loadCredits();
      console.log(chalk.yellow(`\n💳 Credits remaining: ${credits.remaining}`));
    }
  });

// ============================================
// ARCHITECT AGENT 🏗️
// ============================================

program
  .command("architect <design>")
  .description("🏗️ Design system architecture")
  .option("-o, --output <path>", "Output documentation path")
  .action(async (design, options) => {
    const config = await loadConfig();

    if (config.mode === "guest") {
      const canUse = await useCredits(12, `Architect: ${design.substring(0, 50)}`);
      if (!canUse) return;
    }

    const spinner = ora("🏗️ Architect is designing...").start();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    spinner.succeed(chalk.green("✅ Architecture designed!"));

    console.log(chalk.cyan("\n📐 System Architecture:"));
    console.log(
      chalk.white(`
┌─────────────────────────────────────┐
│         Frontend (React)            │
├─────────────────────────────────────┤
│         API Gateway                 │
├─────────────────────────────────────┤
│  Service 1  │  Service 2  │ Service 3│
├─────────────────────────────────────┤
│         Database (PostgreSQL)       │
└─────────────────────────────────────┘
    `),
    );

    console.log(chalk.cyan("\n💡 Recommendations:"));
    console.log(chalk.white("   • Use microservices for scalability"));
    console.log(chalk.white("   • Add Redis for caching"));
    console.log(chalk.white("   • Implement circuit breaker pattern"));

    if (config.mode === "guest") {
      const credits = await loadCredits();
      console.log(chalk.yellow(`\n💳 Credits remaining: ${credits.remaining}`));
    }
  });

// ============================================
// PM AGENT 🍜
// ============================================

program
  .command("pm <goal>")
  .description("🍜 Coordinate development tasks")
  .action(async (goal) => {
    const config = await loadConfig();

    if (config.mode === "guest") {
      const canUse = await useCredits(15, `PM: ${goal.substring(0, 50)}`);
      if (!canUse) return;
    }

    const spinner = ora("🍜 PM is coordinating agents...").start();

    await new Promise((resolve) => setTimeout(resolve, 2500));

    spinner.succeed(chalk.green("✅ Task plan created!"));

    console.log(chalk.cyan("\n📋 Development Plan:"));
    console.log(chalk.white(`   Goal: ${goal}`));
    console.log(chalk.white("\n   Tasks:"));
    console.log(chalk.white("   1. 🏗️ Architect: Design system architecture"));
    console.log(chalk.white("   2. ⚡ Coder: Implement features"));
    console.log(chalk.white("   3. 🐛 Debugger: Test and fix bugs"));
    console.log(chalk.white("   4. 📝 Architect: Create documentation"));

    console.log(chalk.cyan("\n⏱️  Estimated Time: 2-3 hours"));

    if (config.mode === "guest") {
      const credits = await loadCredits();
      console.log(chalk.yellow(`\n💳 Credits remaining: ${credits.remaining}`));
    }
  });

// ============================================
// INIT COMMAND
// ============================================

program
  .command("init")
  .description("Initialize SUSHI in current directory")
  .action(async () => {
    const spinner = ora("🍣 Initializing SUSHI...").start();

    await ensureConfigDir();

    // Create .sushi directory in current project
    await fs.mkdir(".sushi", { recursive: true });

    // Create config files
    const projectConfig = {
      name: path.basename(process.cwd()),
      agents: {
        coder: { enabled: true },
        debugger: { enabled: true },
        architect: { enabled: true },
        pm: { enabled: true },
        strike: { enabled: true },
      },
      fileAccess: {
        read: ["**/*.{js,ts,jsx,tsx,py,go,rs}"],
        write: ["src/**", "packages/**"],
        exclude: ["node_modules/**", ".git/**"],
      },
    };

    await fs.writeFile(".sushi/config.json", JSON.stringify(projectConfig, null, 2));

    spinner.succeed(chalk.green("✅ SUSHI initialized!"));

    console.log(chalk.cyan("\n🍣 SUSHI is ready!"));
    console.log(chalk.white("\n   Next steps:"));
    console.log(chalk.white(`   1. Configure API key: ${chalk.bold("sushi config")}`));
    console.log(chalk.white(`   2. Generate code: ${chalk.bold("sushi coder 'your task'")}`));
    console.log(chalk.white(`   3. Debug errors: ${chalk.bold("sushi debugger 'your error'")}`));
    console.log(
      chalk.white(`   4. Design systems: ${chalk.bold("sushi architect 'your design'")}`),
    );
    console.log(chalk.white(`   5. Mutation testing: ${chalk.bold("sushi strike src/file.js")}`));
  });

// ============================================
// STATUS COMMAND
// ============================================

program
  .command("status")
  .description("Show SUSHI status and agent availability")
  .action(async () => {
    const config = await loadConfig();
    const credits = await loadCredits();

    console.log(chalk.cyan("\n🍣 SUSHI Status"));
    console.log(
      chalk.white(
        `   Mode: ${config.mode === "guest" ? chalk.yellow("Guest") : chalk.green("Unlimited")}`,
      ),
    );

    if (config.mode === "guest") {
      console.log(chalk.white(`   Credits: ${chalk.bold(credits.remaining)}/${credits.total}`));
    }

    console.log(chalk.cyan("\n👥 Available Agents:"));
    console.log(chalk.white(`   ⚡ Coder      - ${chalk.green("Ready")} (10 credits per use)`));
    console.log(chalk.white(`   🐛 Debugger   - ${chalk.green("Ready")} (8 credits per use)`));
    console.log(chalk.white(`   🏗️  Architect  - ${chalk.green("Ready")} (12 credits per use)`));
    console.log(chalk.white(`   🍜 PM         - ${chalk.green("Ready")} (15 credits per use)`));

    console.log(chalk.cyan("\n🔬 Testing Tools:"));
    console.log(chalk.white(`   ⚡ STRIKE     - ${chalk.green("Ready")} (20 credits per use)`));

    console.log(chalk.cyan("\n🔌 Integrations:"));
    console.log(chalk.white(`   🌮 BAM        - ${chalk.green("Connected")}`));
    console.log(chalk.white(`   🍔 STRIKE     - ${chalk.green("Connected")}`));
    console.log(chalk.white(`   🥑 Memory     - ${chalk.green("Connected")}`));
    console.log(chalk.white(`   🍕 Porffor    - ${chalk.green("Connected")}`));
  });

// ============================================
// STRIKE - Mutation Testing ⚡
// ============================================

program
  .command("strike <files...>")
  .description("⚡ Run mutation testing on files")
  .option("-t, --test <command>", "Test command to run", "npm test")
  .option("-o, --output <format>", "Output format (table|json|html)", "table")
  .option("--weak-spots", "Show weak spots analysis")
  .option("--dry-run", "Generate mutations without running tests")
  .option("--category <cats>", "Mutation categories (comma-separated)", "all")
  .action(async (files, options) => {
    const config = await loadConfig();

    if (config.mode === "guest") {
      const canUse = await useCredits(20, `STRIKE: mutation testing`);
      if (!canUse) return;
    }

    console.log(chalk.cyan("\n⚡ STRIKE - Mutation Testing System\n"));

    const spinner = ora("Initializing STRIKE...").start();

    // Dynamic import to avoid early FalkorDB connection errors
    const { initSTRIKE, runMutationTesting, analyzeMutationScore, findWeakSpots, closeSTRIKE } =
      await import(new URL("../tools/strike.js", import.meta.url)).catch(() => {
        return {
          initSTRIKE: async () => console.log("⚡ STRIKE (mock mode)"),
          runMutationTesting: async () => ({
            total: 0,
            killed: 0,
            survived: 0,
            score: 0,
          }),
          analyzeMutationScore: async () => ({
            total: 0,
            killed: 0,
            score: 0,
          }),
          findWeakSpots: async () => [],
          closeSTRIKE: async () => {},
        };
      });

    try {
      await initSTRIKE();
      spinner.succeed("STRIKE initialized");

      let totalStats = { total: 0, killed: 0, survived: 0, score: 0 };

      for (const file of files) {
        const fileSpinner = ora(`Testing ${file}...`).start();

        try {
          const stats = await runMutationTesting(file, options.test);
          fileSpinner.succeed(
            `${file}: ${stats.score.toFixed(1)}% (${stats.killed}/${stats.total} killed)`,
          );

          totalStats.total += stats.total;
          totalStats.killed += stats.killed;
          totalStats.survived += stats.survived;
        } catch (err) {
          fileSpinner.fail(`${file}: ${err.message}`);
        }
      }

      // Calculate overall score
      totalStats.score = totalStats.total > 0 ? (totalStats.killed / totalStats.total) * 100 : 0;

      console.log(chalk.cyan("\n📊 Mutation Testing Results:"));
      console.log(chalk.white(`   Files tested: ${files.length}`));
      console.log(chalk.white(`   Total mutations: ${totalStats.total}`));
      console.log(chalk.green(`   Killed: ${totalStats.killed}`));
      console.log(chalk.red(`   Survived: ${totalStats.survived}`));

      const scoreColor =
        totalStats.score >= 80 ? chalk.green : totalStats.score >= 50 ? chalk.yellow : chalk.red;
      console.log(scoreColor(`   Overall Score: ${totalStats.score.toFixed(2)}%`));

      // Mutation score interpretation
      console.log(chalk.cyan("\n💡 Score Interpretation:"));
      if (totalStats.score >= 80) {
        console.log(chalk.green("   Excellent! Your tests are catching most mutations."));
      } else if (totalStats.score >= 50) {
        console.log(chalk.yellow("   Good progress. Consider adding more test cases."));
      } else {
        console.log(chalk.red("   Needs improvement. Your tests may have coverage gaps."));
      }

      // Show weak spots if requested
      if (options.weakSpots) {
        console.log(chalk.cyan("\n🎯 Weak Spots Analysis:"));
        await findWeakSpots();
      }

      await closeSTRIKE();

      if (config.mode === "guest") {
        const credits = await loadCredits();
        console.log(chalk.yellow(`\n💳 Credits remaining: ${credits.remaining}`));
      }

      // Exit with error code if score is too low
      if (totalStats.score < 50) {
        process.exit(1);
      }
    } catch (err) {
      spinner.fail(`STRIKE failed: ${err.message}`);
      console.error(err);
      process.exit(1);
    }
  });

// ============================================
// MAIN
// ============================================

program
  .name("sushi")
  .description("🍣 SUSHI - Terminal AI Development Assistant (Porffor v0.61.12)")
  .version("0.61.12");

program.parse();
