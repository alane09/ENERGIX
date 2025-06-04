import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add API route rewrites to proxy requests to the backend
  async rewrites() {
    return [
      // Proxy API requests to the backend server
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
      // Proxy regression requests to the backend server
      {
        source: '/regression/:path*',
        destination: 'http://localhost:8080/regression/:path*',
      },
    ];
  },
  
  // Enable App Router features
  experimental: {
    // Enable server actions for improved performance
    serverActions: { 
      bodySizeLimit: '2mb' 
    },
  },
  
  // Optimize performance
  reactStrictMode: false, // Disable strict mode for better performance
  poweredByHeader: false,
  
  // Optimize image loading
  images: {
    domains: ['localhost'],
    minimumCacheTTL: 3600, // Cache images for 1 hour
  },
  
  eslint: {
    // Disable ESLint during production builds for faster builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
  
  // Optimize production builds
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Optimize webpack configuration
  webpack: (config: any, { dev, isServer }: { dev: boolean, isServer: boolean }) => {
    // Optimize SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Add support for importing PDF files
    config.module.rules.push({
      test: /\.pdf$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]',
            outputPath: 'static/media/',
          },
        },
      ],
    });

    // Optimize development builds
    if (dev) {
      // Reduce the number of chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
      };
    }

    // Optimize bundle size
    if (!isServer && !dev) {
      // Enable tree shaking
      config.optimization.usedExports = true;
      
      // Configure production optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          // Create a separate chunk for large dependencies
          commons: {
            name: 'commons',
            test: /[\\/]node_modules[\\/](react|react-dom|framer-motion|recharts)[\\/]/,
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
  
  // Enable gzip compression
  compress: true,
  // Configure production source maps
  productionBrowserSourceMaps: false,
};

export default nextConfig;
