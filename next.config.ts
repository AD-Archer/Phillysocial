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
  images: {
    domains: [
      'lh3.googleusercontent.com',  // For Google authentication profile pictures
      'firebasestorage.googleapis.com'  // For Firebase Storage (if you plan to use it)
    ],
  },
};

export default nextConfig;
