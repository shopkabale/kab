// next.config.mjs
import withPWAInit from "next-pwa";
import defaultCache from "next-pwa/cache.js";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline',
  },

  // PRODUCTION GRADE CACHING:
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'html-cache',
        networkTimeoutSeconds: 3,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
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
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-data-cache',
        expiration: { 
          maxEntries: 200, 
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        },
        cacheableResponse: { statuses: [0, 200] },
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
