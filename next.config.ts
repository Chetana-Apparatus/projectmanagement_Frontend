import type { NextConfig } from "next";

/**
 * API proxying is handled by `src/app/api/v1/[[...path]]/route.ts` (reliable on Windows / App Router).
 * Optional rewrites are not required for `/api/v1/*`.
 */
const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
};

export default nextConfig;
