import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CSS optimization configuration
  experimental: {
    // Removed optimizeCss: true as it requires critters package
    // We use our custom CSS optimization system instead
    cssChunking: 'strict'
  },

  // Webpack configuration for CSS optimization
  webpack: (config, { dev, isServer }) => {
    // Only apply optimizations in production
    if (!dev && !isServer) {
      // CSS purging configuration
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false
      };
    }

    return config;
  },

  // Compiler options for CSS optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Static optimization
  trailingSlash: false,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif']
  }
};

export default nextConfig;
