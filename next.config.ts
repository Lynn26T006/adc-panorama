import type { NextConfig } from "next";

const isExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  ...(isExport
    ? { output: "export", basePath: "/adc-panorama" }
    : {}),
};

export default nextConfig;
