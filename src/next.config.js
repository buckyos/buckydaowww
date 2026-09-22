/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cyfs.s3.us-west-1.amazonaws.com',
      },
    ],
    domains: ['avatars.githubusercontent.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (process.env.SOURCEDAO_BACKEND_URL || process.env.NEXT_PUBLIC_SERVER || 'http://127.0.0.1:3333') + '/:path*',
      },
    ]
  },
}
