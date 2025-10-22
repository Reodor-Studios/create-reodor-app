// Validate environment variables at build time
import "./env.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Local Supabase storage (development)
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/**",
      },
      // Uncomment for production Supabase storage
      // {
      //   protocol: "https",
      //   hostname: "YOUR_PROJECT_REF.supabase.co",
      //   port: "",
      //   pathname: "/storage/**",
      // },
      // Unsplash images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
