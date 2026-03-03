import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";
import { adminDb } from "@/lib/firebase/admin";

// ISR: Revalidate the homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  // 1. Fetch products for the lottery
  const electronics = await getProducts("electronics");
  const agriculture = await getProducts("agriculture");
  const students = await getProducts("student_item");

  // Combine all active products and shuffle them for the "Free Featured Slot"
  const allProducts = [...electronics, ...agriculture, ...students];
  const shuffled = allProducts.sort(() => 0.5 - Math.random());
  const featuredProducts = shuffled.slice(0, 4);

  // 2. Fetch the latest 3 blog posts
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
    <div className="flex flex-col gap-y-20 pb-12">

      {/* 1. Hero Section */}
      <section className="text-center pt-12 md:pt-20 px-4">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
          Kabale’s Online Electronics & Student Marketplace
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium">
          Order today. Pay on delivery strictly within Kabale town.
        </p>
        
        {/* Updated Button Row */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link 
            href="/category/electronics" 
            className="w-full sm:w-auto rounded-lg bg-primary px-8 py-4 text-base font-bold text-white shadow-md hover:bg-sky-500 transition-all hover:-translate-y-1"
          >
            Shop Electronics
          </Link>
          <Link 
            href="/category/student_item" 
            className="w-full sm:w-auto rounded-lg bg-white border-2 border-slate-200 px-8 py-4 text-base font-bold text-slate-700 hover:border-primary hover:text-primary transition-all hover:-translate-y-1"
          >
            Student Market
          </Link>
          {/* NEW: Request an Item Button */}
          <Link 
            href="/requests" 
            className="w-full sm:w-auto rounded-lg bg-[#D97706] px-8 py-4 text-base font-bold text-white shadow-md hover:bg-amber-600 transition-all hover:-translate-y-1 flex flex-col items-center justify-center gap-1"
          >
            <span className="flex items-center gap-2">📢 Buyer Request Board</span>
            <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Post Needs &bull; Find Buyers</span>
          </Link>
        </div>

        
      </section>

      {/* 2. Categories Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Browse Categories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/category/electronics" className="group block p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 hover:border-primary transition-colors text-center shadow-sm hover:shadow-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="text-2xl">💻</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Electronics</h3>
            <p className="text-sm text-slate-500">Laptops, phones & accessories</p>
          </Link>
          <Link href="/category/agriculture" className="group block p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 hover:border-green-500 transition-colors text-center shadow-sm hover:shadow-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="text-2xl">🌾</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Agriculture</h3>
            <p className="text-sm text-slate-500">Local produce & tools</p>
          </Link>
          <Link href="/category/student_item" className="group block p-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 hover:border-amber-500 transition-colors text-center shadow-sm hover:shadow-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Student Market</h3>
            <p className="text-sm text-slate-500">Textbooks & campus essentials</p>
          </Link>
        </div>
      </section>

      

      {/* 3. Random Featured Products (The Lottery) */}
      {featuredProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Today's Community Picks 🎁
              </h2>
              <p className="text-sm text-slate-500 mt-1">Randomly selected local sellers. Check back often!</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <Link 
                key={product.id} 
                href={`/item/${product.publicId || product.id}`}
                className="group flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name || "Product Image"}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-grow p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-slate-500 mb-1">
                    ID: {product.publicId || product.id.slice(0, 8)}
                  </p>
                  <h3 className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2">
                    {product.name || "Unnamed Item"}
                  </h3>
                  <div className="mt-auto pt-2 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                    <span className="text-sm sm:text-lg font-bold text-primary">
                      UGX {(Number(product.price) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. Trust & How It Works */}
      <section className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Kabale Online?</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            We built this platform specifically for the Kabale community to make local buying and selling safe and easy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-xl shadow-sm">🤝</div>
            <h3 className="font-bold text-slate-900 mb-2">100% Cash on Delivery</h3>
            <p className="text-sm text-slate-600">Inspect your item first. Pay only when it is in your hands.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-4 text-xl shadow-sm">📍</div>
            <h3 className="font-bold text-slate-900 mb-2">Local Kabale Sellers</h3>
            <p className="text-sm text-slate-600">Every vendor is based right here in Kabale town.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 text-xl shadow-sm">🛡️</div>
            <h3 className="font-bold text-slate-900 mb-2">Verified Listings</h3>
            <p className="text-sm text-slate-600">We monitor our platform to keep spam and scams out.</p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-12">
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">How it works</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12">
            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm shadow-sm">1</span>
              <span className="font-medium text-slate-700">Browse Items</span>
            </div>
            <div className="hidden md:block w-12 h-px bg-slate-300"></div>
            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm shadow-sm">2</span>
              <span className="font-medium text-slate-700">Place Order</span>
            </div>
            <div className="hidden md:block w-12 h-px bg-slate-300"></div>
            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm shadow-sm">3</span>
              <span className="font-bold text-primary">Pay on Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: LATEST FROM THE BLOG SECTION */}
      {latestBlogs.length > 0 && (
        <section className="pt-8">
          <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-900">Kabale Campus Journal</h2>
            <Link href="/blog" className="text-sm font-bold text-primary hover:underline">
              Read all articles &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestBlogs.map((blog) => {
              // Safe Date Parsing
              const dateStr = blog.publishedAt && typeof blog.publishedAt.toDate === 'function' 
                ? blog.publishedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                : "Recently";

              return (
                <Link key={blog.id} href={`/blog/${blog.id}`} className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={blog.featuredImage || blog.image || "/og-image.jpg"} 
                      alt={blog.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706] mb-2">
                      {blog.category || "General"}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-primary transition-colors">
                      {blog.title}
                    </h3>
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100">
                      <span>{dateStr}</span>
                      <span>{typeof blog.readTime === 'number' ? `${blog.readTime} min read` : (blog.readTime || '3 min read')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Seller CTA */}
      <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Have electronics or textbooks to sell?</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Join the growing list of local sellers reaching Kabale University students and the wider town community.
          </p>
          <Link 
            href="/sell" 
            className="inline-block rounded-lg bg-primary px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-sky-400 transition-colors"
          >
            Post an Item
          </Link>
        </div>
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary opacity-20 rounded-full translate-x-1/3 translate-y-1/3 blur-2xl"></div>
      </section>

    </div>
  );
}