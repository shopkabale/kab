"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { optimizeImage } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider"; // IMPORT YOUR AUTH PROVIDER

const STORY_DURATION = 7000; // 7 seconds per story

export default function UrgentStories() {
  const router = useRouter();
  const { user } = useAuth(); // GET THE USER TO TRACK VIEWED STORIES

  const [activeStories, setActiveStories] = useState<any[]>([]); // To store un-expired urgent products
  const [viewedStoryIds, setViewedStoryIds] = useState<string[]>([]); // Stories the user has viewed
  const [loading, setLoading] = useState(true);

  // Story Viewer Modal State
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // ==========================================
  // 1. DATA FETCHING (PRODUCTS & VIEWED LIST)
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const now = Date.now();
        
        // A. Fetch urgent products
        const productsQ = query(collection(db, "products"), where("isUrgent", "==", true));
        const querySnapshot = await getDocs(productsQ);
        const productsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any)) // 🔥 Added 'as any' to fix TypeScript build error
          .filter(product => product.urgentExpiresAt && product.urgentExpiresAt > now)
          .sort((a, b) => a.urgentExpiresAt - b.urgentExpiresAt);

        setActiveStories(productsData);

        // B. Fetch viewed stories if user is logged in
        if (user) {
          const viewedRef = doc(db, "users", user.id, "system", "viewed_stories");
          const viewedSnap = await getDoc(viewedRef);
          
          if (viewedSnap.exists()) {
            const data = viewedSnap.data();
            const viewedIds = data.viewedIds || [];
            // Optional: Clean up ancient viewedIds here in a real app to save space
            setViewedStoryIds(viewedIds);
          }
        }
      } catch (error) {
        console.error("Error fetching stories data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // ==========================================
  // 2. INTELLIGENT UNVIEWED-FIRST SORTING
  // ==========================================
  // We compute this sorted list memoized so it only changes when the data does.
  // It puts unwatched stories first (sorted by expiry), then watched stories.
  const stories = useMemo(() => {
    // If no user or viewed history, use the natural fetch sorting (by urgency expiry)
    if (!user || viewedStoryIds.length === 0) return activeStories;

    const unviewed = activeStories.filter(s => !viewedStoryIds.includes(s.id));
    const viewed = activeStories.filter(s => viewedStoryIds.includes(s.id));

    return [...unviewed, ...viewed];
  }, [activeStories, user, viewedStoryIds]);


  // ==========================================
  // 3. AUTO-ADVANCE LOOPING LOGIC
  // ==========================================
  useEffect(() => {
    if (activeIndex === null || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Time is up for this story
          if (activeIndex < stories.length - 1) {
            // Move to next story
            setActiveIndex(activeIndex + 1);
            return 0;
          } else {
            // Reached the very end, loop back to the first story! 🔄
            setActiveIndex(0); 
            return 0;
          }
        }
        return prev + (100 / (STORY_DURATION / 50)); // Smooth update every 50ms
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeIndex, isPaused, stories.length]);


  // ==========================================
  // 4. NAVIGATION CONTROLS (TAP LEFT/RIGHT)
  // ==========================================
  const handleNext = useCallback(() => {
    if (activeIndex !== null) {
      if (activeIndex < stories.length - 1) {
        setActiveIndex(activeIndex + 1);
      } else {
        // At the last story, tapping right loops to the first one
        setActiveIndex(0);
      }
      setProgress(0);
    }
  }, [activeIndex, stories.length]);

  const handlePrev = useCallback(() => {
    if (activeIndex !== null) {
      if (activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      } else {
        // At the first story, tapping left loops to the last one
        setActiveIndex(stories.length - 1);
      }
      setProgress(0);
    }
  }, [activeIndex, stories.length]);

  const closeViewer = () => {
    setActiveIndex(null);
    setProgress(0);
  };

  // Function to save viewed status to Firestore
  const markAsViewed = async (storyId: string) => {
    if (!user || viewedStoryIds.includes(storyId)) return;

    const newViewedIds = [...viewedStoryIds, storyId];
    setViewedStoryIds(newViewedIds); // Update local state for immediate gray ring

    try {
      const viewedRef = doc(db, "users", user.id, "system", "viewed_stories");
      await setDoc(viewedRef, {
        viewedIds: newViewedIds,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("Failed to mark story as viewed in Firestore", e);
    }
  };

  if (loading || activeStories.length === 0) return null;

  const activeStory = activeIndex !== null ? stories[activeIndex] : null;

  // Find the index of the first viewed item for placing the | separator
  const firstViewedIndex = stories.findIndex(s => user && viewedStoryIds.includes(s.id));

  return (
    <>
      {/* ========================================== */}
      {/* 1. THE CIRCLES ROW ON HOMEPAGE             */}
      {/* ========================================== */}
      <div className="w-full bg-white pt-6 pb-4 border-b border-slate-100 mb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="flex items-center gap-2 mb-3">
            <span className="animate-pulse text-red-500">🔴</span>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Urgent Local Sales (24h)
            </h2>
          </div>

          {/* Scollable Row */}
          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x">
            
            {stories.map((story, index) => {
              const optimizedImg = story.images?.[0] ? optimizeImage(story.images[0]) : null;
              
              // 🔥 Check if this item is watched to change ring color
              const isWatched = user && viewedStoryIds.includes(story.id);

              return (
                <div key={story.id} className="flex shrink-0 snap-start items-center">
                  
                  {/* Circle Item */}
                  <button 
                    onClick={() => { setActiveIndex(index); setProgress(0); }}
                    className="flex flex-col items-center gap-1 group outline-none focus:ring-2 focus:ring-[#D97706] rounded-full"
                  >
                    {/* Ring: Conditional Gradient or Gray */}
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] transition-transform group-hover:scale-105 shadow-md flex items-center justify-center ${
                      isWatched
                        ? "bg-slate-300" // Gray ring for viewed
                        : "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600" // Rainbow ring for unviewed
                    }`}>
                      <div className="w-full h-full rounded-full border-[2.5px] border-white overflow-hidden relative bg-slate-100">
                        {optimizedImg ? (
                          <Image src={optimizedImg} alt={story.name} fill sizes="80px" className="object-cover" />
                        ) : (
                          <span className="text-[10px] absolute inset-0 flex items-center justify-center text-slate-400 font-bold">No Img</span>
                        )}
                      </div>
                    </div>
                    {/* Price */}
                    <span className={`text-[11px] font-bold text-slate-900 truncate w-16 sm:w-20 text-center ${isWatched ? "text-slate-500 font-medium" : ""}`}>
                      UGX {(Number(story.price)/1000).toFixed(0)}k
                    </span>
                  </button>

                  {/* 🔥 THE INTENTIONAL | SEPARATOR BETWEEN UNVIEWED AND VIEWED 🔥 */}
                  {user && firstViewedIndex !== -1 && index === firstViewedIndex - 1 && index !== stories.length - 1 && (
                    <span className="shrink-0 self-center mx-1.5 text-3xl font-black text-slate-300 pointer-events-none">|</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. THE STORY VIEWER MODAL (NEW DESIGN)     */}
      {/* ========================================== */}
      {activeStory && (
        // Changed overlay to transparent with slight blur
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col sm:p-4 animate-in fade-in duration-300">
          
          {/* Main Card: Removed background, added shadow */}
          <div className="relative flex-grow sm:rounded-3xl overflow-hidden mx-auto w-full max-w-md shadow-3xl flex flex-col">
            
            {/* --- TOP: Progress Bars & Seller (Gradients kept for readability) --- */}
            <div className="absolute top-0 left-0 right-0 z-20 px-2 pt-4 sm:pt-6 bg-gradient-to-b from-black/85 to-transparent pb-10">
              
              {/* Bars */}
              <div className="flex gap-1 mb-5">
                {stories.map((s, i) => {
                  const isActive = i === activeIndex;
                  const isPast = i < activeIndex!;
                  return (
                    <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden relative">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-75 ease-linear ${
                          user && viewedStoryIds.includes(s.id) ? "bg-white/60" : "bg-white"
                        }`}
                        style={{ width: isActive ? `${progress}%` : isPast ? '100%' : '0%' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#D97706] text-white flex items-center justify-center font-black text-base shadow-md border-2 border-white/50">
                    {activeStory.sellerName ? activeStory.sellerName.charAt(0).toUpperCase() : "S"}
                  </div>
                  <div className="text-white drop-shadow-lg">
                    <p className="text-sm font-extrabold flex items-center gap-1.5">
                      {activeStory.sellerName || "Kabale Seller"}
                      {/* Optional: Add verified student badge here if you build it */}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/90 font-bold bg-white/10 px-1.5 py-0.5 rounded">Urgent Sale</p>
                  </div>
                </div>
                <button onClick={closeViewer} className="text-white/80 p-2 hover:text-white transition-colors active:scale-95">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* --- MIDDLE: IMAGE & TAP ZONES --- */}
            <div 
              className="flex-grow relative bg-transparent" // Transparent image background
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => { setIsPaused(false); markAsViewed(activeStory.id); }} // Mark watched on release
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => { setIsPaused(false); markAsViewed(activeStory.id); }} // Mark watched on release
            >
              {activeStory.images?.[0] && (
                <Image 
                  src={activeStory.images[0]} 
                  alt={activeStory.name} 
                  fill 
                  priority
                  sizes="100vw"
                  className="object-contain" // 🔥 Use object-contain to avoid zooming/cropping
                />
              )}

              {/* Invisible Tap Controls */}
              <div onClick={() => { handlePrev(); markAsViewed(activeStory.id); }} className="absolute top-0 left-0 w-[35%] h-full z-10 cursor-pointer" aria-label="Previous story" />
              <div onClick={() => { handleNext(); markAsViewed(activeStory.id); }} className="absolute top-0 right-0 w-[65%] h-full z-10 cursor-pointer" aria-label="Next story" />
            </div>

            {/* --- BOTTOM: PRODUCT DETAILS & CTA (Gradients kept for readability) --- */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8 bg-gradient-to-t from-black/95 via-black/85 to-transparent pt-16">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1.5 drop-shadow-xl line-clamp-2 leading-tight">
                {activeStory.name}
              </h2>
              <p className="text-3xl sm:text-4xl font-black text-[#D97706] mb-6 drop-shadow-lg">
                UGX {Number(activeStory.price).toLocaleString()}
              </p>
              
              {/* CLEAN CTA: No bouncing arrow */}
              <button 
                onClick={() => router.push(`/product/${activeStory.publicId || activeStory.id}`)}
                className="w-full bg-white text-slate-950 py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl hover:bg-slate-100 transition-colors shadow-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95"
              >
                Tap to View & Make Offer
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
