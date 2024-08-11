/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['localhost', 'deetnuts.com', 'cloudinary.com'],
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