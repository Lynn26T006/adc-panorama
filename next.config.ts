import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/adc-panorama",
  images: { unoptimized: true },
};

export default nextConfig;
