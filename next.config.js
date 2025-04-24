/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/motos/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.71',
        port: '3000',
        pathname: '/motos/**',
      }
    ],
  },
  output: 'standalone',
}

module.exports = nextConfig 