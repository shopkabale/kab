"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { optimizeImage } from "@/lib/utils";

const STORY_DURATION = 5000; // 5 seconds per story

export default function UrgentStories() {
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Story Viewer State
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 1. FETCH STORIES
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const q = query(collection(db, "products"), where("isUrgent", "==", true));
        const querySnapshot = await getDocs(q);
        const now = Date.now();
        const activeStories = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(product => product.urgentExpiresAt && product.urgentExpiresAt > now)
          .sort((a, b) => a.urgentExpiresAt - b.urgentExpiresAt);

        setStories(activeStories);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  // 2. AUTO-ADVANCE PROGRESS BAR LOGIC
  useEffect(() => {
    if (activeIndex === null || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Time is up, move to next story
          if (activeIndex < stories.length - 1) {
            setActiveIndex(activeIndex + 1);
            return 0;
          } else {
            // Reached the end, close the viewer
            setActiveIndex(null);
            return 0;
          }
        }
        return prev + (100 / (STORY_DURATION / 50)); // Update every 50ms
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeIndex, isPaused, stories.length]);

  // 3. NAVIGATION CONTROLS
  const handleNext = useCallback(() => {
    if (activeIndex !== null && activeIndex < stories.length - 1) {
      setActiveIndex(activeIndex + 1);
      setProgress(0);
    } else {
      setActiveIndex(null); // Close if it's the last one
    }
  }, [activeIndex, stories.length]);

  const handlePrev = useCallback(() => {
    if (activeIndex !== null && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
      setProgress(0);
    } else {
      setProgress(0); // Restart the first one if we tap back on the first story
    }
  }, [activeIndex]);

  const closeViewer = () => {
    setActiveIndex(null);
    setProgress(0);
  };

  if (loading || stories.length === 0) return null;

  const activeStory = activeIndex !== null ? stories[activeIndex] : null;

  return (
    <>
      {/* ========================================== */}
      {/* 1. THE MAIN PAGE UI (CIRCLES ROW)          */}
      {/* ========================================== */}
      <div className="w-full bg-white pt-6 pb-4 border-b border-slate-100 mb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="animate-pulse text-red-500">🔴</span>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Leaving Town / Urgent Sales
            </h2>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x">
            {stories.map((story, index) => {
              const optimizedImg = story.images?.[0] ? optimizeImage(story.images[0]) : null;
              return (
                <button 
                  key={story.id} 
                  onClick={() => { setActiveIndex(index); setProgress(0); }}
                  className="flex flex-col items-center gap-1 shrink-0 snap-start group outline-none"
                >
                  {/* Instagram-Style Gradient Ring */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 transition-transform group-hover:scale-105 shadow-sm">
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden relative bg-slate-100">
                      {optimizedImg ? (
                        <Image src={optimizedImg} alt={story.name} fill sizes="80px" className="object-cover" />
                      ) : (
                        <span className="text-[10px] absolute inset-0 flex items-center justify-center text-slate-400">No Img</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 truncate w-16 sm:w-20 text-center">
                    {(Number(story.price)/1000).toFixed(0)}k
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. THE FULL-SCREEN STORY VIEWER MODAL      */}
      {/* ========================================== */}
      {activeStory && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col sm:p-4 animate-in fade-in duration-200">
          
          <div className="relative flex-grow sm:rounded-3xl overflow-hidden bg-slate-900 mx-auto w-full max-w-md shadow-2xl flex flex-col">
            
            {/* --- TOP: PROGRESS BARS & SELLER INFO --- */}
            <div className="absolute top-0 left-0 right-0 z-20 px-2 pt-4 sm:pt-6 bg-gradient-to-b from-black/80 to-transparent pb-6">
              
              {/* Progress Bars */}
              <div className="flex gap-1 mb-4">
                {stories.map((s, i) => {
                  const isActive = i === activeIndex;
                  const isPast = i < activeIndex!;
                  return (
                    <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden relative">
                      <div 
                        className="absolute top-0 left-0 h-full bg-white transition-all duration-75 ease-linear"
                        style={{ width: isActive ? `${progress}%` : isPast ? '100%' : '0%' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Seller Header & Close Button */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold text-sm">
                    {activeStory.sellerName ? activeStory.sellerName.charAt(0).toUpperCase() : "S"}
                  </div>
                  <div className="text-white drop-shadow-md">
                    <p className="text-sm font-bold">{activeStory.sellerName || "Verified Seller"}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/80 font-medium">Urgent Sale</p>
                  </div>
                </div>
                <button onClick={closeViewer} className="text-white p-2 drop-shadow-md">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* --- MIDDLE: IMAGE & TAP ZONES --- */}
            <div 
              className="flex-grow relative bg-slate-800"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {activeStory.images?.[0] && (
                <Image 
                  src={activeStory.images[0]} 
                  alt={activeStory.name} 
                  fill 
                  className="object-cover"
                  priority
                />
              )}

              {/* Tap Left (Go Back) - Takes up 30% of screen */}
              <div onClick={handlePrev} className="absolute top-0 left-0 w-[30%] h-full z-10 cursor-pointer" />
              
              {/* Tap Right (Go Next) - Takes up 70% of screen */}
              <div onClick={handleNext} className="absolute top-0 right-0 w-[70%] h-full z-10 cursor-pointer" />
            </div>

            {/* --- BOTTOM: PRODUCT DETAILS & CTA --- */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
              <h2 className="text-2xl font-black text-white mb-1 drop-shadow-lg line-clamp-2">
                {activeStory.name}
              </h2>
              <p className="text-3xl font-black text-[#D97706] mb-4 drop-shadow-md">
                UGX {Number(activeStory.price).toLocaleString()}
              </p>
              
              <button 
                onClick={() => router.push(`/product/${activeStory.publicId || activeStory.id}`)}
                className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-lg hover:bg-slate-100 transition-colors shadow-xl flex flex-col items-center justify-center gap-0.5 active:scale-95"
              >
                <span className="animate-bounce">↑</span>
                Tap to View & Make Offer
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
