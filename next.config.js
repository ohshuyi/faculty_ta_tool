/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: 'build',
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
};

// module.exports = nextConfig;
export default nextConfig;
