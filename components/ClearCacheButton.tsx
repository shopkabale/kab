'use client'; // Required for Next.js App Router to use browser APIs

import { useState } from 'react';

export default function ClearCacheButton() {
  // Explicitly type the state as a boolean
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Explicitly type the function return as a Promise
  const handleClearCache = async (): Promise<void> => {
    setIsClearing(true);

    try {
      // 1. Wipe out all the massive caches we defined in next.config
      if ('caches' in window) {
        const cacheNames: string[] = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // 2. Kill the Service Worker so it doesn't intercept the next reload
      if ('serviceWorker' in navigator) {
        const registrations: ServiceWorkerRegistration[] = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 3. Force a hard reload from the network
      window.location.reload(); 
      
    } catch (error) {
      // TS treats catch errors as 'unknown', which console.error handles perfectly
      console.error('Failed to clear cache:', error);
      setIsClearing(false); // Only reset if it fails, otherwise the page reloads anyway
    }
  };

  return (
    <button
      onClick={handleClearCache}
      disabled={isClearing}
      className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
    >
      {isClearing ? 'Freeing up space...' : 'Clear App Data & Cache'}
    </button>
  );
}
