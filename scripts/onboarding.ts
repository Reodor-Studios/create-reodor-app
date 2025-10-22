#!/usr/bin/env bun

import { existsSync } from "fs";
import path from "path";
import { spawn } from "child_process";

// Constants
const PROJECT_ROOT = process.cwd();
const PATHS = {
  envLocal: path.join(PROJECT_ROOT, ".env.local"),
  scaffoldState: path.join(PROJECT_ROOT, ".scaffold-state.json"),
};

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
};

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

async function checkOnboardingStatus() {
  const hasEnvFile = existsSync(PATHS.envLocal);
  const hasScaffoldState = existsSync(PATHS.scaffoldState);
  const isPort3000InUse = await isPortInUse(3000);
  const dockerRunning = await isDockerRunning();

  return {
    hasEnvFile,
    hasScaffoldState,
    isPort3000InUse,
    dockerRunning,
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

  console.log(`${c.bright}Get started with these steps:${c.reset}\n`);

  // Step 1: bun install (already done)
  console.log(
    `${c.green}Step 1:${c.reset} ${c.bright}Install dependencies${c.reset}`,
  );
  console.log(`   ${c.dim}Dependencies installed successfully!${c.reset}\n`);

  // Step 2: Start Supabase
  const supabaseColor = status.dockerRunning ? c.green : c.yellow;
  console.log(
    `${supabaseColor}Step 2:${c.reset} ${c.bright}Start local Supabase database${c.reset}`,
  );
  if (!status.dockerRunning) {
    console.log(`   ${c.cyan}bun db:start${c.reset}`);
    console.log(
      `   ${c.dim}Requires Docker running. Database at http://127.0.0.1:54321${c.reset}\n`,
    );
  } else {
    console.log(`   ${c.cyan}bun db:start${c.reset}`);
    console.log(
      `   ${c.dim}Docker is running. Run command to start Supabase${c.reset}\n`,
    );
  }

  // Step 3: Setup environment variables
  const envColor = status.hasEnvFile ? c.green : c.yellow;
  console.log(
    `${envColor}Step 3:${c.reset} ${c.bright}Setup environment variables${c.reset}`,
  );
  if (!status.hasEnvFile) {
    console.log(`   ${c.cyan}cp .env.example .env.local${c.reset}`);
    console.log(
      `   ${c.dim}Then edit .env.local with your actual values${c.reset}\n`,
    );
  } else {
    console.log(
      `   ${c.dim}.env.local exists - verify all values are set${c.reset}\n`,
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
  if (!status.hasEnvFile) {
    console.log(
      `${c.cyan}cp .env.example .env.local${c.reset} ${c.dim}→${c.reset} ${c.cyan}bun db:start${c.reset}`,
    );
  } else if (!status.dockerRunning) {
    console.log(
      `${c.cyan}bun db:start${c.reset} ${c.dim}(requires Docker running)${c.reset}`,
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
