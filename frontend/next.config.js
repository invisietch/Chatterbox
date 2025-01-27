/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during the build process
  },
};

module.exports = nextConfig;
