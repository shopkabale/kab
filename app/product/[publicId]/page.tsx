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

  let safeStock = 1;
  if (product.stock !== undefined && product.stock !== null) {
    const parsed = Number(product.stock);
    if (!isNaN(parsed)) {
      safeStock = parsed;
    }
  }

  const sellerNameStr = String(product.sellerName || "").toLowerCase();
  const isAdmin = sellerNameStr.includes('admin') || sellerNameStr.includes('kabale online') || sellerNameStr.includes('official');
  const fakeViews = (safeName.length * 3) + 12;

  const optimizedImages = product.images?.map((img: string) => optimizeImage(img)) || [];

  const rawCategoryProducts = await getProducts(safeCategory, 12);
  const relatedProducts = rawCategoryProducts
    .filter((p) => p.id !== product.id && p.publicId !== product.publicId)
    .sort((a, b) => getDailyRandomScore(a.id) - getDailyRandomScore(b.id))
    .slice(0, 8) 
    .map((p) => ({
      ...p,
      images: p.images?.map((img: string) => optimizeImage(img)) || []
    }));

  const renderDescription = (desc?: string) => {
    if (!desc) return <p className="text-slate-700 text-sm">No description provided by the seller.</p>;

    const lines = desc.split('\n').filter(line => line.trim() !== '');

    return (
      <ul className="space-y-2">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
          return (
            <li key={idx} className="text-slate-700 text-sm leading-relaxed flex items-start gap-2">
              <span className="text-slate-400 mt-[2px]">✓</span>
              <span>{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    // 🔥 Added pb-24 on mobile so content doesn't get hidden behind the new sticky bottom bar
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 pb-28 sm:pb-8">
      <ProductTracker productId={product.id} />
      <RecentlyViewedTracker product={product} />   

      {/* BREADCRUMBS */}  
      <div className="mb-6 flex items-center text-sm text-slate-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">  
        <Link href="/" className="hover:text-[#D97706] transition-colors">Home</Link>  
        <span className="mx-2">/</span>  
        <Link href={`/category/${safeCategory}`} className="hover:text-[#D97706] transition-colors capitalize">  
          {safeCategory.replace(/_/g, ' ')}  
        </Link>  
        <span className="mx-2">/</span>  
        <span className="text-slate-900 truncate max-w-[200px]">{safeName}</span>  
      </div>  

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12 relative">  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 p-6 lg:p-8">  

          {/* LEFT COLUMN: Image Gallery & Color Notice */}  
          <div className="w-full mb-8 lg:mb-0 flex flex-col">  
            <ImageGallery images={optimizedImages} title={safeName} />  
            <p className="text-[11px] text-slate-400 mt-4 text-center italic">  
              * Note: Actual color variations may occur due to lighting or screen settings.  
            </p>  
          </div>  

          {/* RIGHT COLUMN: Product Details */}  
          <div className="flex flex-col h-full">  

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">  
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${  
                safeCondition === 'new' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'  
              }`}>  
                {safeCondition === 'new' ? 'Brand New' : 'Used'}  
              </span>  
            </div>  

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">  
              {safeName}
            </h1>  

            {/* Price */}
            <div className="mb-6 flex items-center gap-4">  
              <span className="text-4xl font-black text-[#D97706]">  
                UGX {safePrice.toLocaleString()}  
              </span>  
            </div>  

            {/* 1. HIGH PRIORITY BUY ACTION (Right Below Price!) */}
            <div className="mb-8 border-b border-slate-100 pb-8">
              <FastBuy product={{...product, images: optimizedImages}} />

              <ProductActions product={{...product, images: optimizedImages}}>
                 <div className="flex flex-col gap-3 mt-2 w-full">
                    <MakeOfferButton product={product} />
                    <SaveProductButton product={product} />
                 </div>
              </ProductActions>
            </div> 

            {/* DESCRIPTION */}  
            <div className="mb-6">  
              <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Description</h3>  
              {renderDescription(product.description)}
            </div>  

            {/* 2. SELLER INFO CARD & CHAT BUTTON (Right Below Description!) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">About the Seller</h3>
               <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-black text-xl border border-amber-200">
                    {product.sellerName ? product.sellerName.charAt(0).toUpperCase() : "S"}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 flex items-center gap-1">
                      {product.sellerName || "Verified Seller"} 
                      {isAdmin && <span className="bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>}
                    </p>
                    <p className="text-xs font-medium text-slate-500">Typically replies within minutes</p>
                  </div>
               </div>
               
               {/* Ghost Button for Questions */}
               <a 
                 href={`https://wa.me/256740373021?text=${encodeURIComponent(`Hi! I have a question about this item on Kabale Online: *${safeName}*\n\nProduct ID: [${product.id}]`)}`}
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm shadow-sm"
               >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  Have questions? Chat with seller
               </a>
            </div>

            {/* 2-COLUMN SPECS TABLE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-auto mb-4">
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-slate-200">
                  <tr className="divide-x divide-slate-200 bg-white">
                    <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Stock Status</th>
                    <td className="px-4 py-3 text-slate-900 font-medium flex items-center">
                      <span className={safeStock > 0 ? "text-green-700" : "text-red-600"}>
                        {safeStock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                      {safeStock > 0 && safeStock <= 3 && <span className="text-slate-500 font-normal ml-1">(Few left!)</span>}
                    </td>
                  </tr>
                  <tr className="divide-x divide-slate-200 bg-white">
                    <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Location</th>
                    <td className="px-4 py-3 text-slate-900">Available in Kabale</td>
                  </tr>
                  <tr className="divide-x divide-slate-200 bg-white">
                    <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Delivery</th>
                    <td className="px-4 py-3 text-slate-900">Same day (if ordered 7 AM - 3 PM)</td>
                  </tr>
                  <tr className="divide-x divide-slate-200 bg-white">
                    <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Sold By</th>
                    <td className="px-4 py-3 text-slate-900 font-bold uppercase">
                      {product.sellerName || "Verified Seller"} {isAdmin && "✓"}
                    </td>
                  </tr>
                  <tr className="divide-x divide-slate-200 bg-white">
                    <th className="w-1/3 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Activity</th>
                    <td className="px-4 py-3 text-slate-900">🔥 {fakeViews} viewing today</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>  
        </div>  
      </div>  

      {/* HORIZONTALLY SCROLLABLE RELATED PRODUCTS */}  
      {relatedProducts.length > 0 && (  
        <div className="mt-16 mb-8">  
          <div className="flex items-center justify-between mb-6">  
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">You Might Also Like</h2>  
          </div>  

          <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide">  
            {relatedProducts.map((relProduct) => (  
              <Link   
                key={relProduct.id}   
                href={`/product/${relProduct.publicId || relProduct.id}`}   
                className="flex-none w-[160px] sm:w-[220px] snap-start bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:border-[#D97706] hover:shadow-md transition-all"  
              >  
                <div className="aspect-square relative bg-slate-100 overflow-hidden border-b border-slate-100">  
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

                <div className="p-4 flex flex-col flex-grow">  
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">  
                    {safeCategory.replace(/_/g, ' ')}  
                  </span>  
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2 h-[40px]">  
                    {relProduct.name}  
                  </h3>  
                  <div className="mt-auto pt-2">  
                    <p className="text-base font-black text-[#D97706]">UGX {Number(relProduct.price).toLocaleString()}</p>  
                  </div>  
                </div>  
              </Link>  
            ))}  

            <Link 
              href={`/category/${safeCategory}`} 
              className="flex-none w-[160px] sm:w-[220px] snap-start bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 p-4 hover:border-slate-300 transition-colors"
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

      {/* SELLER ACQUISITION PROMPT */}
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

      {/* 🔥 3. THE MOBILE STICKY BOTTOM BAR 🔥 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex sm:hidden items-center justify-between z-50 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.1)]">
         <div className="flex flex-col pl-2">
           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Price</span>
           <span className="text-lg font-black text-[#D97706]">UGX {safePrice.toLocaleString()}</span>
         </div>
         <div className="w-[160px]">
           {/* Reusing your FastBuy component keeps the logic clean and perfectly synced! */}
           <FastBuy product={{...product, images: optimizedImages}} />
         </div>
      </div>

    </div>
  );
}
