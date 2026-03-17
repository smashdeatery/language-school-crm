import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-check separately with `tsc --noEmit`; skipped here to avoid OOM on low-RAM machines
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
