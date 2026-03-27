import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["convex", "@ping/shared"],
  // TODO: Fix existing lint errors, then remove ignoreDuringBuilds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
