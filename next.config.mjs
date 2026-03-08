import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Won't annoy you with caching while coding
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // THE CHEAT CODE: Saves your Vercel limits!
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Required for Google Sign-In profile pictures
      },
    ],
  },
};

export default withPWA(nextConfig);
