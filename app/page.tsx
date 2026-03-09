import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import { adminDb } from "@/lib/firebase/admin";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import HeroCarousel from "@/components/HeroCarousel";
import QuickCartButton from "@/components/QuickCartButton"; 

// 🔥 24-HOUR RANDOMIZER (86400 seconds = 24 hours)
export const revalidate = 86400;

export default async function Home() {
  // Fetch specific categories
  const electronics = await getProducts("electronics");
  const agriculture = await getProducts("agriculture");
  const students = await getProducts("student_item");

  const allProducts = [...electronics, ...agriculture, ...students];

  // Helper function to shuffle and pick 12
  const getRandom12 = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random()).slice(0, 12);

  // Layout Step 4, 6, 8 Arrays
  const mixedFeatured = getRandom12(allProducts);
  const electronicsFeatured = getRandom12(electronics);
  const studentsFeatured = getRandom12(students);

  // Layout Step 10: Fetch latest 3 blogs
  let latestBlogs: any[] = [];
  try {
    const blogSnap = await adminDb.collection("blog_posts")
      .orderBy("publishedAt", "desc")
      .limit(3)
      .get();
    latestBlogs = blogSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Failed to load blogs on homepage", error);
  }

  return (
    <div className="flex flex-col gap-y-10 pb-12 bg-white dark:bg-[#0a0a0a]">
      
      {/* STEP 1: Main hero slider & Announcement */}
      <section className="px-2 pt-4">
        <AnnouncementBanner />
        <HeroCarousel />

        {/* STEP 2: Horizontal 3 Category List */}
        <div className="flex overflow-x-auto gap-4 py-4 no-scrollbar items-center justify-start md:justify-center px-2">
          {[
            { name: "Electronics", icon: "💻", href: "/category/electronics", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { name: "Agriculture", icon: "🌾", href: "/category/agriculture", bg: "bg-green-50 dark:bg-green-900/20" },
            { name: "Student Market", icon: "📚", href: "/category/student_item", bg: "bg-amber-50 dark:bg-amber-900/20" },
          ].map((cat) => (
            <Link key={cat.name} href={cat.href} className="flex flex-col items-center min-w-[90px] gap-2 group">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-sm border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition-transform ${cat.bg}`}>
                {cat.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter text-center group-hover:text-[#D97706]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* STEP 3 & 4: Available Items (Mixed 12) */}
      <ProductSection title="Available Items" products={mixedFeatured} linkHref="/products" />

      {/* STEP 5 & 6: Fixed Electronics Hero + 12 Random Electronics */}
      <section>
        {/* Step 5: Electronics Hero Banner */}
        <div className="mx-4 mb-4 rounded-2xl bg-slate-900 p-8 text-white relative overflow-hidden h-[180px] flex flex-col justify-center shadow-lg">
          <h2 className="text-2xl font-black mb-2 z-10 relative leading-tight">Quality Gadgets <br/>& Electronics</h2>
          <Link href="/category/electronics" className="bg-[#D97706] text-white px-6 py-2.5 rounded-full font-bold text-xs w-fit uppercase z-10 shadow-md hover:bg-amber-600 transition-colors mt-2">
            Shop Electronics
          </Link>
          {/* Add a real image here later if you want, using an absolute positioned Image tag */}
          <span className="absolute right-[-10px] bottom-[-20px] text-8xl opacity-10">💻</span>
        </div>
        
        {/* Step 6: 12 Random Electronics */}
        <ProductSection products={electronicsFeatured} />
      </section>

      {/* STEP 7 & 8: Student Market Hero + 12 Random Student Items */}
      <section>
        {/* Step 7: Student Market Hero Banner */}
        <div className="mx-4 mb-4 rounded-2xl bg-[#D97706] p-8 text-white relative overflow-hidden h-[180px] flex flex-col justify-center shadow-lg">
          <h2 className="text-2xl font-black mb-2 z-10 relative leading-tight">Campus Essentials <br/>& Gear</h2>
          <Link href="/category/student_item" className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold text-xs w-fit uppercase z-10 shadow-md hover:bg-slate-100 transition-colors mt-2">
            Student Market
          </Link>
          <span className="absolute right-[-10px] bottom-[-10px] text-8xl opacity-20">🎒</span>
        </div>

        {/* Step 8: 12 Random Student Items */}
        <ProductSection products={studentsFeatured} />
      </section>

      {/* STEP 9 & 10: "Fresh from the journal" + List Layout Blogs */}
      {latestBlogs.length > 0 && (
        <section className="px-4 border-t border-slate-200 dark:border-slate-800 pt-10 pb-6">
          {/* Step 9 */}
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">
            Fresh from the Journal
          </h2>
          
          {/* Step 10: List of 3 blogs */}
          <div className="flex flex-col gap-4">
            {latestBlogs.map((blog) => {
              const dateStr = blog.publishedAt && typeof blog.publishedAt.toDate === 'function' 
                ? blog.publishedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                : "";

              return (
                <Link key={blog.id} href={`/blog/${blog.id}`} className="flex items-center gap-4 group bg-slate-50 dark:bg-[#151515] p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                    <img 
                      src={blog.featuredImage || blog.image || "/og-image.jpg"} 
                      alt={blog.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-col flex-1 py-1">
                    <span className="text-[10px] font-black text-[#D97706] uppercase tracking-wider mb-1">
                      {blog.category || "News"}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-[#D97706] transition-colors">
                      {blog.title}
                    </h3>
                    <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{dateStr}</span>
                      <span>{typeof blog.readTime === 'number' ? `${blog.readTime} min` : (blog.readTime || '3 min')} read</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-6 text-center">
             <Link href="/blog" className="text-xs font-bold text-[#D97706] uppercase tracking-wider border-b-2 border-[#D97706] pb-1">View All Articles</Link>
          </div>
        </section>
      )}
    </div>
  );
}

// ==========================================
// REUSABLE PRODUCT GRID COMPONENT
// ==========================================
function ProductSection({ title, products, linkHref }: { title?: string, products: any[], linkHref?: string }) {
  if (!products || products.length === 0) return null;
  
  return (
    <div className="px-2 md:px-4">
      {title && (
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h2>
          {linkHref && <Link href={linkHref} className="text-[11px] font-bold text-[#D97706] uppercase">See All</Link>}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
        {products.map((p) => (
          <div key={p.id} className="relative group flex flex-col bg-white dark:bg-[#151515] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all">
            
            {/* The Link wraps everything EXCEPT the Cart Button */}
            <Link href={`/product/${p.publicId || p.id}`} className="flex flex-col flex-grow">
              <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-900">
                 {p.images?.[0] ? (
                   <Image src={p.images[0]} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <div className="m-auto flex items-center justify-center h-full text-[10px] font-bold text-slate-400 uppercase">No Image</div>
                 )}
              </div>
              <div className="p-3 flex flex-col flex-grow">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate mb-1">{p.category?.replace('_', ' ')}</p>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-3">{p.name}</h3>
                <div className="mt-auto">
                  <span className="text-[13px] font-black text-slate-900 dark:text-white">UGX {Number(p.price).toLocaleString()}</span>
                </div>
              </div>
            </Link>

            {/* QUICK CART BUTTON - Placed absolutely so it doesn't trigger the Link */}
            <div className="absolute bottom-3 right-3 z-20">
              <QuickCartButton product={p} />
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
