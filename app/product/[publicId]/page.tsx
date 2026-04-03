// 🔥 1. REMOVE force-dynamic
// 🔥 2. ADD revalidate to cache this product page for 1 hour
export const revalidate = 3600;

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductByPublicId, getProducts } from "@/lib/firebase/firestore";
import ImageGallery from "@/components/ImageGallery";
import ProductActions from "@/components/ProductActions";
import FastBuy from "@/components/FastBuy"; 
import ProductTracker from "@/components/ProductTracker";
import RecentlyViewedTracker from "@/components/RecentlyViewedTracker";
import SaveProductButton from "@/components/SaveProductButton";
import { optimizeImage } from "@/lib/utils";
import MakeOfferButton from "@/components/MakeOfferButton";

export async function generateMetadata({ params }: { params: { publicId: string } }): Promise<Metadata> {
  const product = await getProductByPublicId(params.publicId);

  if (!product) return { title: "Item Not Found | Kabale Online" };

  const safeName = product.name || "Unnamed Item";
  const formattedPrice = `UGX ${(Number(product.price) || 0).toLocaleString()}`;

  const title = `${safeName} - Available in Kabale | ${formattedPrice}`;
  const description = product.description?.slice(0, 150) || `Buy this ${safeName} for ${formattedPrice}. Pay strictly Cash on Delivery in Kabale town.`;

  const imageUrl = product.images?.[0] || "https://www.kabaleonline.com/og-image.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.kabaleonline.com/product/${params.publicId}`,
      siteName: "Kabale Online",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: safeName }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

// ==========================================
// THE DAILY SHUFFLE ALGORITHM
// ==========================================
// We add this here so we can shuffle the related products stably without breaking the cache!
function getDailyRandomScore(id: string) {
  const today = new Date().toISOString().split('T')[0];
  const seedString = id + today; 
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0; 
  }
  return hash;
}

export default async function ProductDetailsPage({ params }: { params: { publicId: string } }) {
  const product = await getProductByPublicId(params.publicId);

  if (!product) notFound();

  const safeName = product.name || "Unnamed Item";
  const safePrice = Number(product.price) || 0;
  const safeCondition = product.condition || "used";
  const safeCategory = product.category || "general";

  // ==========================================
  // 1. BULLETPROOF STOCK PARSING
  // ==========================================
  let safeStock = 1;
  if (product.stock !== undefined && product.stock !== null) {
    const parsed = Number(product.stock);
    if (!isNaN(parsed)) {
      safeStock = parsed;
    }
  }

  // Logic for Authentic Scarcity
  const isLowStock = safeStock > 0 && safeStock <= 5;
  const isAvailable = safeStock > 0;

  // ==========================================
  // 2. BULLETPROOF ADMIN CHECK
  // ==========================================
  const sellerNameStr = String(product.sellerName || "").toLowerCase();
  const isAdmin = sellerNameStr.includes('admin') || sellerNameStr.includes('kabale online') || sellerNameStr.includes('official');

  // ==========================================
  // 3. OPTIMIZE IMAGES
  // ==========================================
  const optimizedImages = product.images?.map((img: string) => optimizeImage(img)) || [];

  // ==========================================
  // 4. FETCH RELATED PRODUCTS
  // ==========================================
  const rawCategoryProducts = await getProducts(safeCategory, 12);

  const relatedProducts = rawCategoryProducts
    .filter((p) => p.id !== product.id && p.publicId !== product.publicId)
    .sort((a, b) => getDailyRandomScore(a.id) - getDailyRandomScore(b.id))
    .slice(0, 8) 
    .map((p) => ({
      ...p,
      images: p.images?.map((img: string) => optimizeImage(img)) || []
    }));

  // ==========================================
  // 5. HELPER: RENDER DESCRIPTION AS BULLETS
  // ==========================================
  const renderDescription = (desc?: string) => {
    if (!desc) return <p className="text-slate-700 text-sm">No description provided by the seller.</p>;

    const lines = desc.split('\n').filter(line => line.trim() !== '');

    return (
      <ul className="space-y-2">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
          return (
            <li key={idx} className="text-slate-700 text-sm leading-relaxed flex items-start gap-2">
              <span className="text-slate-400 mt-[2px]">•</span>
              <span>{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6">
      <ProductTracker productId={product.id} />
      <RecentlyViewedTracker product={product} />   

      {/* BREADCRUMBS */}  
      <div className="mb-8 flex items-center text-sm text-slate-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">  
        <Link href="/" className="hover:text-[#D97706] transition-colors">Home</Link>  
        <span className="mx-2">/</span>  
        <Link href={`/category/${safeCategory}`} className="hover:text-[#D97706] transition-colors capitalize">  
          {safeCategory.replace(/_/g, ' ')}  
        </Link>  
        <span className="mx-2">/</span>  
        <span className="text-slate-900 truncate max-w-[200px]">{safeName}</span>  
      </div>  

      {/* MODERN E-COMMERCE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">  

        {/* LEFT COLUMN: Image Gallery (Sticky on Desktop) */}  
        <div className="w-full flex flex-col lg:sticky lg:top-24 h-fit">  
          <ImageGallery images={optimizedImages} title={safeName} />  
          <p className="text-[11px] text-slate-400 mt-4 text-center italic">  
            * Note: Actual color variations may occur due to lighting or screen settings.  
          </p>  
        </div>  

        {/* RIGHT COLUMN: Product Details */}  
        <div className="flex flex-col">  

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">  
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${  
              safeCondition === 'new' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'  
            }`}>  
              {safeCondition === 'new' ? 'Brand New' : 'Used'}  
            </span>  
          </div>  

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">  
            {safeName}
          </h1>  

          {/* Price */}
          <div className="mb-4 flex items-center gap-4">  
            <span className="text-4xl font-black text-[#D97706]">  
              UGX {safePrice.toLocaleString()}  
            </span>  
          </div>  

          {/* AUTHENTIC SCARCITY INDICATOR */}
          {isAvailable && (
            <div className={`mb-6 flex items-center gap-2 text-sm font-bold p-3 rounded-xl border w-fit ${
              isLowStock 
                ? "bg-red-50 text-red-600 border-red-100" 
                : "bg-green-50 text-green-700 border-green-100"
            }`}>
              {isLowStock ? (
                <>
                  <svg className="w-5 h-5 animate-pulse shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>High Demand: Only {safeStock} left in stock!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>In Stock & Ready to Deliver</span>
                </>
              )}
            </div>
          )}

          {/* FAST BUY ACTION */}
          <div className="mb-6">
            <FastBuy product={{...product, images: optimizedImages}} />
          </div>

          {/* INLINE TRUST BOX (Conversion Machine Core) */}
          <div className="mb-10 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
            {/* Trust Signal 1: Risk Reversal */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-0.5 tracking-tight">
                  Payment is after you receive the product
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Inspect the item first. If it is not exactly as described, simply hand it back. You only pay when you are 100% satisfied. Zero risk.
                </p>
              </div>
            </div>

            {/* Trust Signal 2: Local Delivery */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-0.5 tracking-tight">
                  Fast Delivery in Kabale & Kigezi
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Direct delivery to your doorstep, shop, or hostel. No waiting days for packages from Kampala.
                </p>
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}  
          <div className="mb-8">  
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Description</h3>  
            {renderDescription(product.description)}
          </div>  

          {/* 2-COLUMN SPECS TABLE (Cleaned Up) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-auto mb-10 bg-white">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-slate-200">
                <tr className="divide-x divide-slate-200">
                  <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Stock Status</th>
                  <td className="px-4 py-3 text-slate-900 font-medium flex items-center bg-white">
                    <span className={safeStock > 0 ? "text-green-700" : "text-red-600"}>
                      {safeStock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
                <tr className="divide-x divide-slate-200">
                  <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Location</th>
                  <td className="px-4 py-3 text-slate-900 bg-white">Available in Kabale</td>
                </tr>
                <tr className="divide-x divide-slate-200">
                  <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Delivery</th>
                  <td className="px-4 py-3 text-slate-900 bg-white">Same day (if ordered 7 AM - 3 PM)</td>
                </tr>
                <tr className="divide-x divide-slate-200">
                  <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Sold By</th>
                  <td className="px-4 py-3 text-slate-900 font-bold uppercase bg-white flex items-center gap-2">
                    {product.sellerName || "Verified Seller"} 
                    {isAdmin && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Verified ✓</span>
                    )}
                  </td>
                </tr>
                <tr className="divide-x divide-slate-200">
                  <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Returns</th>
                  <td className="px-4 py-3 text-slate-900 bg-white">Reject on delivery if unsatisfied</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECONDARY ACTIONS (Chat, Make Offer, Save) */}
          <div className="mb-10 border-b border-slate-200 pb-10">
            <ProductActions product={{...product, images: optimizedImages}}>
                <div className="flex flex-col gap-3 mt-2 w-full">
                  <MakeOfferButton product={product} />
                  <SaveProductButton product={product} />
                </div>
            </ProductActions>
          </div> 

        </div>  
      </div>  

      {/* ========================================== */}  
      {/* HORIZONTALLY SCROLLABLE RELATED PRODUCTS   */}  
      {/* ========================================== */}  
      {relatedProducts.length > 0 && (  
        <div className="mt-16 mb-8 pt-10 border-t border-slate-200">  
          <div className="flex items-center justify-between mb-8">  
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">You Might Also Like</h2>  
          </div>  

          {/* Scrollable Container */}
          <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide">  
            {relatedProducts.map((relProduct) => (  
              <Link   
                key={relProduct.id}   
                href={`/product/${relProduct.publicId || relProduct.id}`}   
                className="flex-none w-[160px] sm:w-[220px] snap-start bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:border-slate-300 transition-colors"  
              >  
                {/* Image */}  
                <div className="aspect-square relative bg-slate-100 overflow-hidden">  
                  {relProduct.images?.[0] ? (  
                    <Image   
                      src={relProduct.images[0]}   
                      alt={relProduct.name}  
                      fill   
                      sizes="(max-width: 768px) 160px, 220px"  
                      className="object-cover"  
                    />  
                  ) : (  
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">No Image</div>  
                  )}  
                </div>  

                {/* Details */}  
                <div className="p-4 flex flex-col flex-grow">  
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">  
                    {safeCategory.replace(/_/g, ' ')}  
                  </span>  
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2">  
                    {relProduct.name}  
                  </h3>  
                  <div className="mt-auto pt-2">  
                    <p className="text-base font-black text-[#D97706]">UGX {Number(relProduct.price).toLocaleString()}</p>  
                  </div>  
                </div>  
              </Link>  
            ))}  

            {/* View More Card at the end of the scroll */}
            <Link 
              href={`/category/${safeCategory}`} 
              className="flex-none w-[160px] sm:w-[220px] snap-start bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 p-4 hover:bg-slate-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
                <span className="text-xl font-bold">→</span>
              </div>
              <span className="text-sm font-bold text-center">
                View more <br/>
                <span className="capitalize text-[#D97706]">{safeCategory.replace(/_/g, ' ')}</span>
              </span>
            </Link>
          </div>  
        </div>  
      )}  

      {/* ========================================== */}  
      {/* SELLER ACQUISITION PROMPT                  */}  
      {/* ========================================== */}
      <div className="mt-8 mb-12 border-t border-slate-200 pt-8 text-center px-4">
        <p className="text-slate-600 text-sm font-medium">
          Got something to sell?{' '}
          <Link 
            href="/sell" 
            className="text-[#D97706] font-bold underline decoration-2 underline-offset-4"
          >
            Start selling on Kabale Online
          </Link>
        </p>
      </div>

    </div>
  );
}
