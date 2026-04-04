import Link from "next/link";
import Image from "next/image";
import { optimizeImage } from "@/lib/utils";

export default function ProductSection({ title, products, hideTitle }: { title?: string, products: any[], hideTitle?: boolean }) {
  if (!products || products.length === 0) return null;

  // Helper to dynamically check if an item is less than 7 days old
  const checkIsNew = (p: any) => {
    const pDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt || 0).getTime();
    return pDate > 0 && (Date.now() - pDate) < (7 * 24 * 60 * 60 * 1000); 
  };

  return (
    // ✅ Let parent control spacing (this is key)
    <div className="w-full">

      {!hideTitle && title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h2>
        </div>
      )}

      {/* ✅ Perfect consistent Jumia gap */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {products.map((p) => {
          const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
          const isJustPosted = checkIsNew(p);
          const isSold = p.status === "sold";

          // Badge Logic
          const isApproved = p.isApprovedQuality;
          const isOfficial = p.isOfficialStore || p.isAdminUpload;

          // Parse stock safely (defaults to 1 if not set)
          const currentStock = parseInt(p.stock?.toString() || "1", 10);
          
          // Check if title is short enough to fit on one line (approx 24 characters)
          const titleStr = p.title || p.name || 'Product';
          const isShortTitle = titleStr.length <= 24;

          return (
            // Added opacity-80 if sold to subtly fade the card
            <div key={p.id} className={`group flex flex-col bg-white dark:bg-[#151515] rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 dark:border dark:border-slate-800 h-full relative ${isSold ? 'opacity-80 grayscale-[20%]' : ''}`}>

              <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow relative pointer-events-auto outline-none">
                {/* Image Area: Strict square for uniform alignment */}
                <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  {optimizedImage ? (
                    <Image 
                      src={optimizedImage} 
                      alt={titleStr} 
                      fill 
                      sizes="(max-width: 768px) 50vw, 20vw" 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">No Image</div>
                  )}

                  {/* 🚫 SOLD OUT OVERLAY (Takes priority over other badges visually) */}
                  {isSold && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[2px]">
                       <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-lg transform -rotate-6">
                         Sold Out
                       </span>
                    </div>
                  )}

                  {/* Conditional "Just Posted" Overlay */}
                  {!isSold && isJustPosted && (
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 z-10">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                       New
                    </div>
                  )}

                  {/* Trust Badges Overlay (Sitting EXACTLY at the bottom left edge of the image container) */}
                  {!isSold && isApproved ? (
                    <div className="absolute bottom-0 left-0 bg-emerald-600/95 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 leading-none rounded-tr-sm flex items-center shadow-sm z-10 tracking-widest uppercase">
                       Approved Quality
                    </div>
                  ) : !isSold && isOfficial ? (
                    <div className="absolute bottom-0 left-0 bg-[#D97706]/95 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 leading-none rounded-tr-sm flex items-center shadow-sm z-10 tracking-widest uppercase">
                       Official Product
                    </div>
                  ) : null}
                </div>

                {/* Details Area */}
                <div className="p-2 sm:p-3 flex flex-col flex-grow bg-white dark:bg-[#151515]">
                  {/* TITLE AREA (Fixed height, fills gap if short) */}
                  <div className="h-[36px] sm:h-[42px] mb-1 flex flex-col justify-start">
                    <h3 className={`text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 leading-snug transition-colors duration-200 group-hover:text-[#D97706] dark:group-hover:text-[#D97706] ${isShortTitle ? 'line-clamp-1' : 'line-clamp-2'}`}>
                      {titleStr}
                    </h3>
                    {/* Short Title Filler: Delivery Notice */}
                    {!isSold && isShortTitle && (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold mt-0.5 flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                        Ready for delivery
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-1 flex flex-col">
                    {/* BOLD BLACK PRICE (Turns Orange on hover) */}
                    <span className={`text-sm sm:text-base font-black transition-colors duration-200 ${isSold ? 'text-slate-500' : 'text-black dark:text-white group-hover:text-[#D97706] dark:group-hover:text-[#D97706]'}`}>
                      UGX {Number(p.price).toLocaleString()}
                    </span>

                    {/* TRAFFIC LIGHT STOCK INDICATOR */}
                    {!isSold && (
                      <div className="mt-0.5">
                        {currentStock >= 6 && (
                          <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-bold">
                            In Stock (6+)
                          </span>
                        )}
                        {currentStock >= 3 && currentStock <= 5 && (
                          <span className="text-amber-500 dark:text-amber-400 text-[10px] font-bold">
                            Only {currentStock} left
                          </span>
                        )}
                        {currentStock >= 1 && currentStock <= 2 && (
                          <span className="text-red-500 dark:text-red-400 text-[10px] font-bold">
                            Only {currentStock} left
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Bottom Quick Actions (FULL WIDTH CTA) */}
              <div className="border-t border-slate-100 dark:border-slate-800 bg-gray-50 dark:bg-[#1a1a1a]">
                 {isSold ? (
                   <div className="w-full py-2 px-2 sm:px-3 text-slate-400 text-[11px] font-bold uppercase flex justify-center items-center cursor-not-allowed">
                     Unavailable
                   </div>
                 ) : (
                   <a 
                     href={`https://wa.me/256740373021?text=${encodeURIComponent(`Hi! I am interested in this item on Kabale Online: *${titleStr}*\n\nProduct ID: [${p.id}]`)}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-full py-2.5 px-2 sm:px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-[11px] font-black uppercase flex justify-center items-center gap-2 transition-colors duration-200 outline-none group-hover:text-[#D97706] dark:group-hover:text-[#D97706]"
                   >
                     <svg className="w-4 h-4 fill-current text-[#25D366]" viewBox="0 0 24 24">
                       <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.012c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                     </svg>
                     <span>Chat with Seller</span>
                   </a>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
