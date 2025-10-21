/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Transpile packages that may have ES module issues
  transpilePackages: ['recharts', 'leaflet', 'react-leaflet'],

  // 🔑 Ensure webpack also understands "@/..."
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname)
    };
    return config;
  },

  reactStrictMode: false
};

module.exports = nextConfig;
