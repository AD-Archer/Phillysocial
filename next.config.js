/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@lib': '/src/lib',
      '@components': '/src/components',
      '@layouts': '/src/layouts',
      '@pages': '/src/app/(pages)',
    };
    return config;
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',  // For Google authentication profile pictures
      'firebasestorage.googleapis.com',  // For Firebase Storage
      '2ad5tl9u0f.ufs.sh',  // Added this domain for founder images
      'media.nbcphiladelphia.com'
    ],
  },
};

module.exports = nextConfig; 