import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncateString = (str: string, maxLength: number) => {
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};

export const getPublicUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
};

/**
 * Validates if a phone number is a valid Norwegian format
 * Accepts: +47 123 45 678, 123 45 678, 12345678, +4712345678, 12 34 56 78, etc.
 */
export const isValidNorwegianPhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber) return false;

  // Remove all spaces, dashes, and other non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Check for valid Norwegian phone number patterns
  const patterns = [
    /^\+4[79]\d{8}$/, // +47xxxxxxxx or +49xxxxxxxx (legacy)
    /^4[79]\d{8}$/, // 47xxxxxxxx or 49xxxxxxxx
    /^\d{8}$/, // xxxxxxxx (8 digits)
  ];

  return patterns.some((pattern) => pattern.test(cleaned));
};

/**
 * Normalizes a Norwegian phone number to +4712345678 format
 * Stores in database as +47xxxxxxxx regardless of input format
 */
export const normalizeNorwegianPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";

  // Remove all spaces, dashes, and other non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // If it starts with +47, keep as is
  if (cleaned.startsWith("+47") && cleaned.length === 11) {
    return cleaned;
  }

  // If it starts with 47, add +
  if (cleaned.startsWith("47") && cleaned.length === 10) {
    return `+${cleaned}`;
  }

  // If it's 8 digits, assume it's a Norwegian number and add +47
  if (/^\d{8}$/.test(cleaned)) {
    return `+47${cleaned}`;
  }

  // If it starts with +49 (legacy), convert to +47
  if (cleaned.startsWith("+49") && cleaned.length === 11) {
    return `+47${cleaned.slice(3)}`;
  }

  // If it starts with 49, convert to +47
  if (cleaned.startsWith("49") && cleaned.length === 10) {
    return `+47${cleaned.slice(2)}`;
  }

  // Return original if we can't normalize it
  return phoneNumber;
};

/**
 * Formats a phone number for display purposes
 * Converts +4712345678 to +47 123 45 678 for better readability
 */
export const formatNorwegianPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";

  const normalized = normalizeNorwegianPhoneNumber(phoneNumber);

  // Format +4712345678 to +47 123 45 678
  if (normalized.startsWith("+47") && normalized.length === 11) {
    const digits = normalized.slice(3);
    return `+47 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  }

  return phoneNumber;
};
