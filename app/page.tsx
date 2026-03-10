import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import { adminDb } from "@/lib/firebase/admin";
import HeroCarousel from "@/components/HeroCarousel";
import QuickCartButton from "@/components/QuickCartButton"; 
import ScrollReveal from "@/components/ScrollReveal"; // Added the animation wrapper

// 🔥 24-HOUR RANDOMIZER (86400 seconds = 24 hours)
export const revalidate = 86400;

export default async function Home() {
  // 1. Fetch products
  const electronics = await getProducts("electronics");
  const agriculture = await getProducts("agriculture");
  const students = await getProducts("student_item");

  const allProducts = [...electronics, ...agriculture, ...students];

  // 2. Helper to randomly pick 12
  const getRandom12 = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random()).slice(0, 12);

  const mixedFeatured = getRandom12(allProducts);
  const electronicsFeatured = getRandom12(electronics);
  const studentsFeatured = getRandom12(students);

  // 3. Fetch latest blogs
  let latestBlogs: any[] = [];
  try {
    const blogSnap = await adminDb.collection("blog_posts").orderBy("publishedAt", "desc").limit(3).get();
    latestBlogs = blogSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) { 
    console.error("Failed to load blogs on homepage", error); 
  }

  return (
    <div className="flex flex-col pb-16 md:pb-24 bg-white dark:bg-[#0a0a0a] overflow-hidden">
      
      {/* ============================== */}
      {/* 1. HERO & CATEGORIES           */}
      {/* ============================== */}
      <section className="pt-6">
        
        <HeroCarousel />

        <div className="flex overflow-x-auto gap-6 py-6 no-scrollbar items-center justify-start md:justify-center px-4">
          {[
            { name: "Electronics", icon: "💻", href: "/category/electronics", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { name: "Agriculture", icon: "🌾", href: "/category/agriculture", bg: "bg-green-50 dark:bg-green-900/20" },
            { name: "Student Market", icon: "📚", href: "/category/student_item", bg: "bg-amber-50 dark:bg-amber-900/20" },
          ].map((cat) => (
            <Link key={cat.name} href={cat.href} className="flex flex-col items-center min-w-[90px] gap-3 group">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl shadow-sm border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition-transform ${cat.bg}`}>
                {cat.icon}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter text-center group-hover:text-[#D97706]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-2 w-full bg-slate-50 dark:bg-[#111] my-8 md:my-12 border-y border-slate-100 dark:border-slate-800/50"></div>

      {/* ============================== */}
      {/* 2. AVAILABLE ITEMS (MIXED)     */}
      {/* ============================== */}
      <section>
        <ProductSection 
          title="Available Items" 
          products={mixedFeatured} 
          linkHref="/products" 
          linkText="View All Items" 
        />
      </section>

      {/* DIVIDER */}
      <div className="h-2 w-full bg-slate-50 dark:bg-[#111] my-8 md:my-12 border-y border-slate-100 dark:border-slate-800/50"></div>

      {/* ============================== */}
      {/* 3. ELECTRONICS SECTION         */}
      {/* ============================== */}
      <section>
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-6 sm:px-12 mb-8 sm:rounded-2xl bg-slate-900 py-12 md:py-16 text-white relative overflow-hidden flex flex-col justify-center shadow-lg">
          <h2 className="text-2xl md:text-4xl font-black mb-3 z-10 relative leading-tight">Quality Gadgets <br/>& Electronics</h2>
          <Link href="/category/electronics" className="bg-[#D97706] text-white px-8 py-3 rounded-full font-bold text-xs md:text-sm w-fit uppercase z-10 shadow-md hover:bg-amber-600 transition-colors mt-2">
            Shop Electronics
          </Link>
          <span className="absolute right-[-10px] bottom-[-20px] text-8xl md:text-[150px] opacity-10">💻</span>
        </div>
        
        <ProductSection 
          products={electronicsFeatured} 
          linkHref="/category/electronics" 
          linkText="View All Electronics" 
        />
      </section>

      {/* DIVIDER */}
      <div className="h-2 w-full bg-slate-50 dark:bg-[#111] my-8 md:my-12 border-y border-slate-100 dark:border-slate-800/50"></div>

      {/* ============================== */}
      {/* 4. STUDENT MARKET SECTION      */}
      {/* ============================== */}
      <section>
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-6 sm:px-12 mb-8 sm:rounded-2xl bg-[#D97706] py-12 md:py-16 text-white relative overflow-hidden flex flex-col justify-center shadow-lg">
          <h2 className="text-2xl md:text-4xl font-black mb-3 z-10 relative leading-tight">Campus Essentials <br/>& Gear</h2>
          <Link href="/category/student_item" className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold text-xs md:text-sm w-fit uppercase z-10 shadow-md hover:bg-slate-100 transition-colors mt-2">
            Student Market
          </Link>
          <span className="absolute right-[-10px] bottom-[-10px] text-8xl md:text-[150px] opacity-20">🎒</span>
        </div>

        <ProductSection 
          products={studentsFeatured} 
          linkHref="/category/student_item" 
          linkText="View All Student Items" 
        />
      </section>

      {/* DIVIDER */}
      <div className="h-2 w-full bg-slate-50 dark:bg-[#111] my-8 md:my-12 border-y border-slate-100 dark:border-slate-800/50"></div>

      {/* ============================== */}
      {/* 5. FRESH FROM THE JOURNAL      */}
      {/* ============================== */}
      {latestBlogs.length > 0 && (
        <section className="px-4 py-6 md:py-8">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">
            Fresh from the Journal
          </h2>
          <div className="flex flex-col gap-6">
            {latestBlogs.map((blog) => {
              const dateStr = blog.publishedAt && typeof blog.publishedAt.toDate === 'function' 
                ? blog.publishedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "";

              return (
                <Link key={blog.id} href={`/blog/${blog.id}`} className="flex items-center gap-6 group bg-slate-50 dark:bg-[#151515] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                  <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                    <img src={blog.featuredImage || "/og-image.jpg"} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex flex-col flex-1 py-1">
                    <span className="text-[10px] md:text-xs font-black text-[#D97706] uppercase tracking-wider mb-2">{blog.category || "News"}</span>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-[#D97706] transition-colors mb-2">{blog.title}</h3>
                    <div className="mt-auto flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>{dateStr}</span>
                      <span>{typeof blog.readTime === 'number' ? `${blog.readTime} min` : (blog.readTime || '3 min')} read</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 text-center">
             <Link href="/blog" className="text-sm font-bold text-[#D97706] uppercase tracking-wider border-b-2 border-[#D97706] pb-1 hover:text-amber-600 hover:border-amber-600 transition-colors">
               View All Articles
             </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// ==========================================
// REUSABLE PRODUCT GRID COMPONENT
// ==========================================
function ProductSection({ title, products, linkHref, linkText }: { title?: string, products: any[], linkHref?: string, linkText?: string }) {
  if (!products || products.length === 0) return null;
  
  return (
    <div className="px-4">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h2>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
        {/* ADDED SCROLL REVEAL ANIMATION HERE */}
        {products.map((p, i) => (
          <ScrollReveal key={p.id} index={i}>
            <div className="relative group flex flex-col bg-white dark:bg-[#151515] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all h-full">
              
              <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow">
                <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-900">
                   {p.images?.[0] ? (
                     <Image src={p.images[0]} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <div className="m-auto flex items-center justify-center h-full text-[10px] font-bold text-slate-400 uppercase">No Image</div>
                   )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mb-1">{p.category?.replace('_', ' ')}</p>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-4">{p.name}</h3>
                  <div className="mt-auto">
                    {/* YELLOW PRICE TEXT */}
                    <span className="text-sm font-black text-yellow-500">UGX {Number(p.price).toLocaleString()}</span>
                  </div>
                </div>
              </Link>

              {/* QUICK CART BUTTON */}
              <div className="absolute bottom-4 right-4 z-20">
                <QuickCartButton product={p} />
              </div>

            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* VIEW ALL BUTTON */}
      {linkHref && linkText && (
        <div className="mt-8 flex justify-center">
          <Link href={linkHref} className="w-full sm:w-auto px-10 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-center hover:border-[#D97706] hover:text-[#D97706] transition-colors">
            {linkText}
          </Link>
        </div>
      )}
    </div>
  )
}
