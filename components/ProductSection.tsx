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

          return (
            // ✅ Bonus polish: rounded-sm, hover:shadow-md transition-all duration-200
            <div key={p.id} className="group flex flex-col bg-white dark:bg-[#151515] rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 dark:border dark:border-slate-800 h-full relative">

              <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow">
                {/* Image Area: Strict square for uniform alignment */}
                <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  {optimizedImage ? (
                    <Image 
                      src={optimizedImage} 
                      alt={p.name} 
                      fill 
                      sizes="(max-width: 768px) 50vw, 20vw" 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">No Image</div>
                  )}

                  {/* Conditional "Just Posted" Overlay */}
                  {isJustPosted && (
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                       New
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="p-2 sm:p-3 flex flex-col flex-grow bg-white dark:bg-[#151515]">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug mb-1 group-hover:text-[#D97706] transition-colors">{p.name}</h3>
                  <div className="mt-auto pt-1">
                    <span className="text-sm sm:text-base font-black text-[#D97706] dark:text-yellow-500">
                      UGX {Number(p.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Bottom Quick Actions */}
              <div className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111]">
                 <a 
                   href={`https://wa.me/256740373021?text=${encodeURIComponent(`Hi! I am interested in this item on Kabale Online: *${p.name}*\n\nProduct ID: [${p.id}]`)}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="col-span-3 py-2 border-r border-slate-100 dark:border-slate-800 hover:bg-[#25D366] text-slate-900 dark:text-white hover:text-white text-[11px] font-bold uppercase flex justify-center items-center gap-1.5 transition-colors group/wa"
                 >
                   <span>WhatsApp</span>
                 </a>
                 <button className="col-span-1 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 flex justify-center items-center transition-colors">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                   </svg>
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
