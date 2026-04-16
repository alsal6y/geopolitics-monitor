/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@luma.gl/webgpu": false,
    };
    return config;
  },
};

export default nextConfig;