import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript (tsc) is our correctness gate. Don't fail production builds on
  // stylistic ESLint rules (e.g. unescaped quotes in Spanish copy).
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
