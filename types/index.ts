import { Database } from "./database.types";

export type DatabaseTables = Database["public"]["Tables"];

// Contact form types
export interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}
