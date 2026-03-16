"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { optimizeImage } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

const STORY_DURATION = 7000; // 7 seconds per story

// --- HELPER: WHATSAPP NUMBER STABILIZATION ---
const formatWhatsAppNumber = (phone: string) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, ""); // Strip non-digits
  if (cleaned.startsWith("0")) {
    return "256" + cleaned.substring(1); // Auto-format Ugandan numbers
  }
  return cleaned;
};

export default function UrgentStories() {
  const router = useRouter();
  const { user } = useAuth();

  const [stories, setStories] = useState<any[]>([]);
  const [viewedStoriesMap, setViewedStoriesMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Story Viewer Modal State
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Swipe gesture tracking
  const touchStartY = useRef<number>(0);

  // --- HELPER: GET TIME LEFT ---
  const getTimeLeft = (expiry: number) => {
    const diff = expiry - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  // ==========================================
  // 1. DATA FETCHING & STABLE SORTING
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const now = Date.now();
        const productsQ = query(collection(db, "products"), where("isUrgent", "==", true));
        const querySnapshot = await getDocs(productsQ);
        const productsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(product => product.urgentExpiresAt && product.urgentExpiresAt > now)
          .sort((a, b) => a.urgentExpiresAt - b.urgentExpiresAt);

        let fetchedViewedMap: Record<string, number> = {};
        if (user) {
          const viewedRef = doc(db, "users", user.id, "system", "viewed_stories");
          const viewedSnap = await getDoc(viewedRef);

          if (viewedSnap.exists()) {
            const data = viewedSnap.data().viewedStories || {};
            fetchedViewedMap = Object.fromEntries(
              Object.entries(data).filter(([_, expiry]) => (expiry as number) > now)
            ) as Record<string, number>;
          }
        }

        setViewedStoriesMap(fetchedViewedMap);
        const unviewed = productsData.filter(s => !fetchedViewedMap[s.id]);
        const viewed = productsData.filter(s => fetchedViewedMap[s.id]);
        setStories([...unviewed, ...viewed]);

      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const activeStory = activeIndex !== null ? stories[activeIndex] : null;

  // ==========================================
  // 2. VIEW TRACKING
  // ==========================================
  useEffect(() => {
    if (!activeStory) return;

    const incrementGlobalViews = async () => {
      try {
        setStories(prevStories => prevStories.map(s => 
          s.id === activeStory.id ? { ...s, storyViews: (s.storyViews || 0) + 1 } : s
        ));
        const productRef = doc(db, "products", activeStory.id);
        await updateDoc(productRef, { storyViews: increment(1) });
      } catch (e) {
        console.error("Failed to increment views:", e);
      }
    };

    incrementGlobalViews();

    if (!viewedStoriesMap[activeStory.id]) {
      const newMap = { ...viewedStoriesMap, [activeStory.id]: activeStory.urgentExpiresAt };
      setViewedStoriesMap(newMap);

      if (user) {
        const viewedRef = doc(db, "users", user.id, "system", "viewed_stories");
        setDoc(viewedRef, { viewedStories: newMap, lastUpdated: serverTimestamp() }, { merge: true })
          .catch(e => console.error("Failed to sync views:", e));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStory?.id]);

  // ==========================================
  // 3. AUTO-ADVANCE LOGIC
  // ==========================================
  useEffect(() => {
    if (activeIndex === null || isPaused) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeIndex < stories.length - 1) {
            setActiveIndex(activeIndex + 1);
            return 0;
          } else {
            setActiveIndex(null); // Close on last story instead of looping infinitely
            return 0;
          }
        }
        return prev + (100 / (STORY_DURATION / 50));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [activeIndex, isPaused, stories.length]);

  const handleNext = useCallback(() => {
    if (activeIndex !== null) {
      if (activeIndex < stories.length - 1) {
        setActiveIndex(activeIndex + 1);
        setProgress(0);
      } else {
        setActiveIndex(null); // Close if tapping next on the last story
      }
    }
  }, [activeIndex, stories.length]);

  const handlePrev = useCallback(() => {
    if (activeIndex !== null) {
      setActiveIndex(activeIndex > 0 ? activeIndex - 1 : 0);
      setProgress(0);
    }
  }, [activeIndex]);

  // ==========================================
  // 4. ACTION HANDLERS
  // ==========================================
  const handleWhatsApp = () => {
    if (!activeStory) return;
    const cleanPhone = formatWhatsAppNumber(activeStory.sellerPhone);
    if (!cleanPhone) {
      alert("Seller contact is unavailable.");
      return;
    }
    const message = `Hi, I saw your urgent story for the ${activeStory.name}. Is it still available?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleShare = async () => {
    if (!activeStory) return;
    const shareData = {
      title: "Urgent Sale!",
      text: `Check out this urgent deal: ${activeStory.name} for UGX ${(Number(activeStory.price)/1000).toFixed(0)}k!`,
      url: `${window.location.origin}/product/${activeStory.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert("Link copied to clipboard!");
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;

    if (deltaY > 100) {
      // Swiped down significantly, close modal
      setActiveIndex(null);
      setProgress(0);
    }
    setIsPaused(false);
  };

  if (loading || stories.length === 0) return null;

  return (
    <>
      {/* 1. HOMEPAGE ROW */}
      <div className="w-full pt-4 pb-2 mb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="animate-pulse text-red-500">🔴</span>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Urgent Local Sales
            </h2>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x">
            {stories.map((story, index) => (
              <button 
                key={story.id}
                onClick={() => { setActiveIndex(index); setProgress(0); }}
                className="flex flex-col items-center gap-1.5 shrink-0 snap-start outline-none group"
              >
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] transition-transform group-hover:scale-105 shadow-sm ${
                  viewedStoriesMap[story.id] 
                    ? "bg-slate-300" 
                    : "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600"
                }`}>
                  <div className="w-full h-full rounded-full border-[2.5px] border-transparent overflow-hidden relative bg-slate-100">
                    {story.images?.[0] ? (
                      <Image src={optimizeImage(story.images[0])} alt={story.name || "Story"} fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="text-[10px] absolute inset-0 flex items-center justify-center text-slate-400 font-bold">No Img</span>
                    )}
                  </div>
                </div>
                <span className={`text-[11px] sm:text-xs font-bold truncate w-16 sm:w-20 text-center ${
                  viewedStoriesMap[story.id] ? "text-slate-500 font-medium" : "text-slate-900"
                }`}>
                  UGX {(Number(story.price)/1000).toFixed(0)}k
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. THE STORY VIEWER MODAL */}
      {activeStory && (
        <div className="fixed inset-0 z-[100] bg-black/95 sm:bg-black/80 sm:backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="relative w-full max-w-md h-full sm:h-[90vh] flex flex-col overflow-hidden sm:rounded-[2rem] shadow-2xl bg-black">

            {/* Top UI */}
            <div className="absolute top-0 w-full z-30 p-4 pt-6 bg-gradient-to-b from-black/90 to-transparent pb-10 transition-opacity duration-200" style={{ opacity: isPaused ? 0 : 1 }}>
              <div className="flex gap-1 mb-4">
                {stories.map((_, i) => (
                  <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-75 ease-linear"
                      style={{ width: i === activeIndex ? `${progress}%` : i < activeIndex! ? '100%' : '0%' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-white px-1">
                <div className="flex items-center gap-2.5">
                   <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center font-bold text-lg border border-white/20">
                     {activeStory.sellerName?.[0]?.toUpperCase() || "S"}
                   </div>
                   <div>
                     <p className="text-sm font-bold shadow-sm">{activeStory.sellerName || "Local Seller"}</p>
                     <p className="text-[10px] text-amber-400 font-bold tracking-wide uppercase mt-0.5">
                       ⏳ Ends in {getTimeLeft(activeStory.urgentExpiresAt)}
                     </p>
                   </div>
                </div>
                <button onClick={() => { setActiveIndex(null); setProgress(0); }} className="text-white/70 hover:text-white p-2 active:scale-95">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Content & Tap/Swipe Zones */}
            <div 
              className="flex-grow relative bg-black flex items-center" 
              onMouseDown={() => setIsPaused(true)} 
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {activeStory.images?.[0] && (
                <Image src={activeStory.images[0]} alt={activeStory.name} fill className="object-contain" priority sizes="(max-width: 768px) 100vw, 400px" />
              )}
              {/* Tap zones for navigation (only active if not swiping down significantly) */}
              <div onClick={handlePrev} className="absolute left-0 w-1/3 h-full z-10 cursor-pointer" aria-label="Previous" />
              <div onClick={handleNext} className="absolute right-0 w-2/3 h-full z-10 cursor-pointer" aria-label="Next" />
            </div>

            {/* Bottom UI */}
            <div className="absolute bottom-0 w-full z-30 p-5 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-16 transition-opacity duration-200" style={{ opacity: isPaused ? 0 : 1 }}>
              <div className="mb-5">
                <h3 className="text-2xl font-black text-white leading-tight mb-1 drop-shadow-md line-clamp-2">{activeStory.name}</h3>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black text-amber-500 drop-shadow-md">UGX {Number(activeStory.price).toLocaleString()}</p>
                </div>
                <p className="text-white/80 text-xs font-medium mt-2 flex items-center gap-1.5">
                  <span className="text-base">👀</span> {activeStory.storyViews || 1} people viewed this
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  Ask Seller
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => router.push(`/product/${activeStory.id}`)}
                    className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white py-3.5 rounded-2xl font-bold active:scale-95 transition-transform"
                  >
                    View Full Details
                  </button>
                  <button 
                    onClick={handleShare}
                    className="w-14 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Share story"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
