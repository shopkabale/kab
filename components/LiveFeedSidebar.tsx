"use client";

import Link from "next/link";
import Image from "next/image";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { optimizeImage } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns"; 

export default function LiveFeedSidebar({ initialProducts }: { initialProducts: any[] }) {
  // Mount the hook with the initial data from the server
  const { liveProducts, isValidating } = useLiveFeed(initialProducts);

  return (
    <div className="sticky top-24 bg-white dark:bg-[#151515] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Happening Now 🔥</h2>
        
        {/* Pulsing indicator when SWR is checking for new items in the background */}
        <div className="flex items-center gap-2">
          {isValidating && <span className="w-2 h-2 rounded-full bg-slate-300 animate-ping"></span>}
          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {liveProducts?.map((p: any) => {
          const optimizedThumb = p.images?.[0] ? optimizeImage(p.images[0]) : null;
          
          // Safely calculate the time ago
          let timeAgo = "Just now";
          try {
            if (p.createdAt?.seconds) {
              // Firebase Timestamp
              timeAgo = formatDistanceToNow(p.createdAt.seconds * 1000, { addSuffix: true });
            } else if (p.createdAt) {
              // Standard Date string or number
              timeAgo = formatDistanceToNow(new Date(p.createdAt), { addSuffix: true });
            }
          } catch (error) {
            console.error("Time parsing error for product:", p.id);
          }

          // Clean up the string (e.g., changes "about 2 hours ago" to "2 hours ago")
          timeAgo = timeAgo.replace('about ', '');

          return (
            <Link 
              href={`/product/${p.publicId || p.id}`} 
              key={`live-${p.id}`} 
              className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors group"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 overflow-hidden relative">
                {optimizedThumb ? (
                  <Image src={optimizedThumb} alt={p.name} fill className="object-cover" sizes="48px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase">No Img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-[#D97706] transition-colors">
                  {p.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  UGX {Number(p.price).toLocaleString()} • {timeAgo}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
