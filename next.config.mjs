/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['localhost', 'your-production-domain.com'],
    },
    webpack(config) {
      config.module.rules.push({
        test: /\.woff2$/,
        type: 'asset/resource',
      });
      return config;
    },
  };
  
export default nextConfig;