import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps manual Windows/WSL browser visits to 127.0.0.1 from triggering
  // Next 16 dev-resource origin warnings. Add "::1" here too if a future
  // Playwright or browser run moves back to IPv6 loopback.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
