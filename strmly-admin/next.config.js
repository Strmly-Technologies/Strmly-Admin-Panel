/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'strmly-videos-dev-mumbai-2.s3.ap-south-1.amazonaws.com',
      'strmly-videos-dev-mumbai-2.s3.amazonaws.com'
    ],
  },
  // Remove the COEP/COOP headers or make them less restrictive
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // Less restrictive
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless', // Less restrictive than require-corp
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig