#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaFile = path.join(__dirname, "../schemas/database.schema.ts");

// Read the schema file
let content = fs.readFileSync(schemaFile, "utf8");

// Remove "public" prefix from all schema names
content = content.replace(/public([A-Z])/g, "$1");

// Write the updated content back
fs.writeFileSync(schemaFile, content);

console.log('✅ Removed "public" prefix from schema names');
