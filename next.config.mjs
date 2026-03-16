/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // often needed for basic migrations before setting up image domains
  },
}

export default nextConfig
