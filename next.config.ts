import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@lib': '/src/lib',
      '@components': '/src/components',
      '@pages': '/src/app/(pages)',
    };
    return config;
  },
};

export default nextConfig;
