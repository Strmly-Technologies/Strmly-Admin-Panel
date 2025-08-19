/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add server-side redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        // Make this a temporary redirect so browser doesn't cache it
        // The client-side logic will redirect to /login if needed
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
