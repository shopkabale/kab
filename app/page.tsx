import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import SearchBar from "@/components/SearchBar"; 
import { optimizeImage } from "@/lib/utils";
import UrgentStories from "@/components/UrgentStories";
import PersonalizedFeed from "@/components/PersonalizedFeed";

// 🔥 FORCE DYNAMIC: Ensures random items shuffle on EVERY refresh
export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Fetch products
  const electronics = await getProducts("electronics");
  const agriculture = await getProducts("agriculture");
  const students = await getProducts("student_item");

  const allProducts = [...electronics, ...agriculture, ...students];

  // 2. Real "Just Posted" Sorting
  // Safely grab timestamp whether it's a Firebase Timestamp object or ISO string
  const sortedByDate = [...allProducts].sort((a, b) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
  
  const justPostedProducts = sortedByDate.slice(0, 12);

  // 3. Randomizer for Trending
  const getRandom12 = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random()).slice(0, 12);
  const trendingNow = getRandom12(allProducts);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-24 font-sans selection:bg-[#D97706] selection:text-white">
      
      {/* ========================================== */}
      {/* 1. URGENT STORIES                          */}
      {/* ========================================== */}
      <div className="bg-white dark:bg-[#111] pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 mb-2 flex items-center gap-2 max-w-[1600px] mx-auto">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Hot Deals Near You</h2>
        </div>
        <div className="max-w-[1600px] mx-auto">
          <UrgentStories />
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. SEARCH & INTENT CHIPS                   */}
      {/* ========================================== */}
      <section className="bg-white dark:bg-[#111] px-4 py-6 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <SearchBar />
          <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar items-center justify-start md:justify-center">
            {["🔥 Under 50k", "⚡ Urgent Sales", "📍 Near You", "🆕 Just Posted", "🎓 Campus Deals"].map(tag => (
              <button key={tag} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-xs font-bold whitespace-nowrap text-slate-800 dark:text-slate-200 transition-colors shadow-sm">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 🧩 THE DASHBOARD GRID                      */}
      {/* ========================================== */}
      <div className="max-w-[1600px] mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* ------------------------------------------ */}
        {/* LEFT SIDEBAR: LIVE ACTIVITY FEED           */}
        {/* ------------------------------------------ */}
        <aside className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-24 bg-white dark:bg-[#151515] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Happening Now 🔥</h2>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">LIVE</span>
            </div>
            
            <div className="flex flex-col gap-4">
               {justPostedProducts.slice(0, 8).map((p) => {
                 const optimizedThumb = p.images?.[0] ? optimizeImage(p.images[0]) : null;
                 return (
                   <Link href={`/product/${p.publicId || p.id}`} key={`live-${p.id}`} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors group">
                     <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 overflow-hidden relative">
                       {optimizedThumb && <Image src={optimizedThumb} alt={p.name} fill className="object-cover" sizes="48px" />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-[#D97706] transition-colors">{p.name}</p>
                       <p className="text-xs text-slate-500 truncate">UGX {Number(p.price).toLocaleString()} • Just now</p>
                     </div>
                   </Link>
                 )
               })}
            </div>
          </div>
        </aside>

        {/* Mobile Live Feed Header */}
        <div className="block lg:hidden lg:col-span-12">
           <div className="flex items-center justify-between mb-2 px-2">
             <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white">Happening Now 🔥</h2>
             <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">LIVE</span>
           </div>
        </div>

        {/* ------------------------------------------ */}
        {/* MAIN CONTENT AREA                          */}
        {/* ------------------------------------------ */}
        <main className="lg:col-span-9 space-y-10 md:space-y-14">

          {/* 3. TRENDING (Random on refresh) */}
          <section>
            <ProductSection 
              title="🔥 Trending Now" 
              products={trendingNow} 
            />
          </section>

          {/* 4. SELLER CTA (Clean, No background) */}
          <section className="py-12 md:py-16 text-center border-y border-slate-200 dark:border-slate-800">
            <div className="max-w-xl mx-auto flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tight leading-none text-slate-900 dark:text-white">
                Sell Your Item in <br/> 60 Seconds 🚀
              </h2>
              <p className="text-base md:text-lg font-medium mb-8 text-slate-600 dark:text-slate-400">
                No account needed. Just send a picture to our WhatsApp bot and it goes live instantly.
              </p>
              
              <a
                href="https://wa.me/256740373021?text=Hi%2C%20I%20want%20to%20sell%20an%20item"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#D97706] text-white px-8 py-4 rounded-full font-black text-sm md:text-base flex items-center gap-3 hover:scale-105 active:scale-95 transition-transform shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Start Selling Now
              </a>
              <p className="mt-6 text-xs text-slate-500 font-bold">Need seller support? Email shopkabale@gmail.com</p>
            </div>
          </section>

          {/* 5. JUST POSTED (Real Timestamp Based) */}
          <section>
            <ProductSection 
              title="🆕 Just Posted" 
              products={justPostedProducts} 
            />
          </section>

          {/* 6. PERSONALIZED (Client Side Logic) */}
          <PersonalizedFeed allProducts={allProducts} />

          {/* 7. CATEGORIES (Only 3) */}
          <section className="py-8 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-6">Explore Directory</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { name: "Student Market", link: "student_item" }, 
                { name: "Electronics", link: "electronics" }, 
                { name: "Agriculture", link: "agriculture" }
              ].map((cat) => (
                <Link key={cat.name} href={`/category/${cat.link}`} className="px-5 py-2.5 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-[#D97706] hover:text-[#D97706] transition-colors shadow-sm">
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

// ==========================================
// REUSABLE HIGH-CONVERSION PRODUCT GRID
// ==========================================
export function ProductSection({ title, products, hideTitle }: { title?: string, products: any[], hideTitle?: boolean }) {
  if (!products || products.length === 0) return null;

  // Helper to dynamically check if an item is less than 7 days old
  const checkIsNew = (p: any) => {
    const pDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt || 0).getTime();
    return pDate > 0 && (Date.now() - pDate) < (7 * 24 * 60 * 60 * 1000); 
  };

  return (
    <div className="w-full">
      {!hideTitle && title && (
        <div className="flex items-center justify-between mb-6 px-2 lg:px-0">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h2>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 px-2 lg:px-0">
        {products.map((p) => {
          const optimizedImage = p.images?.[0] ? optimizeImage(p.images[0]) : null;
          const isJustPosted = checkIsNew(p);
          
          return (
            <div key={p.id} className="group flex flex-col bg-white dark:bg-[#151515] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all h-full relative">
              
              <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow">
                {/* Image Area */}
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {optimizedImage ? (
                    <Image 
                      src={optimizedImage} 
                      alt={p.name} 
                      fill 
                      sizes="(max-width: 768px) 50vw, 20vw" 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="m-auto flex items-center justify-center h-full text-[10px] font-bold text-slate-400 uppercase">No Image</div>
                  )}
                  
                  {/* Conditional "Just Posted" Overlay */}
                  {isJustPosted && (
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                       Just Posted
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="p-3 md:p-4 flex flex-col flex-grow">
                  <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight mb-2 group-hover:text-[#D97706] transition-colors">{p.name}</h3>
                  <div className="mt-auto">
                    <span className="text-sm md:text-base font-black text-[#D97706] dark:text-yellow-500">
                      UGX {Number(p.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Bottom Quick Actions */}
              <div className="grid grid-cols-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111]">
                 <a 
                   href={`https://wa.me/256740373021?text=${encodeURIComponent(`Hi! I am interested in this item on Kabale Online: *${p.name}*\n\nProduct ID: [${p.id}]`)}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="col-span-3 py-3 border-r border-slate-200 dark:border-slate-800 bg-white hover:bg-[#25D366] dark:bg-[#151515] text-slate-900 dark:text-white hover:text-white text-xs font-black uppercase flex justify-center items-center gap-2 transition-colors group/wa"
                 >
                   <svg className="w-4 h-4 text-[#25D366] group-hover/wa:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                   </svg>
                   WhatsApp
                 </a>
                 <button className="col-span-1 py-3 bg-white dark:bg-[#151515] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 flex justify-center items-center transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
