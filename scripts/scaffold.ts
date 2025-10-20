#!/usr/bin/env tsx

import { Command } from "commander";
import { query } from "@anthropic-ai/claude-agent-sdk";
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import * as readline from "readline";

// Constants
const PROJECT_ROOT = process.cwd();
const PATHS = {
  context: path.join(PROJECT_ROOT, "BUSINESS_CONTEXT.md"),
  scaffold: path.join(PROJECT_ROOT, "SCAFFOLD.md"),
  state: path.join(PROJECT_ROOT, ".scaffold-state.json"),
  brand: path.join(PROJECT_ROOT, "lib/brand.ts"),
  globals: path.join(PROJECT_ROOT, "app/globals.css"),
  envExample: path.join(PROJECT_ROOT, ".env.example"),
  envLocal: path.join(PROJECT_ROOT, ".env.local"),
  claudeMd: path.join(PROJECT_ROOT, "CLAUDE.md"),
};

interface ScaffoldState {
  phase1_contextCollected: boolean;
  phase2_brandingSetup: boolean;
  phase3_namesReplaced: boolean;
  phase4_envSetup: boolean;
  companyName?: string;
  completedAt?: string;
}

interface ScaffoldOptions {
  dryRun: boolean;
}

let globalOptions: ScaffoldOptions = {
  dryRun: false,
};

// ============================================================================
// Utility Functions
// ============================================================================

async function loadState(): Promise<ScaffoldState> {
  if (existsSync(PATHS.state)) {
    const content = await fs.readFile(PATHS.state, "utf-8");
    return JSON.parse(content);
  }
  return {
    phase1_contextCollected: false,
    phase2_brandingSetup: false,
    phase3_namesReplaced: false,
    phase4_envSetup: false,
  };
}

async function saveState(state: ScaffoldState): Promise<void> {
  if (globalOptions.dryRun) {
    console.log("[DRY RUN] Would save state:", state);
    return;
  }
  await fs.writeFile(PATHS.state, JSON.stringify(state, null, 2));
}

async function writeFile(filePath: string, content: string): Promise<void> {
  if (globalOptions.dryRun) {
    console.log(`[DRY RUN] Would write to ${filePath}`);
    console.log(`[DRY RUN] Content preview (first 200 chars):`);
    console.log(content.substring(0, 200) + "...\n");
    return;
  }
  await fs.writeFile(filePath, content);
}

async function copyFile(src: string, dest: string): Promise<void> {
  if (globalOptions.dryRun) {
    console.log(`[DRY RUN] Would copy ${src} to ${dest}`);
    return;
  }
  await fs.copyFile(src, dest);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getMultilineInput(promptText: string): Promise<string> {
  console.log(promptText);
  console.log("(Type your content, then press Ctrl+D when done)\n");

  return new Promise((resolve) => {
    let input = "";
    process.stdin.setEncoding("utf-8");

    const handleData = (chunk: string) => {
      input += chunk;
    };

    const handleEnd = () => {
      process.stdin.off("data", handleData);
      process.stdin.off("end", handleEnd);
      resolve(input.trim());
    };

    process.stdin.on("data", handleData);
    process.stdin.on("end", handleEnd);
  });
}

function printHeader(title: string): void {
  console.log("\n" + "=".repeat(70));
  console.log(title);
  console.log("=".repeat(70) + "\n");
}

function printSuccess(message: string): void {
  console.log(`\n✅ ${message}\n`);
}

function printInfo(message: string): void {
  console.log(`ℹ️  ${message}`);
}

// ============================================================================
// API Key Management
// ============================================================================

async function ensureAnthropicApiKey(): Promise<void> {
  // Check if ANTHROPIC_API_KEY is already in environment
  if (process.env.ANTHROPIC_API_KEY) {
    printInfo("Anthropic API key found in environment");
    return;
  }

  // Try to load from .env.local if it exists
  if (existsSync(PATHS.envLocal)) {
    const envLocalContent = await fs.readFile(PATHS.envLocal, "utf-8");
    const match = envLocalContent.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match && match[1]) {
      const apiKey = match[1].trim().replace(/["']/g, "");
      process.env.ANTHROPIC_API_KEY = apiKey;
      printInfo("Anthropic API key loaded from .env.local");
      return;
    }
  }

  // API key not found - prompt user
  console.log("\n" + "=".repeat(70));
  console.log("⚠️  ANTHROPIC_API_KEY not found");
  console.log("=".repeat(70) + "\n");
  console.log("The scaffold script requires an Anthropic API key to function.");
  console.log(
    "You can obtain an API key from: https://console.anthropic.com/settings/keys\n",
  );

  const apiKey = await prompt("Enter your Anthropic API key: ");

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Anthropic API key is required to run the scaffold script");
  }

  // Write to .env.local
  const envLocalEntry = `\n# Anthropic API Key for scaffold script\nANTHROPIC_API_KEY=${apiKey.trim()}\n`;

  if (existsSync(PATHS.envLocal)) {
    // Append to existing file
    const currentContent = await fs.readFile(PATHS.envLocal, "utf-8");
    if (!currentContent.includes("ANTHROPIC_API_KEY")) {
      await fs.appendFile(PATHS.envLocal, envLocalEntry);
      printSuccess("Anthropic API key saved to .env.local");
    }
  } else {
    // Create new .env.local file
    await fs.writeFile(PATHS.envLocal, envLocalEntry.trim() + "\n");
    printSuccess("Created .env.local with Anthropic API key");
  }

  // Set in current environment
  process.env.ANTHROPIC_API_KEY = apiKey.trim();
  printInfo("Anthropic API key loaded and ready for use");
}

// ============================================================================
// Phase 1: Business Context Collection
// ============================================================================

async function phase1CollectContext(): Promise<void> {
  printHeader("📝 PHASE 1: Business Context Collection");

  console.log(
    "Please provide detailed business context for your application.\n",
  );
  console.log("Include information about:");
  console.log("  • Problem statement and solution");
  console.log("  • Target users and personas");
  console.log("  • Core features and functionality");
  console.log("  • Technical requirements");
  console.log("  • Integration needs (payments, email, etc.)");
  console.log("  • Any specific design preferences\n");

  const rawContext = await getMultilineInput("Enter your business context:");

  if (!rawContext) {
    throw new Error("Business context cannot be empty");
  }

  console.log("\n🤖 Structuring your context with Claude AI...");
  console.log("This may take a minute...\n");

  const structurePrompt =
    `You are helping structure a business context dump for a Next.js application scaffold.

IMPORTANT: Use 'ultrathink' mode - think deeply about the business context, extract all relevant details, and create a comprehensive implementation plan.

The raw business context is:

---
${rawContext}
---

Please create a comprehensive, structured document following this format:

# Business Context Document

## 1. Executive Summary
[2-3 paragraphs summarizing the application, its purpose, and value proposition]

## 2. Problem Statement
[What problem does this solve? Who experiences this problem?]

## 3. Target Users
[Detailed user personas with characteristics, needs, and pain points]

## 4. Core Features
[Detailed feature list organized by priority. For each feature, include:
- Feature name and description
- User story (As a [user], I want [feature] so that [benefit])
- Technical notes and considerations
- Dependencies on other features]

## 5. Database Schema Design
[Based on the features, suggest database tables following these guidelines:
- Use Supabase PostgreSQL patterns
- Include Row Level Security (RLS) considerations
- Define relationships between tables
- Suggest indexes for performance
- Follow the patterns from CLAUDE.md]

Example table structure:
\`\`\`sql
-- users table (managed by Supabase Auth)
-- profiles table (user_id references auth.users)
-- [other tables based on features]
\`\`\`

## 6. API Endpoints & Server Actions
[Suggest server actions following CLAUDE.md patterns:
- Group by entity/feature
- Follow naming conventions (get*, create*, update*, delete*)
- Include validation with Zod schemas
- Note authentication requirements]

Example:
\`\`\`typescript
// server/[entity].actions.ts
export async function getEntity(id: string) { ... }
export async function createEntity(data: ...) { ... }
\`\`\`

## 7. UI/UX Requirements
[Key screens and user flows:
- Landing page structure
- Authentication flows
- Main dashboard/app interface
- Key interactions and transitions
- Responsive design considerations
- Accessibility requirements]

## 8. External Integrations
[Third-party services needed:
- Stripe (payments) - if applicable
- Resend (transactional email) - what emails?
- Mapbox (address autocomplete) - if applicable
- PostHog (analytics) - default included
- Other services needed]

## 9. Implementation Phases
[Suggested order of implementation, organized into phases (not caring about time estimates):

Phase 1: Foundation
- Database schema
- Authentication setup
- Basic layouts

Phase 2: Core Features
- [Main feature 1]
- [Main feature 2]

Phase 3: Advanced Features
- [Advanced feature 1]
- Integrations

Phase 4: Polish & Launch
- Testing
- Performance optimization
- Documentation]

## 10. Success Metrics
[How will we measure success?
- User engagement metrics
- Business metrics (revenue, conversions, etc.)
- Technical metrics (performance, uptime)]

Follow the patterns and conventions from CLAUDE.md. Be specific and actionable. Make this document serve as a complete implementation guide for the development team.`;

  const structureQuery = query({
    prompt: structurePrompt,
    options: {
      cwd: PROJECT_ROOT,
      settingSources: ["project"],
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
      },
      permissionMode: "bypassPermissions",
      model: "claude-sonnet-4-5-20250929",
      maxTurns: 5,
    },
  });

  let structuredContext = "";
  for await (const message of structureQuery) {
    if (message.type === "assistant") {
      const textContent = message.message.content
        .filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("\n");
      structuredContext += textContent;
      process.stdout.write(".");
    }
    if (message.type === "result") {
      if (message.subtype !== "success") {
        throw new Error(`Failed to structure context: ${message.subtype}`);
      }
    }
  }

  console.log("\n");

  await writeFile(PATHS.context, structuredContext);
  printSuccess("Business context structured and saved to BUSINESS_CONTEXT.md");

  // Initialize SCAFFOLD.md
  const scaffoldContent = `# Scaffold Setup Guide

*Generated on ${new Date().toLocaleString()}*

This document tracks your setup progress and provides instructions for completing the setup.

## ✅ Phase 1: Business Context - COMPLETED

- Business context collected and structured with AI assistance
- See [BUSINESS_CONTEXT.md](./BUSINESS_CONTEXT.md) for your complete implementation plan
- Review this document to understand the application architecture

---

## 📋 Next Steps

Continue with **Phase 2: Branding Setup** by running:

\`\`\`bash
bun run scaffold
\`\`\`

Or to preview changes without applying them:

\`\`\`bash
bun run scaffold --dry-run
\`\`\`
`;

  await writeFile(PATHS.scaffold, scaffoldContent);
}

// ============================================================================
// Phase 2: Branding Setup
// ============================================================================

async function phase2SetupBranding(): Promise<void> {
  printHeader("🎨 PHASE 2: Branding Setup");

  console.log("Let's setup your brand colors and theme.\n");
  console.log("Step 1: Visit https://tweakcn.com/editor/theme");
  console.log("Step 2: Create or customize a theme you like");
  console.log('Step 3: Click "Copy CSS" to copy the generated theme CSS\n');

  await prompt("Press Enter when you have the CSS ready...");

  const themeCss = await getMultilineInput(
    "\nPaste the theme CSS from tweakcn.com:",
  );

  if (!themeCss || !themeCss.includes("@layer base")) {
    throw new Error(
      "Invalid theme CSS. Please ensure you copied the complete CSS from tweakcn.com",
    );
  }

  console.log("\n🤖 Extracting colors and updating brand configuration...");
  console.log("This will update app/globals.css and lib/brand.ts\n");

  const brandUpdatePrompt =
    `You are helping update the branding configuration for a Next.js application.

The user has provided this theme CSS from tweakcn.com:

---
${themeCss}
---

Task: Update the brand colors in lib/brand.ts

Current brand.ts file location: ${PATHS.brand}
Current globals.css file location: ${PATHS.globals}

Please follow these steps:

1. **First**, use the Edit tool to update the CSS variables in app/globals.css with the provided theme CSS, keeping the rest of the file intact. Ensure the correct type of color definition (oklch, hsl, etc.) is preserved.

2. **Then**, read the current lib/brand.ts file to understand its structure

3. **Extract colors** from the CSS variables in the theme:
   - Look for --background, --foreground, --primary, --secondary, --muted, --accent, --destructive
   - Extract values for both :root (light mode) and .dark (dark mode)
   - Convert HSL values to hex format

4. **Update brand.ts** by editing ONLY the brandColors object:
   - Replace the hex values for light mode colors
   - Replace the hex values for dark mode colors
   - Preserve ALL other content in the file (companyConfig, functions, etc.)

Example HSL to Hex conversion:
- HSL: 0 0% 100% (hsl format from CSS) → Hex: #ffffff
- HSL: 0 0% 9% → Hex: #171717
- HSL: 221.2 83.2% 53.3% → Hex: #3b82f6

Use the Edit tool to update only the brandColors values, keeping the rest of the file intact.

IMPORTANT: Do not modify any other part of lib/brand.ts - only update the hex color values in the brandColors object.`;

  const brandUpdateQuery = query({
    prompt: brandUpdatePrompt,
    options: {
      cwd: PROJECT_ROOT,
      settingSources: ["project"],
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
      },
      permissionMode: globalOptions.dryRun ? "default" : "bypassPermissions",
      allowedTools: ["Read", "Edit", "Write"],
      maxTurns: 10,
    },
  });

  for await (const message of brandUpdateQuery) {
    if (message.type === "assistant") {
      const textContent = message.message.content
        .filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("\n");

      if (textContent) {
        process.stdout.write(".");
      }
    }
    if (message.type === "result") {
      if (message.subtype !== "success") {
        throw new Error(`Failed to update branding: ${message.subtype}`);
      }
    }
  }

  console.log("\n");

  printSuccess("Branding updated in lib/brand.ts and app/globals.css");
  printInfo("Review the changes to ensure colors match your design");

  // Update SCAFFOLD.md
  const currentScaffold = await fs.readFile(PATHS.scaffold, "utf-8");
  const updatedScaffold = currentScaffold.replace(
    "## 📋 Next Steps",
    `## ✅ Phase 2: Branding Setup - COMPLETED

- Theme CSS applied to app/globals.css
- Brand colors extracted and converted to hex format
- Updated lib/brand.ts with new color palette
- Both light and dark mode colors configured

**Files Modified:**
- \`app/globals.css\` - Complete theme CSS
- \`lib/brand.ts\` - Brand color hex values

---

## 📋 Next Steps`,
  );
  await writeFile(PATHS.scaffold, updatedScaffold);
}

// ============================================================================
// Phase 3: Name Replacement
// ============================================================================

async function acceptOrEdit(label: string, suggestion: string): Promise<string> {
  console.log(`\n${label}:`);
  console.log(`  💡 Suggested: "${suggestion}"`);
  const accept = await prompt("  Accept? (Y/n/edit): ");

  if (accept.toLowerCase() === "n" || accept.toLowerCase() === "no") {
    return await prompt(`  Enter ${label}: `);
  }

  if (accept.toLowerCase() === "edit" || accept.toLowerCase() === "e") {
    console.log(`  Current: "${suggestion}"`);
    return await prompt(`  Enter new value: `);
  }

  return suggestion;
}

async function phase3ReplaceNames(): Promise<void> {
  printHeader("✏️  PHASE 3: Replace Placeholder Names");

  // Check if business context exists
  if (!existsSync(PATHS.context)) {
    console.error(
      "❌ BUSINESS_CONTEXT.md not found.\n",
    );
    console.error(
      "Please complete Phase 1 (Business Context Collection) first by running:\n",
    );
    console.error("  bun run scaffold\n");
    throw new Error(
      "Business context required. Complete Phase 1 before proceeding to Phase 3.",
    );
  }

  console.log(
    "🤖 Analyzing your business context to suggest company information...\n",
  );

  // Read business context
  const businessContext = await fs.readFile(PATHS.context, "utf-8");

  // Use AI to suggest values based on business context
  const suggestionPrompt =
    `You are helping extract company/application information from a business context document.

Based on the business context below, suggest appropriate values for:
1. Company/Application Name
2. Tagline (one compelling sentence)
3. Description (1-2 sentences for the main landing page)
4. Short Description (concise version for meta tags, max 160 characters)
5. Domain (suggest a domain based on the company name, format: example.com)

Business Context:
---
${businessContext}
---

Respond in this EXACT format (one per line, no extra formatting):
COMPANY_NAME: [name]
TAGLINE: [tagline]
DESCRIPTION: [description]
SHORT_DESCRIPTION: [short description]
DOMAIN: [domain]

Be creative and align with the business context. Make the suggestions compelling and professional.`;

  const suggestionQuery = query({
    prompt: suggestionPrompt,
    options: {
      cwd: PROJECT_ROOT,
      settingSources: ["project"],
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
      },
      permissionMode: "bypassPermissions",
      maxTurns: 3,
    },
  });

  let suggestionsText = "";
  for await (const message of suggestionQuery) {
    if (message.type === "assistant") {
      const textContent = message.message.content
        .filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("\n");
      suggestionsText += textContent;
    }
    if (message.type === "result") {
      if (message.subtype !== "success") {
        throw new Error(`Failed to generate suggestions: ${message.subtype}`);
      }
    }
  }

  // Parse suggestions
  const parseValue = (text: string, key: string): string => {
    const regex = new RegExp(`${key}:\\s*(.+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const suggestedName = parseValue(suggestionsText, "COMPANY_NAME");
  const suggestedTagline = parseValue(suggestionsText, "TAGLINE");
  const suggestedDescription = parseValue(suggestionsText, "DESCRIPTION");
  const suggestedShortDescription = parseValue(
    suggestionsText,
    "SHORT_DESCRIPTION",
  );
  const suggestedDomain = parseValue(suggestionsText, "DOMAIN");

  // Interactive acceptance/editing
  console.log("\n📝 Review and confirm the suggested values:\n");
  console.log("=" .repeat(70));

  const companyName = await acceptOrEdit(
    "Company/Application Name",
    suggestedName,
  );
  const tagline = await acceptOrEdit("Tagline", suggestedTagline);
  const description = await acceptOrEdit("Description", suggestedDescription);
  const shortDescription = await acceptOrEdit(
    "Short Description",
    suggestedShortDescription,
  );
  const domain = await acceptOrEdit("Domain", suggestedDomain);

  if (!companyName || !domain) {
    throw new Error("Company name and domain are required");
  }

  console.log("\n" + "=".repeat(70));
  console.log("\n✅ All values confirmed!\n");

  // Iterative replacement - keep searching until no placeholders remain
  console.log("🤖 Finding and replacing ALL placeholders in the codebase...");
  console.log("This will run iteratively until all placeholders are replaced.\n");

  let iteration = 1;
  const maxIterations = 5;

  while (iteration <= maxIterations) {
    console.log(`\n🔄 Iteration ${iteration}/${maxIterations}`);
    console.log("Searching for remaining placeholders...\n");

    const replacePrompt =
      `You are on iteration ${iteration} of replacing placeholder names in the codebase.

Replacements to make:
- COMPANY_NAME → ${companyName}
- COMPANY_TAGLINE → ${tagline}
- COMPANY_DESCRIPTION → ${description}
- COMPANY_SHORT_DESCRIPTION → ${shortDescription}
- example.com → ${domain}

Steps for THIS iteration:
1. Use Grep to search for ANY of these placeholders: "COMPANY_NAME", "COMPANY_TAGLINE", "COMPANY_DESCRIPTION", "COMPANY_SHORT_DESCRIPTION", "example.com"
2. For EACH file found:
   - Use Read to see the full file content
   - Use Edit to replace ALL placeholder occurrences with actual values
3. After replacing, explicitly state: "All placeholders have been replaced" or "Found N files with placeholders"

IMPORTANT:
- Use exact string matching for replacements
- Replace ALL occurrences in each file (use replace_all parameter in Edit tool when appropriate)
- Preserve file structure and formatting
- Be thorough - check lib/brand.ts, package.json, README files, etc.
- If NO files contain placeholders, state "No placeholders found"

${iteration > 1 ? "Previous iterations may have missed some files. Search thoroughly!" : ""}`;

    const replaceQuery = query({
      prompt: replacePrompt,
      options: {
        cwd: PROJECT_ROOT,
        settingSources: ["project"],
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
        },
        permissionMode: globalOptions.dryRun ? "default" : "bypassPermissions",
        allowedTools: ["Grep", "Read", "Edit"],
        maxTurns: 20,
      },
    });

    let iterationOutput = "";
    for await (const message of replaceQuery) {
      if (message.type === "assistant") {
        const textContent = message.message.content
          .filter((block: { type: string }) => block.type === "text")
          .map((block: { text: string }) => block.text)
          .join("\n");
        iterationOutput += textContent;
        process.stdout.write(".");
      }
      if (message.type === "result") {
        if (message.subtype !== "success") {
          throw new Error(
            `Failed to replace names in iteration ${iteration}: ${message.subtype}`,
          );
        }
      }
    }

    console.log("\n");

    // Check if this iteration found any placeholders
    const noPlaceholdersFound =
      iterationOutput.toLowerCase().includes("no placeholders found") ||
      iterationOutput.toLowerCase().includes("no files") ||
      iterationOutput.toLowerCase().includes("all placeholders have been replaced");

    if (noPlaceholdersFound && iteration > 1) {
      console.log(
        "✅ No more placeholders found. All replacements complete!\n",
      );
      break;
    }

    if (iteration === maxIterations) {
      console.log(
        "⚠️  Reached maximum iterations. Manual verification recommended.\n",
      );
    }

    iteration++;
  }

  printSuccess("Placeholder names replaced throughout the codebase");
  printInfo(`Company name: ${companyName}`);
  printInfo(`Tagline: ${tagline}`);
  printInfo(`Domain: ${domain}`);

  // Update SCAFFOLD.md
  const currentScaffold = await fs.readFile(PATHS.scaffold, "utf-8");
  const updatedScaffold = currentScaffold.replace(
    "## 📋 Next Steps",
    `## ✅ Phase 3: Name Replacement - COMPLETED

- Replaced COMPANY_NAME with "${companyName}"
- Replaced COMPANY_TAGLINE with "${tagline}"
- Replaced COMPANY_DESCRIPTION with "${description}"
- Replaced COMPANY_SHORT_DESCRIPTION with "${shortDescription}"
- Replaced domain placeholders with "${domain}"

**Process:**
- AI analyzed BUSINESS_CONTEXT.md and suggested values
- User reviewed and confirmed/edited each value
- Iterative search-and-replace until all placeholders removed

**Files Modified:**
- lib/brand.ts and other configuration files
- All files containing placeholder text

---

## 📋 Next Steps`,
  );
  await writeFile(PATHS.scaffold, updatedScaffold);
}

// ============================================================================
// Phase 4: Environment Setup
// ============================================================================

async function phase4SetupEnvironment(): Promise<void> {
  printHeader("⚙️  PHASE 4: Environment Setup");

  // Copy .env.example to .env.local
  if (existsSync(PATHS.envLocal)) {
    const overwrite = await prompt(
      ".env.local file already exists. Overwrite? (y/N): ",
    );
    if (overwrite.toLowerCase() !== "y") {
      console.log("Skipping .env.local file creation...\n");
    } else {
      await copyFile(PATHS.envExample, PATHS.envLocal);
      printSuccess("Created .env.local file from .env.example");
    }
  } else {
    await copyFile(PATHS.envExample, PATHS.envLocal);
    printSuccess("Created .env.local file from .env.example");
  }

  // Read .env.example to generate documentation
  const envExample = await fs.readFile(PATHS.envExample, "utf-8");

  console.log("🤖 Generating comprehensive environment setup documentation...");
  console.log("This will create detailed instructions for each service.\n");

  const envDocsPrompt =
    `Generate comprehensive, developer-friendly setup documentation for environment variables.

The .env.example file contains:

---
${envExample}
---

Create a detailed setup guide with the following structure:

## Environment Variables Setup Guide

### Overview
[Brief explanation of what environment variables are needed and why]

### Quick Start (Minimum Required)
[List only the absolutely required variables to get started locally]

### Detailed Setup by Service

For each service in the .env.example file, create a section with:

#### Service Name (e.g., Supabase, Stripe, Resend)
- **Purpose**: What this service is used for in the application
- **Required**: Yes/No
- **Setup Steps**:
  1. Sign up at [URL]
  2. Navigate to [specific page]
  3. Copy [specific key]
  4. Paste into .env.local as [VARIABLE_NAME]
- **Documentation**: Link to official docs
- **Cost**: Free tier info or pricing notes
- **Local Development**: Any special considerations for local dev

### Environment-Specific Configuration

#### Local Development (.env.local)
[What variables are needed locally]

#### Production Deployment
[What variables are needed in production]
[Where to set them (Vercel, Railway, etc.)]

### Verification
[How to verify the setup is correct]
[Common issues and troubleshooting]

Make this guide extremely clear and actionable for developers who may not be familiar with all these services.`;

  const envDocsQuery = query({
    prompt: envDocsPrompt,
    options: {
      cwd: PROJECT_ROOT,
      settingSources: ["project"],
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
      },
      permissionMode: "bypassPermissions",
      maxTurns: 5,
    },
  });

  let envDocs = "";
  for await (const message of envDocsQuery) {
    if (message.type === "assistant") {
      const textContent = message.message.content
        .filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("\n");
      envDocs += textContent;
      process.stdout.write(".");
    }
    if (message.type === "result") {
      if (message.subtype !== "success") {
        throw new Error(
          `Failed to generate environment docs: ${message.subtype}`,
        );
      }
    }
  }

  console.log("\n");

  // Update SCAFFOLD.md with complete final documentation
  const currentScaffold = await fs.readFile(PATHS.scaffold, "utf-8");
  const finalScaffold = currentScaffold.replace(
    "## 📋 Next Steps",
    `## ✅ Phase 4: Environment Setup - COMPLETED

${envDocs}

---

## 🎉 Scaffolding Complete!

Your project is now fully scaffolded and ready for development!

### 📚 Important Documents

1. **[BUSINESS_CONTEXT.md](./BUSINESS_CONTEXT.md)** - Your complete implementation plan
   - Database schema design
   - Feature specifications
   - Implementation phases
   - Technical architecture

2. **[SCAFFOLD.md](./SCAFFOLD.md)** - This file
   - Setup instructions
   - Environment configuration
   - Service integration guides

3. **[CLAUDE.md](./CLAUDE.md)** - Development guidelines
   - Code conventions
   - Architecture patterns
   - Best practices

### 🚀 Next Steps to Start Development

#### 1. Complete Environment Setup
\`\`\`bash
# Fill in all required environment variables in .env.local
# Follow the service-specific instructions above
nano .env.local  # or use your preferred editor
\`\`\`

#### 2. Start Local Database
\`\`\`bash
bun db:start              # Start local Supabase (requires Docker)
\`\`\`

#### 3. Create Database Schema
Based on BUSINESS_CONTEXT.md, create your database tables:

\`\`\`bash
# Create schema files in supabase/schemas/
# Example: supabase/schemas/03-your-tables.sql
bun db:diff my_first_migration   # Generate migration
bun migrate:up                    # Apply migration
bun gen:types                     # Generate TypeScript types
\`\`\`

#### 4. Remove Example Code
The project includes a todo CRUD example for reference:
- Review: \`app/oppgaver/\` (todos feature)
- Review: \`server/todos.actions.ts\` (server actions pattern)
- Remove when ready to build your own features

#### 5. Start Development Server
\`\`\`bash
bun dev                   # Start Next.js dev server
# Visit http://localhost:3000
\`\`\`

#### 6. Follow Implementation Phases
Refer to BUSINESS_CONTEXT.md for the recommended implementation order.

### 💡 Development Tips

- **Database Changes**: Always use \`bun db:diff\` to generate migrations
- **Type Safety**: Run \`bun gen:types\` after schema changes
- **Code Quality**: Run \`bun type:check\` before committing
- **Documentation**: Update docs/ as you implement features

### 🆘 Need Help?

- Review CLAUDE.md for patterns and conventions
- Check the examples directory for reference implementations
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs

### 🎯 Success Metrics

Track your progress against the success metrics defined in BUSINESS_CONTEXT.md.

---

**Happy coding! 🚀**

*Scaffold completed on ${new Date().toLocaleString()}*`,
  );

  await writeFile(PATHS.scaffold, finalScaffold);

  printSuccess("Environment documentation generated and added to SCAFFOLD.md");
  printInfo("Your project is now fully scaffolded!");
}

// ============================================================================
// Main Scaffold Runner
// ============================================================================

async function runScaffold(options: ScaffoldOptions): Promise<void> {
  globalOptions = options;

  if (options.dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }

  console.log("🏗️  create-reodor-app Scaffold Setup\n");

  // Ensure Anthropic API key is available before proceeding
  await ensureAnthropicApiKey();

  const state = await loadState();

  try {
    // Phase 1: Context Collection
    if (!state.phase1_contextCollected) {
      await phase1CollectContext();
      state.phase1_contextCollected = true;
      await saveState(state);
      console.log(
        "💾 Progress saved. Run the script again to continue to Phase 2.\n",
      );
      return;
    }

    // Phase 2: Branding Setup
    if (!state.phase2_brandingSetup) {
      await phase2SetupBranding();
      state.phase2_brandingSetup = true;
      await saveState(state);
      console.log(
        "💾 Progress saved. Run the script again to continue to Phase 3.\n",
      );
      return;
    }

    // Phase 3: Name Replacement
    if (!state.phase3_namesReplaced) {
      await phase3ReplaceNames();
      state.phase3_namesReplaced = true;
      await saveState(state);
      console.log(
        "💾 Progress saved. Run the script again to continue to Phase 4.\n",
      );
      return;
    }

    // Phase 4: Environment Setup
    if (!state.phase4_envSetup) {
      await phase4SetupEnvironment();
      state.phase4_envSetup = true;
      state.completedAt = new Date().toISOString();
      await saveState(state);
    }

    // All phases complete
    printHeader("🎉 SCAFFOLDING COMPLETE!");
    console.log("📖 Review SCAFFOLD.md for detailed setup instructions");
    console.log("📋 Review BUSINESS_CONTEXT.md for your implementation plan");
    console.log(
      "💻 Review lib/brand.ts and app/globals.css for your brand colors\n",
    );
    console.log(
      "Next: Follow the steps in SCAFFOLD.md to complete environment setup\n",
    );
  } catch (error) {
    console.error("\n❌ Error during scaffolding:");
    console.error(error instanceof Error ? error.message : error);
    console.log(
      "\n💡 Your progress has been saved. Fix the issue and run the script again.\n",
    );
    process.exit(1);
  }
}

// ============================================================================
// CLI Commands
// ============================================================================

const program = new Command();

program
  .name("scaffold")
  .description("Interactive scaffold setup for create-reodor-app")
  .version("1.0.0")
  .option("--dry-run", "Preview changes without applying them")
  .action(async (options) => {
    await runScaffold(options);
  });

program
  .command("reset")
  .description("Reset scaffold state and start over")
  .option(
    "--keep-docs",
    "Keep generated documentation (BUSINESS_CONTEXT.md, SCAFFOLD.md)",
  )
  .option("--keep-env", "Keep .env.local file")
  .action(async (options) => {
    console.log("🔄 Resetting scaffold state...\n");

    // Remove state file
    if (existsSync(PATHS.state)) {
      await fs.unlink(PATHS.state);
      console.log("✅ Removed .scaffold-state.json");
    }

    // Remove documentation unless --keep-docs
    if (!options.keepDocs) {
      if (existsSync(PATHS.context)) {
        await fs.unlink(PATHS.context);
        console.log("✅ Removed BUSINESS_CONTEXT.md");
      }
      if (existsSync(PATHS.scaffold)) {
        await fs.unlink(PATHS.scaffold);
        console.log("✅ Removed SCAFFOLD.md");
      }
    } else {
      console.log("ℹ️  Kept documentation files (--keep-docs)");
    }

    // Remove .env.local unless --keep-env
    if (!options.keepEnv && existsSync(PATHS.envLocal)) {
      await fs.unlink(PATHS.envLocal);
      console.log("✅ Removed .env.local");
    } else if (options.keepEnv) {
      console.log("ℹ️  Kept .env.local file (--keep-env)");
    }

    console.log(
      '\n✅ Scaffold state reset. Run "bun run scaffold" to start over.\n',
    );
  });

program
  .command("status")
  .description("Show current scaffold progress")
  .action(async () => {
    const state = await loadState();

    printHeader("📊 Scaffold Progress");

    console.log(
      "Phase 1 (Business Context):  " +
        (state.phase1_contextCollected ? "✅ Complete" : "⏸️  Pending"),
    );
    console.log(
      "Phase 2 (Branding Setup):    " +
        (state.phase2_brandingSetup ? "✅ Complete" : "⏸️  Pending"),
    );
    console.log(
      "Phase 3 (Name Replacement):  " +
        (state.phase3_namesReplaced ? "✅ Complete" : "⏸️  Pending"),
    );
    console.log(
      "Phase 4 (Environment Setup): " +
        (state.phase4_envSetup ? "✅ Complete" : "⏸️  Pending"),
    );

    if (state.completedAt) {
      console.log(
        "\n🎉 Scaffolding completed on: " +
          new Date(state.completedAt).toLocaleString(),
      );
    } else {
      const nextPhase = !state.phase1_contextCollected
        ? "1 (Business Context)"
        : !state.phase2_brandingSetup
        ? "2 (Branding Setup)"
        : !state.phase3_namesReplaced
        ? "3 (Name Replacement)"
        : "4 (Environment Setup)";
      console.log("\n📋 Next phase: " + nextPhase);
      console.log('Run "bun run scaffold" to continue');
    }

    console.log("");

    // Show which files exist
    console.log("Generated files:");
    console.log(
      "  BUSINESS_CONTEXT.md: " + (existsSync(PATHS.context) ? "✅" : "❌"),
    );
    console.log(
      "  SCAFFOLD.md:         " + (existsSync(PATHS.scaffold) ? "✅" : "❌"),
    );
    console.log(
      "  .env.local:          " + (existsSync(PATHS.envLocal) ? "✅" : "❌"),
    );
    console.log("");
  });

program.parse();
