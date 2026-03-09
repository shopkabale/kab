import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import { adminDb } from "@/lib/firebase/admin";
import AutoScrollBanner from "@/components/AutoScrollBanner"; 
import ProductCard from "@/components/ProductCard";

// ISR: Revalidate the homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  // 1. Fetch products by category
  const electronics = await getProducts("electronics");
  const agriculture = await getProducts("agriculture");
  const students = await getProducts("student_item");

  // Combine and shuffle for the endless feed
  const allProducts = [...electronics, ...agriculture, ...students];
  const shuffled = allProducts.sort(() => 0.5 - Math.random());
  
  // Show 12 items to make the store look massive
  const generalFeatured = shuffled.slice(0, 12);

  // 2. Fetch the latest 3 blog posts (Kept your logic!)
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
    <div className="flex flex-col gap-y-10 pb-24 bg-slate-50 min-h-screen">

      {/* 1. App-Style Hero Banner with Auto-Scroll */}
      <section className="pt-6 px-4">
        
        <AutoScrollBanner />

        <div className="bg-gradient-to-r from-[#D97706] to-amber-500 rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-center min-h-[200px] shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-[85%]">
            
            {/* NEW OFFICIAL KIGEZI BRANDING */}
            <h1 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">
              The better way to buy and sell in Kabale and the greater Kigezi community
            </h1>
            
            <p className="text-amber-100 text-xs sm:text-sm font-medium mb-6">
              Shop trusted local vendors. Pay on delivery.
            </p>
            <Link href="/products" className="bg-white text-[#D97706] px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-slate-50 transition-colors inline-block">
              Order Now
            </Link>
          </div>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute right-[-20px] top-[20px] text-8xl opacity-20 transform rotate-12">🛒</div>
        </div>
      </section>

      {/* 2. Horizontal Scrolling Categories (Zero text clutter) */}
      <section className="px-4">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <Link href="/category/student_item" className="snap-start shrink-0 w-[110px] flex flex-col items-center gap-2 group">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-3xl group-hover:border-[#D97706] transition-colors">
              📚
            </div>
            <span className="text-[10px] font-bold text-slate-700 text-center uppercase tracking-wider">Student Items</span>
          </Link>

          <Link href="/category/electronics" className="snap-start shrink-0 w-[110px] flex flex-col items-center gap-2 group">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-3xl group-hover:border-[#D97706] transition-colors">
              💻
            </div>
            <span className="text-[10px] font-bold text-slate-700 text-center uppercase tracking-wider">Electronics</span>
          </Link>

          <Link href="/category/agriculture" className="snap-start shrink-0 w-[110px] flex flex-col items-center gap-2 group">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-3xl group-hover:border-[#D97706] transition-colors">
              🌾
            </div>
            <span className="text-[10px] font-bold text-slate-700 text-center uppercase tracking-wider">Agriculture</span>
          </Link>

          <Link href="/requests" className="snap-start shrink-0 w-[110px] flex flex-col items-center gap-2 group">
            <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-900 flex items-center justify-center text-3xl group-hover:bg-slate-800 transition-colors">
              📢
            </div>
            <span className="text-[10px] font-bold text-slate-700 text-center uppercase tracking-wider">Requests</span>
          </Link>

        </div>
      </section>

      {/* 3. "Available Items" Grid (Using your new ProductCard) */}
      {generalFeatured.length > 0 && (
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Available Items</h2>
            <Link href="/products" className="text-xs font-bold text-[#D97706]">View All &rarr;</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {generalFeatured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <Link 
              href="/products"
              className="w-full sm:w-auto px-12 py-4 bg-slate-900 text-white font-extrabold text-sm rounded-xl hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-3"
            >
              Explore All Items ➔
            </Link>
          </div>
        </section>
      )}

      {/* 4. Trust Section (Condensed to fit the App Style) */}
      <section className="px-4 mt-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Why Kabale Online?</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            <div>
              <div className="w-10 h-10 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 text-lg">🤝</div>
              <h3 className="font-bold text-[10px] sm:text-sm text-slate-900 mb-1">Pay on Delivery</h3>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2 text-lg">📍</div>
              <h3 className="font-bold text-[10px] sm:text-sm text-slate-900 mb-1">Local Sellers</h3>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-2 text-lg">🛡️</div>
              <h3 className="font-bold text-[10px] sm:text-sm text-slate-900 mb-1">Verified</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LATEST FROM THE BLOG SECTION */}
      {latestBlogs.length > 0 && (
        <section className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
            <h2 className="text-lg font-black text-slate-900 uppercase">Campus Journal</h2>
            <Link href="/blog" className="text-xs font-bold text-[#D97706]">All Articles &rarr;</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestBlogs.map((blog) => {
              const dateStr = blog.publishedAt && typeof blog.publishedAt.toDate === 'function' 
                ? blog.publishedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                : "Recently";

              return (
                <Link key={blog.id} href={`/blog/${blog.id}`} className="group flex bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-24 w-24 bg-slate-100 shrink-0">
                    <img src={blog.featuredImage || blog.image || "/og-image.jpg"} alt={blog.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex flex-col justify-center flex-grow">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#D97706] mb-1">{blog.category || "General"}</span>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{blog.title}</h3>
                    <span className="text-[10px] text-slate-500 mt-1">{dateStr}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
