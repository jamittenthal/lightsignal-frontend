/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

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
