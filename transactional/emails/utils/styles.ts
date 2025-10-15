// Shared styles and colors for email templates
// Based on the brand colors from globals.css

export const colors = {
  // Primary brand colors
  background: "#f8f6ff", // --background
  foreground: "#453a6b", // --foreground
  primary: "#9b8cc8", // --primary
  primaryForeground: "#ffffff",

  // Secondary colors
  secondary: "#fee7dc", // --secondary
  secondaryForeground: "#c2724a", // --secondary-foreground

  // Accent colors (green)
  accent: "#e8f5e8", // --accent
  accentForeground: "#4a7c4a", // --accent-foreground

  // Muted colors
  muted: "#edeaf7", // --muted
  mutedForeground: "#6b6682", // --muted-foreground

  // Utility colors
  border: "#edeaf7", // --muted (used for borders)
  destructive: "#ff3333", // --destructive (red)

  // Email specific
  white: "#ffffff",
  warning: "#fff3cd", // Light yellow for warnings
  warningBorder: "#ffc107", // Yellow border
  warningText: "#856404", // Dark yellow text
};

export const fontFamily =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

// Base styles that are common across all emails
export const baseStyles = {
  main: {
    backgroundColor: colors.background,
    fontFamily,
  },

  container: {
    margin: "0 auto",
    padding: "40px 20px",
    maxWidth: "600px",
    backgroundColor: colors.white,
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(69, 58, 107, 0.1)",
  },

  logoContainer: {
    marginBottom: "32px",
    textAlign: "center" as const,
  },

  logo: {
    margin: "0 auto",
  },

  heading: {
    fontSize: "28px",
    letterSpacing: "-0.5px",
    lineHeight: "1.2",
    fontWeight: "600",
    color: colors.foreground,
    margin: "0 0 24px",
    textAlign: "center" as const,
  },

  subHeading: {
    fontSize: "20px",
    lineHeight: "1.4",
    fontWeight: "600",
    color: colors.foreground,
    margin: "0 0 16px",
  },

  paragraph: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: colors.foreground,
    margin: "0 0 20px",
  },

  hr: {
    borderColor: colors.muted,
    margin: "32px 0",
    borderWidth: "1px",
    borderStyle: "solid",
  },

  footer: {
    color: colors.mutedForeground,
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 8px",
    textAlign: "center" as const,
  },

  link: {
    color: colors.primary,
    textDecoration: "none",
    fontWeight: "500",
  },
};

// Common section styles
export const sectionStyles = {
  // Primary information section (muted background)
  infoSection: {
    backgroundColor: colors.muted,
    borderRadius: "10px",
    padding: "24px",
    margin: "32px 0",
    border: `1px solid rgba(155, 140, 200, 0.3)`, // primary with transparency
  },

  // Secondary information section (secondary background)
  detailsSection: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: colors.secondary,
    borderRadius: "10px",
    border: `1px solid ${colors.secondaryForeground}`,
  },

  // Message section (secondary background with border)
  messageSection: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: colors.secondary,
    border: `2px solid ${colors.secondaryForeground}`,
    borderRadius: "10px",
  },

  // Action/CTA section
  actionSection: {
    textAlign: "center" as const,
    margin: "32px 0",
  },

  // Customer section (accent colors)
  customerSection: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: colors.accent,
    borderRadius: "12px",
    border: `2px solid ${colors.accentForeground}`,
    textAlign: "center" as const,
  },

  // Tips section
  tipsSection: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: colors.muted,
    borderRadius: "8px",
    borderLeft: `4px solid ${colors.primary}`,
  },

  // Reminder section (warning style)
  reminderSection: {
    margin: "32px 0",
    padding: "16px 20px",
    backgroundColor: colors.warning,
    border: `2px solid ${colors.warningBorder}`,
    borderRadius: "8px",
    textAlign: "center" as const,
  },

  // Settings section
  settingsSection: {
    margin: "32px 0",
    padding: "16px",
    backgroundColor: "rgba(155, 140, 200, 0.05)",
    borderRadius: "8px",
    textAlign: "center" as const,
  },
};

// Text styles for different contexts
export const textStyles = {
  // Section headers
  sectionHeader: {
    fontSize: "18px",
    fontWeight: "600",
    color: colors.foreground,
    margin: "0 0 16px",
  },

  // Detail labels and values (for muted sections)
  detailLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: colors.mutedForeground,
    margin: "0",
    flex: "0 0 100px",
  },

  detailValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: colors.foreground,
    margin: "0",
    textAlign: "right" as const,
    flex: "1",
  },

  // Secondary detail labels and values (for secondary sections)
  secondaryDetailLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: colors.secondaryForeground,
    margin: "16px 0 4px",
  },

  secondaryDetailValue: {
    fontSize: "16px",
    color: colors.secondaryForeground,
    margin: "0 0 12px",
    fontWeight: "500",
  },

  // Message text styles
  messageHeader: {
    fontSize: "16px",
    fontWeight: "600",
    color: colors.secondaryForeground,
    margin: "0 0 12px",
  },

  messageContent: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: colors.secondaryForeground,
    margin: "0",
    fontStyle: "italic",
  },

  // Customer name in customer section
  customerName: {
    fontSize: "20px",
    fontWeight: "700",
    color: colors.accentForeground,
    margin: "8px 0 4px",
  },

  // Tips text
  tipsHeader: {
    fontSize: "14px",
    fontWeight: "600",
    color: colors.foreground,
    margin: "0 0 12px",
  },

  tipsText: {
    fontSize: "13px",
    lineHeight: "1.6",
    color: colors.mutedForeground,
    margin: "0",
  },

  // Reminder text
  reminderHeader: {
    fontSize: "16px",
    fontWeight: "600",
    color: colors.warningText,
    margin: "0 0 8px",
  },

  reminderText: {
    fontSize: "14px",
    color: colors.warningText,
    margin: "0",
    lineHeight: "1.5",
  },

  // Settings text
  settingsText: {
    fontSize: "12px",
    color: colors.mutedForeground,
    margin: "0 0 8px",
  },

  settingsLink: {
    fontSize: "12px",
    color: colors.primary,
    textDecoration: "none",
    fontWeight: "500",
  },
};

// Button styles
export const buttonStyles = {
  // Primary button
  primary: {
    backgroundColor: colors.primary,
    borderRadius: "8px",
    color: colors.white,
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 28px",
    margin: "16px 0",
    boxShadow: "0 2px 4px rgba(155, 140, 200, 0.3)",
  },

  // Accept button (green)
  accept: {
    backgroundColor: colors.accentForeground,
    borderRadius: "8px",
    color: colors.white,
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 20px",
    boxShadow: "0 2px 4px rgba(74, 124, 74, 0.3)",
    flex: "1",
  },

  // Decline/destructive button (red)
  decline: {
    backgroundColor: colors.destructive,
    borderRadius: "8px",
    color: colors.white,
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 20px",
    boxShadow: "0 2px 4px rgba(255, 51, 51, 0.3)",
    flex: "1",
  },

  // View button (larger primary button)
  view: {
    backgroundColor: colors.primary,
    borderRadius: "8px",
    color: colors.white,
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 28px",
    margin: "8px 0",
    boxShadow: "0 2px 4px rgba(155, 140, 200, 0.3)",
  },
};

// Layout utilities
export const layoutStyles = {
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginBottom: "12px",
  },

  urgencyBanner: {
    borderRadius: "8px",
    padding: "12px 20px",
    textAlign: "center" as const,
    marginBottom: "24px",
    border: "2px solid",
  },

  urgencyText: {
    fontSize: "14px",
    fontWeight: "600",
    margin: "0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
};

// Urgency colors for priority emails
export const urgencyColors = {
  high: { bg: colors.destructive, text: colors.white },
  medium: { bg: colors.secondary, text: colors.secondaryForeground },
  low: { bg: colors.accent, text: colors.accentForeground },
};

// Status colors for booking/application states
export const statusColors = {
  confirmed: colors.accentForeground, // green
  cancelled: colors.destructive, // red
  completed: colors.accentForeground, // green
  approved: colors.accentForeground, // green
  rejected: colors.destructive, // red
  pending: colors.primary, // purple
};
