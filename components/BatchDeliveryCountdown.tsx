'use client';
import { useState, useEffect } from 'react';

export default function BatchDeliveryCountdown() {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);
  const [isOffHours, setIsOffHours] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Prevents hydration mismatch between server and client
    
    const calculateBatch = () => {
      const now = new Date();
      const hour = now.getHours();

      // Active hours: Between 8:00 AM and 3:59 PM
      if (hour >= 8 && hour < 16) {
        setIsOffHours(false);
        // Find the next even hour for the batch (10, 12, 14, 16)
        const nextBatchHour = hour % 2 === 0 ? hour + 2 : hour + 1;
        const target = new Date();
        target.setHours(nextBatchHour, 0, 0, 0);

        const diffMs = target.getTime() - now.getTime();
        const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diffMs / (1000 * 60)) % 60);
        const s = Math.floor((diffMs / 1000) % 60);

        setTimeLeft({ h, m, s });
      } else {
        // Off-hours: After 4:00 PM or before 8:00 AM
        setIsOffHours(true);
        setTimeLeft(null);
      }
    };

    calculateBatch(); // Run immediately
    const interval = setInterval(calculateBatch, 1000); // Update every SECOND
    
    return () => clearInterval(interval);
  }, []);

  // Don't render anything until the client has mounted to prevent React errors
  if (!mounted) return null;

  if (isOffHours) {
    return (
      <div className="bg-[#fffdfa] border border-[#FF6A00] rounded-lg p-3 text-sm font-medium text-[#1A1A1A] mb-4 shadow-sm">
        📦 Order now for first-round delivery tomorrow morning.
      </div>
    );
  }

  if (!timeLeft) return null;

  const { h, m, s } = timeLeft;
  // Lean formatting: hides hours if less than 1 hour remains
  const timeString = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;

    return (
    <div className="bg-[#fffdfa] border border-[#FF6A00] rounded-lg p-3 text-sm font-medium text-[#1A1A1A] mb-4 shadow-sm">
      ⚡ Order within <b className="text-red-600 text-base">{timeString}</b> to catch the next delivery round.
    </div>
  );

}
