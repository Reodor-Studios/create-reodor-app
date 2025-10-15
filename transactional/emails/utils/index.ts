// Shared constants for Nabostylisten email templates

export const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

// Logo dimensions utility for email templates
// Original logo: 2159 × 395 pixels (aspect ratio: ~5.47:1)
export function getLogoDimensions(scale: number = 1) {
  const originalWidth = 2159;
  const originalHeight = 395;
  const aspectRatio = originalWidth / originalHeight;

  // Base dimensions for email (optimized for email clients)
  const baseWidth = 120;
  const baseHeight = Math.round(baseWidth / aspectRatio);

  return {
    width: Math.round(baseWidth * scale).toString(),
    height: Math.round(baseHeight * scale).toString(),
  };
}
