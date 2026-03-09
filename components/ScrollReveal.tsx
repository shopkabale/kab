"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollReveal({ 
  children, 
  index = 0 
}: { 
  children: React.ReactNode;
  index?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the element comes into view, trigger the animation
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Disconnect so it only animates once
        }
      },
      { threshold: 0.1 } // Triggers when 10% of the item is visible
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      // Start slightly pushed down (translate-y-8) and invisible (opacity-0)
      // When visible, smoothly move to original position
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      // Multiply the index by 75ms to create a "staggered" domino effect
      style={{ transitionDelay: `${index * 75}ms` }}
    >
      {children}
    </div>
  );
}
