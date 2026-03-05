import type { NextConfig } from "next";

const getConvexHostname = () => {
  try {
    return new URL(process.env.NEXT_PUBLIC_CONVEX_URL || "https://example.com").hostname;
  } catch (error) {
    return "example.com";
  }
};

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https", hostname: getConvexHostname(),
      },
    ],
  },
};

export default nextConfig;
