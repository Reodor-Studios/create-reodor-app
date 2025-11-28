#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawn } from "child_process";
import { randomBytes } from "crypto";

// Constants
const PROJECT_ROOT = process.cwd();
const PATHS = {
  envLocal: path.join(PROJECT_ROOT, ".env.local"),
  envExample: path.join(PROJECT_ROOT, ".env.example"),
  scaffoldState: path.join(PROJECT_ROOT, ".scaffold-state.json"),
};

// Mapping from supabase status output to our env var names
const SUPABASE_ENV_MAPPING: Record<string, string> = {
  API_URL: "NEXT_PUBLIC_SUPABASE_URL",
  ANON_KEY: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
  SERVICE_ROLE_KEY: "SUPABASE_SECRET_KEY",
  DB_URL: "DATABASE_URL",
};

// Env vars that can be auto-generated
const AUTO_GENERATED_VARS = ["CRON_SECRET", "JWT_SECRET"];

// Env vars that must be manually configured (from Bitwarden, etc.)
const MANUAL_VARS = [
  "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID",
  "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET",
  "DEV_EMAIL_FROM",
  "DEV_EMAIL_TO",
  "PROD_EMAIL_FROM",
  "RESEND_API_KEY",
  "ANTHROPIC_API_KEY",
  "PERPLEXITY_API_KEY",
];

// Color codes for terminal output
const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

// Generate a secure random string (base64)
function generateSecret(): string {
  return randomBytes(32).toString("base64");
}

// Parse env file content into key-value pairs
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

// Check if a value is a placeholder (not set)
function isPlaceholder(value: string): boolean {
  const placeholders = [
    "your-",
    "your_",
    "placeholder",
    "changeme",
    "xxx",
    "TODO",
  ];
  const lowerValue = value.toLowerCase();
  return placeholders.some((p) => lowerValue.includes(p)) || value === "";
}

// Get supabase status env vars
async function getSupabaseEnvVars(): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    const child = spawn("supabase", ["status", "-o", "env"], { stdio: "pipe" });

    let output = "";
    let errorOutput = "";

    child.stdout?.on("data", (data) => {
      output += data.toString();
    });

    child.stderr?.on("data", (data) => {
      errorOutput += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0 || !output.trim()) {
        resolve(null);
        return;
      }

      const envVars: Record<string, string> = {};
      const lines = output.split("\n");

      for (const line of lines) {
        // Match KEY="value" or KEY=value patterns
        const match = line.match(/^([A-Z_]+)=["']?(.+?)["']?$/);
        if (match) {
          envVars[match[1]] = match[2];
        }
      }

      resolve(envVars);
    });

    child.on("error", () => {
      resolve(null);
    });
  });
}

// Check if Supabase is running
async function isSupabaseRunning(): Promise<boolean> {
  const envVars = await getSupabaseEnvVars();
  return envVars !== null && Object.keys(envVars).length > 0;
}

// Setup environment variables
async function setupEnvironmentVariables(): Promise<{
  configured: string[];
  generated: string[];
  needsManual: string[];
  skipped: string[];
}> {
  const result = {
    configured: [] as string[],
    generated: [] as string[],
    needsManual: [] as string[],
    skipped: [] as string[],
  };

  // Read existing .env.local if it exists
  let existingEnv: Record<string, string> = {};
  if (existsSync(PATHS.envLocal)) {
    existingEnv = parseEnvFile(readFileSync(PATHS.envLocal, "utf-8"));
  }

  // Read .env.example to get all expected keys and their comments
  const exampleContent = existsSync(PATHS.envExample)
    ? readFileSync(PATHS.envExample, "utf-8")
    : "";

  // Get supabase env vars
  const supabaseEnv = await getSupabaseEnvVars();

  // Build new env content
  const newEnv: Record<string, string> = { ...existingEnv };

  // 1. Map supabase env vars
  if (supabaseEnv) {
    for (const [supabaseKey, ourKey] of Object.entries(SUPABASE_ENV_MAPPING)) {
      const value = supabaseEnv[supabaseKey];
      if (value) {
        // Only set if not already configured with a real value
        if (!existingEnv[ourKey] || isPlaceholder(existingEnv[ourKey])) {
          newEnv[ourKey] = value;
          result.configured.push(ourKey);
        } else {
          result.skipped.push(ourKey);
        }
      }
    }
  }

  // 2. Auto-generate secrets if not set
  for (const key of AUTO_GENERATED_VARS) {
    if (!existingEnv[key] || isPlaceholder(existingEnv[key])) {
      newEnv[key] = generateSecret();
      result.generated.push(key);
    } else {
      result.skipped.push(key);
    }
  }

  // 3. Check which manual vars are still needed
  for (const key of MANUAL_VARS) {
    if (!newEnv[key] || isPlaceholder(newEnv[key])) {
      result.needsManual.push(key);
    }
  }

  // Write the new .env.local file preserving comments from .env.example
  const outputLines: string[] = [];
  const processedKeys = new Set<string>();

  // Process .env.example line by line to preserve structure and comments
  const exampleLines = exampleContent.split("\n");
  for (const line of exampleLines) {
    const trimmed = line.trim();

    // Keep comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) {
      outputLines.push(line);
      continue;
    }

    // Extract key from the line
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      outputLines.push(line);
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    processedKeys.add(key);

    // Use our new value or keep the placeholder
    const value = newEnv[key];
    if (value !== undefined) {
      // Quote values that contain spaces, special characters, or are auto-generated secrets
      const needsQuotes =
        value.includes(" ") ||
        value.includes("#") ||
        AUTO_GENERATED_VARS.includes(key);
      outputLines.push(`${key}=${needsQuotes ? `'${value}'` : value}`);
    } else {
      outputLines.push(line);
    }
  }

  // Add any keys from newEnv that weren't in .env.example
  for (const [key, value] of Object.entries(newEnv)) {
    if (!processedKeys.has(key)) {
      const needsQuotes =
        value.includes(" ") ||
        value.includes("#") ||
        AUTO_GENERATED_VARS.includes(key);
      outputLines.push(`${key}=${needsQuotes ? `'${value}'` : value}`);
    }
  }

  writeFileSync(PATHS.envLocal, outputLines.join("\n"));

  return result;
}

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = process.platform === "win32"
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port}`;

    const shell = process.platform === "win32" ? "cmd" : "sh";
    const shellArg = process.platform === "win32" ? "/c" : "-c";

    const child = spawn(shell, [shellArg, cmd], { stdio: "pipe" });

    let output = "";
    child.stdout?.on("data", (data) => {
      output += data.toString();
    });

    child.on("close", (code) => {
      // If output contains results, port is in use
      resolve(output.trim().length > 0);
    });

    child.on("error", () => {
      // If command fails, assume port is not in use
      resolve(false);
    });
  });
}

async function isDockerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("docker", ["info"], { stdio: "pipe" });

    child.on("close", (code) => {
      resolve(code === 0);
    });

    child.on("error", () => {
      resolve(false);
    });
  });
}

async function getNodeVersion(): Promise<{ version: string; major: number; isValid: boolean }> {
  return new Promise((resolve) => {
    const child = spawn("node", ["--version"], { stdio: "pipe" });

    let output = "";
    child.stdout?.on("data", (data) => {
      output += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0 && output.trim()) {
        const version = output.trim().replace("v", "");
        const major = parseInt(version.split(".")[0], 10);
        resolve({ version, major, isValid: major >= 20 });
      } else {
        resolve({ version: "unknown", major: 0, isValid: false });
      }
    });

    child.on("error", () => {
      resolve({ version: "unknown", major: 0, isValid: false });
    });
  });
}

async function checkOnboardingStatus() {
  const hasEnvFile = existsSync(PATHS.envLocal);
  const hasScaffoldState = existsSync(PATHS.scaffoldState);
  const isPort3000InUse = await isPortInUse(3000);
  const dockerRunning = await isDockerRunning();
  const nodeVersion = await getNodeVersion();
  const supabaseRunning = await isSupabaseRunning();

  return {
    hasEnvFile,
    hasScaffoldState,
    isPort3000InUse,
    dockerRunning,
    nodeVersion,
    supabaseRunning,
    isFullyOnboarded: hasEnvFile && hasScaffoldState,
  };
}

async function main() {
  const status = await checkOnboardingStatus();

  // Early exit if fully onboarded
  if (status.isFullyOnboarded) {
    console.log(`\n${c.green}Project is already set up!${c.reset}`);
    if (status.isPort3000InUse) {
      console.log(
        `${c.green}Dev server is running${c.reset} ${c.dim}at http://localhost:3000${c.reset}\n`,
      );
    } else {
      console.log(
        `${c.dim}Run ${c.cyan}bun dev${c.dim} to start the development server.${c.reset}\n`,
      );
    }
    return;
  }

  // Header
  console.log("\n" + "=".repeat(70));
  console.log(`${c.cyan}${c.bright}Welcome to create-reodor-app!${c.reset}`);
  console.log("=".repeat(70) + "\n");

  // Environment check
  const nodeColor = status.nodeVersion.isValid ? c.green : c.yellow;
  console.log(`${c.bright}Environment Check:${c.reset}`);
  console.log(`   ${nodeColor}Node.js:${c.reset} v${status.nodeVersion.version}`);
  if (!status.nodeVersion.isValid) {
    console.log(`   ${c.yellow}⚠️  Node.js 20+ required (Supabase requirement)${c.reset}`);
    console.log(`   ${c.dim}Install from: https://nodejs.org/${c.reset}`);
  }
  console.log();

  console.log(`${c.bright}Get started with these steps:${c.reset}\n`);

  // Step 1: bun install (already done)
  console.log(
    `${c.green}Step 1:${c.reset} ${c.bright}Install dependencies${c.reset}`,
  );
  console.log(`   ${c.dim}Dependencies installed successfully!${c.reset}\n`);

  // Step 2: Start Supabase
  const supabaseColor = status.supabaseRunning ? c.green : c.yellow;
  console.log(
    `${supabaseColor}Step 2:${c.reset} ${c.bright}Start local Supabase database${c.reset}`,
  );
  if (!status.dockerRunning) {
    console.log(`   ${c.cyan}bun db:start${c.reset}`);
    console.log(
      `   ${c.dim}Requires Docker running. Database at http://127.0.0.1:54321${c.reset}\n`,
    );
  } else if (!status.supabaseRunning) {
    console.log(`   ${c.cyan}bun db:start${c.reset}`);
    console.log(
      `   ${c.dim}Docker is running. Run command to start Supabase${c.reset}\n`,
    );
  } else {
    console.log(
      `   ${c.green}Supabase is running${c.reset} ${c.dim}at http://127.0.0.1:54321${c.reset}\n`,
    );
  }

  // Step 3: Setup environment variables (auto-configured when Supabase is running)
  console.log(
    `${c.bright}Step 3:${c.reset} ${c.bright}Setup environment variables${c.reset}`,
  );

  if (status.supabaseRunning) {
    // Auto-setup environment variables
    console.log(`   ${c.dim}Auto-configuring from Supabase...${c.reset}`);
    const envResult = await setupEnvironmentVariables();

    if (envResult.configured.length > 0) {
      console.log(
        `   ${c.green}Configured from Supabase:${c.reset} ${envResult.configured.join(", ")}`,
      );
    }
    if (envResult.generated.length > 0) {
      console.log(
        `   ${c.green}Auto-generated:${c.reset} ${envResult.generated.join(", ")}`,
      );
    }
    if (envResult.skipped.length > 0) {
      console.log(
        `   ${c.dim}Already set:${c.reset} ${envResult.skipped.join(", ")}`,
      );
    }

    // Filter out optional vars for the "needs manual" display
    const requiredManual = envResult.needsManual.filter(
      (v) =>
        ![
          "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID",
          "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET",
          "ANTHROPIC_API_KEY",
          "PERPLEXITY_API_KEY",
        ].includes(v),
    );
    const optionalManual = envResult.needsManual.filter((v) =>
      [
        "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID",
        "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET",
        "ANTHROPIC_API_KEY",
        "PERPLEXITY_API_KEY",
      ].includes(v),
    );

    if (requiredManual.length > 0) {
      console.log(
        `   ${c.yellow}Still needs manual setup:${c.reset} ${requiredManual.join(", ")}`,
      );
      console.log(
        `   ${c.dim}Get these from Bitwarden or your credentials manager${c.reset}`,
      );
    }
    if (optionalManual.length > 0) {
      console.log(
        `   ${c.dim}Optional (not required):${c.reset} ${optionalManual.join(", ")}`,
      );
    }
    console.log();
  } else {
    console.log(
      `   ${c.yellow}Start Supabase first${c.reset} ${c.dim}to auto-configure database env vars${c.reset}`,
    );
    console.log(
      `   ${c.dim}Run ${c.cyan}bun db:start${c.dim} then re-run ${c.cyan}bun onboarding${c.reset}\n`,
    );
  }

  // Step 4: Start development server
  const devServerColor = status.isPort3000InUse ? c.green : c.yellow;
  console.log(
    `${devServerColor}Step 4:${c.reset} ${c.bright}Start development server${c.reset}`,
  );
  if (status.isPort3000InUse) {
    console.log(
      `   ${c.green}Server is running at http://localhost:3000${c.reset}\n`,
    );
  } else {
    console.log(`   ${c.cyan}bun dev${c.reset}`);
    console.log(
      `   ${c.dim}Next.js will run at http://localhost:3000${c.reset}\n`,
    );
  }

  // Step 5: Read onboarding steps
  console.log(
    `${c.yellow}Step 5:${c.reset} ${c.bright}Review onboarding steps on landing page${c.reset}`,
  );
  console.log(
    `   ${c.dim}Interactive checklist with setup guides and tech stack info${c.reset}\n`,
  );

  // Step 6: Run scaffold script
  const scaffoldColor = status.hasScaffoldState ? c.green : c.yellow;
  console.log(
    `${scaffoldColor}Step 6:${c.reset} ${c.bright}Scaffold your application${c.reset}`,
  );
  if (!status.hasScaffoldState) {
    console.log(`   ${c.cyan}bun run scaffold${c.reset}`);
    console.log(
      `   ${c.dim}AI-powered scaffolding: business context, branding, and docs${c.reset}\n`,
    );
  } else {
    console.log(
      `   ${c.dim}Scaffolding complete! Check SCAFFOLD.md for next steps${c.reset}\n`,
    );
  }

  // Step 7: Start developing
  console.log(
    `${c.yellow}Step 7:${c.reset} ${c.bright}Start building your product!${c.reset}`,
  );
  console.log(
    `   ${c.dim}Follow BUSINESS_CONTEXT.md and refer to CLAUDE.md and .claude/skills/ for patterns${c.reset}\n`,
  );

  // Next action recommendation
  console.log("=".repeat(70));
  console.log(`${c.bright}${c.magenta}Next step:${c.reset}`);
  if (!status.dockerRunning) {
    console.log(
      `${c.dim}Start Docker, then run ${c.cyan}bun db:start${c.reset}`,
    );
  } else if (!status.supabaseRunning) {
    console.log(
      `${c.cyan}bun db:start${c.reset} ${c.dim}→${c.reset} ${c.cyan}bun onboarding${c.reset} ${c.dim}(to auto-configure .env.local)${c.reset}`,
    );
  } else if (!status.isPort3000InUse) {
    console.log(
      `${c.cyan}bun dev${c.reset} ${c.dim}→${c.reset} ${c.cyan}bun run scaffold${c.reset}`,
    );
  } else if (!status.hasScaffoldState) {
    console.log(`${c.cyan}bun run scaffold${c.reset}`);
  } else {
    console.log(
      `${c.green}All set!${c.reset} ${c.dim}Visit http://localhost:3000 or continue development${c.reset}`,
    );
  }
  console.log("=".repeat(70) + "\n");

  // Additional resources
  console.log(`${c.bright}Documentation:${c.reset}`);
  console.log(
    `   • ${c.cyan}CLAUDE.md${c.reset} ${c.dim}- Code conventions and patterns${c.reset}`,
  );
  console.log(
    `   • ${c.cyan}docs/getting-started.md${c.reset} ${c.dim}- Detailed setup guide${c.reset}`,
  );
  console.log(
    `   • ${c.cyan}.env.example${c.reset} ${c.dim}- Environment variable reference${c.reset}`,
  );
  console.log(
    `\n${c.dim}Need help? Check the docs/ folder or review CLAUDE.md${c.reset}\n`,
  );
}

main();
