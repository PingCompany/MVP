import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["convex", "@ping/shared"],
};

export default nextConfig;
