import withPWAInit from "next-pwa";
import defaultCache from "next-pwa/cache.js"; 

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  
  // PRODUCTION GRADE CACHING:
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/(res\.cloudinary\.com|lh3\.googleusercontent\.com)\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'persistent-external-images',
        expiration: { maxEntries: 500, maxAgeSeconds: 60 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-data-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 5, 
      },
    },
    ...defaultCache,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, 
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default withPWA(nextConfig);
