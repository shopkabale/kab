// 1. REMOVE force-dynamic
// 2. ADD revalidate to cache this product page for 1 hour
export const revalidate = 3600;

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation"; // 👈 Imported redirect
import { getProductByPublicId, getProducts } from "@/lib/firebase/firestore";
import ImageGallery from "@/components/ImageGallery";
import ProductActions from "@/components/ProductActions";
import ProductTracker from "@/components/ProductTracker";
import RecentlyViewedTracker from "@/components/RecentlyViewedTracker";
import SaveProductButton from "@/components/SaveProductButton";
import InlineOfferLink from "@/components/InlineOfferLink";
import ProductReviews from "@/components/ProductReviews"; 
import { optimizeImage, calculateDepositAmount } from "@/lib/utils"; 
import { FaCheck, FaTruck } from "react-icons/fa";
import { MdVerifiedUser } from "react-icons/md";
import BatchDeliveryCountdown from "@/components/BatchDeliveryCountdown"; // 👈 ADD THIS IMPORT

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

// ==========================================
// HELPER: CHECK IF ITEM IS NEW (< 7 DAYS)
// ==========================================
const checkIsNew = (p: any) => {
  const pDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : new Date(p.createdAt || 0).getTime();
  return pDate > 0 && (Date.now() - pDate) < (7 * 24 * 60 * 60 * 1000); 
};

export default async function ProductDetailsPage({ params }: { params: { publicId: string } }) {
  const product = await getProductByPublicId(params.publicId);

  if (!product) notFound();
  // ==========================================
  // 🚨 THE SERVICE REDIRECT 🚨
  // ==========================================
  if (product.category === "services") {
    // Change params.publicId to product.id so the LONG ID becomes the main URL
    redirect(`/service/${product.id}`); 
  }

  const safeName = product.name || "Unnamed Item";
  const safePrice = Number(product.price) || 0;
  const safeCondition = product.condition || "used";
  const safeCategory = product.category || "general";

  // TypeScript Bypass
  const pAny = product as any;

  // Product States
  const isMainProductNew = checkIsNew(product);
  const isMainApproved = pAny.isApprovedQuality;
  const isMainOfficial = pAny.isOfficialStore || pAny.isAdminUpload;

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

  const isLowStock = safeStock > 0 && safeStock <= 5;
  const isSoldOut = safeStock <= 0 || product.status === "sold";

  // ==========================================
  // 2. BULLETPROOF ADMIN CHECK
  // ==========================================
  const sellerNameStr = String(product.sellerName || "").toLowerCase();
  const isAdmin = sellerNameStr.includes('admin') || sellerNameStr.includes('kabale online') || sellerNameStr.includes('official');

  // CALCULATE DEPOSIT FOR UI
  const depositRequired = safePrice >= 20000 ? calculateDepositAmount(safePrice, false) : 0;

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
    if (!desc) return <p className="text-[#6B6B6B] text-sm">No description provided by the seller.</p>;

    const lines = desc.split('\n').filter(line => line.trim() !== '');

    return (
      <ul className="space-y-2">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
          return (
            <li key={idx} className="text-[#6B6B6B] text-sm leading-relaxed flex items-start gap-2">
              <span className="text-slate-400 mt-[2px]">•</span>
              <span>{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    // FIX: Added w-full and overflow-x-hidden to lock the layout into mobile view
    <div className="py-8 w-full max-w-full overflow-x-hidden mx-auto px-4 sm:px-6 bg-white min-h-screen">
      <ProductTracker product={product} />
      <RecentlyViewedTracker product={product} />   

      {/* BREADCRUMBS */}  
      <div className="mb-6 flex items-center text-sm text-[#6B6B6B] font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">  
        <Link href="/" className="hover:text-[#FF6A00] transition-colors">Home</Link>  
        <span className="mx-2">/</span>  
        <Link href={`/category/${safeCategory}`} className="hover:text-[#FF6A00] transition-colors capitalize">  
          {safeCategory.replace(/_/g, ' ')}  
        </Link>  
        <span className="mx-2">/</span>  
        <span className="text-[#1A1A1A] truncate max-w-[200px]">{safeName}</span>  
      </div>  

      {/* MODERN E-COMMERCE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">  

        {/* LEFT COLUMN: Image Gallery */}  
        <div className="w-full flex flex-col lg:sticky lg:top-24 h-fit">  
          <ImageGallery images={optimizedImages} title={safeName} />  
          <p className="text-[11px] text-slate-400 mt-4 text-center italic">  
            * Note: Actual color variations may occur due to lighting or screen settings.  
          </p>  
        </div>  

        {/* RIGHT COLUMN: Product Details */}  
        <div className="flex flex-col overflow-hidden">  

          {/* 1. E-COMMERCE TRUST BANNER (Full width, black text) */}
          <div className="flex items-center justify-center sm:justify-start gap-3 md:gap-5 bg-orange-50 text-[#1A1A1A] text-xs md:text-sm font-extrabold py-3 px-4 rounded-md w-full mb-6 border border-orange-100 shadow-sm">
            <span className="flex items-center gap-1.5"><FaCheck className="text-green-600 text-base" /> Cash on Delivery</span>
            <span className="text-orange-200">|</span>
            <span className="flex items-center gap-1.5"><FaTruck className="text-[#1A1A1A] text-base" /> Same Day Delivery</span>
          </div>

          {/* 2. BRAND & BADGES (Kabale Online in normal black) */}
          <div className="flex flex-wrap items-center gap-2 mb-3">  
            <span className="font-medium text-sm uppercase tracking-wider text-[#1A1A1A] mr-2">
              {pAny.brand || "KABALE ONLINE"}
            </span>

            {isMainProductNew && (
              <span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                 <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></span>
                 New
              </span>
            )}

            {(isMainApproved || isMainOfficial) && (
              <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wide">
                 Original Brand <MdVerifiedUser />
              </span>
            )}

            <span className="text-green-600 text-[11px] font-bold flex items-center gap-1 uppercase">
              <FaCheck /> Certified
            </span>
          </div>  

          {/* 3. TITLE (Big and light gray) */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-400 leading-tight mb-4">  
            {safeName}
          </h1>  

          {/* 4. PRICE (Strong black) & REVIEWS */}
          <div className="mb-2 flex items-end gap-3">  
            <span className="text-4xl sm:text-5xl font-black text-[#1A1A1A]">  
              UGX {safePrice.toLocaleString()}  
            </span>  
          </div>  

          <div className="flex items-center gap-2 mb-6 text-sm text-[#6B6B6B]">
            {/* SVG Stars instead of emojis */}
            <div className="flex text-[#FF6A00] gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <a href="#reviews" className="hover:text-[#FF6A00] cursor-pointer transition-colors">(View customer reviews)</a>
          </div>

          

          {/* INLINE MAKE OFFER LINK */}
          <div className="mb-6 border-t border-slate-100 pt-4">
            <p className="text-sm text-[#6B6B6B] font-medium">
              Do you think the price is high? {' '}
              <span className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                <InlineOfferLink product={product} safeName={safeName} />
              </span>
            </p>
          </div>

          {/* 5. AUTHENTIC SCARCITY INDICATOR (Lighter Colors & Weight) */}
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            {isSoldOut ? (
               <>
                <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-500">This item is currently sold out. Check similar items below.</span>
               </>
            ) : safeStock <= 2 ? (
              <>
                <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-500">High Demand: Only {safeStock} left in stock!</span>
              </>
            ) : safeStock <= 5 ? (
              <>
                <svg className="w-5 h-5 shrink-0 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-orange-400">Hurry: Only {safeStock} left!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-500">In Stock & Ready to Deliver</span>
              </>
            )}
          </div>

          {/* DEPOSIT REQUIREMENT BOX */}
          {!isSoldOut && depositRequired > 0 && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <h4 className="text-sm sm:text-base font-bold text-green-800 flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                Commitment Deposit Required: Secure Your Item
              </h4>
              <p className="text-sm text-[#1A1A1A] leading-relaxed font-medium">
                With {isLowStock ? `only ${safeStock} left in stock` : 'high demand'}, a small UGX {depositRequired.toLocaleString()} commitment deposit is required to confirm your intent, hold this unique item, and prevent duplicate claims.
              </p>
            </div>
          )}

          {/* ========================================== */}
          {/* 🚨 FOMO BATCH COUNTDOWN PLACED HERE 🚨 */}
          {/* ========================================== */}
          {!isSoldOut && (
            <BatchDeliveryCountdown />
          )}


          {/* MAIN CALL TO ACTIONS (HYBRID) */}
          <div className={`mb-8 ${isSoldOut ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <ProductActions product={{...product, images: optimizedImages}}>
                <div className="flex flex-col gap-3 mt-2 w-full">
                  <SaveProductButton product={product} />
                </div>
            </ProductActions>
          </div> 

          {/* NATIVE HTML ACCORDIONS (SEO FRIENDLY) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-auto mb-10 bg-white shadow-sm divide-y divide-slate-200">

            <details className="group" open>
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-green-700 bg-slate-50 hover:bg-slate-100 transition-colors text-sm">
                Description
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              {/* FIX: Added break-words to prevent long links from breaking the layout */}
              <div className="p-4 text-[#6B6B6B] bg-white break-words overflow-hidden">
                {renderDescription(product.description)}
              </div>
            </details>

            <details className="group" open>
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-[#1A1A1A] hover:bg-slate-50 transition-colors text-sm">
                Additional Information
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-0 bg-white overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <th className="w-1/3 px-4 py-3 font-semibold text-slate-700 bg-slate-50/50">Condition</th>
                      <td className="px-4 py-3 text-[#1A1A1A] capitalize">{safeCondition}</td>
                    </tr>
                    <tr>
                      <th className="w-1/3 px-4 py-3 font-semibold text-slate-700 bg-slate-50/50">Location</th>
                      <td className="px-4 py-3 text-[#1A1A1A]">Available locally in Kabale</td>
                    </tr>
                    <tr>
                      <th className="w-1/3 px-4 py-3 font-semibold text-slate-700 bg-slate-50/50">Sold By</th>
                      <td className="px-4 py-3 text-[#1A1A1A] font-bold flex items-center gap-2">
                        {product.sellerName || "Verified Seller"} 
                        {isAdmin && <span className="text-blue-600"><MdVerifiedUser /></span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>

            <details className="group" id="reviews">
              <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-[#1A1A1A] hover:bg-slate-50 transition-colors text-sm">
                Customer Reviews
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 bg-white overflow-hidden">
                <ProductReviews productId={product.id} />
              </div>
            </details>

          </div>

        </div>  
      </div>  

      {/* ========================================== */}  
      {/* HORIZONTALLY SCROLLABLE RELATED PRODUCTS   */}  
      {/* ========================================== */}  
      {relatedProducts.length > 0 && (  
        <div className="mt-16 mb-8 pt-10 border-t border-slate-200">  
          <div className="flex items-center justify-between mb-8">  
            <h2 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">You Might Also Like</h2>  
          </div>  

          <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide">  
            {relatedProducts.map((relProduct) => {
              const relAny = relProduct as any; 
              const isRelSold = relProduct.status === "sold" || Number(relProduct.stock) <= 0;
              const isRelNew = checkIsNew(relProduct);
              const isRelApproved = relAny.isApprovedQuality;
              const isRelOfficial = relAny.isOfficialStore || relAny.isAdminUpload;

              return (
                <Link   
                  key={relProduct.id}   
                  href={`/product/${relProduct.publicId || relProduct.id}`}   
                  className={`flex-none w-[150px] sm:w-[190px] snap-start bg-white rounded-md border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-all relative ${isRelSold ? 'opacity-80 grayscale-[20%]' : ''}`}  
                >  
                  <div className="aspect-square relative bg-slate-50 overflow-hidden border-b border-slate-100">  
                    {relProduct.images?.[0] ? (  
                      <Image   
                        src={relProduct.images[0]}   
                        alt={relProduct.name}  
                        fill   
                        sizes="(max-width: 768px) 150px, 190px"  
                        className="object-cover transition-transform duration-500 hover:scale-105"  
                      />  
                    ) : (  
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">No Image</div>  
                    )}  

                    {isRelSold && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                         <span className="bg-slate-900 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-lg transform -rotate-6">
                           Sold Out
                         </span>
                      </div>
                    )}

                    {!isRelSold && isRelNew && (
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 z-10">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                         New
                      </div>
                    )}

                    {!isRelSold && (isRelApproved || isRelOfficial) && (
                      <div className={`absolute bottom-0 left-0 ${isRelApproved ? 'bg-emerald-600' : 'bg-[#FF6A00]'} text-white text-[8px] font-bold px-1.5 py-1 leading-none rounded-tr-sm z-10 tracking-widest uppercase shadow-sm`}>
                         {isRelApproved ? 'Approved Quality' : 'Official Product'}
                      </div>
                    )}
                  </div>  

                  <div className="p-3 flex flex-col flex-grow">  
                    <h3 className="text-xs sm:text-sm font-medium text-[#6B6B6B] line-clamp-2 leading-snug mb-1">  
                      {relProduct.name}  
                    </h3>  
                    <div className="mt-auto pt-1 flex flex-col">  
                      <span className={`text-sm sm:text-base font-black ${isRelSold ? 'text-slate-500' : 'text-[#1A1A1A]'}`}>
                        UGX {Number(relProduct.price).toLocaleString()}
                      </span>  
                    </div>  
                  </div>  
                </Link>  
              )
            })}  

            <Link 
              href={`/category/${safeCategory}`} 
              className="flex-none w-[150px] sm:w-[190px] snap-start bg-slate-50 rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-500 p-4 hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </div>
              <span className="text-sm font-black text-center uppercase tracking-wider">
                View All
              </span>
            </Link>
          </div>  
        </div>  
      )}  

      <div className="mt-8 mb-12 border-t border-slate-200 pt-8 text-center px-4">
        <p className="text-[#6B6B6B] text-sm font-medium">
          Got something to sell?{' '}
          <Link 
            href="/sell" 
            className="text-[#FF6A00] font-bold underline decoration-2 underline-offset-4"
          >
            Start selling on Kabale Online
          </Link>
        </p>
      </div>

    </div>
  );
}
