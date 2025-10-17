import type { Database } from "./database.types";

// Extract table types
export type DatabaseTables = Database["public"]["Tables"];
export type DatabaseEnums = Database["public"]["Enums"];

// Common table row types
export type Profile = DatabaseTables["profiles"]["Row"];
export type Media = DatabaseTables["media"]["Row"];
export type Todo = DatabaseTables["todos"]["Row"];
