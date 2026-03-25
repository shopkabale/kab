export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductByPublicId, getProducts } from "@/lib/firebase/firestore";
import ImageGallery from "@/components/ImageGallery";
import ProductActions from "@/components/ProductActions";
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

  // ==========================================
  // 2. BULLETPROOF ADMIN CHECK & FOMO MATH
  // ==========================================
  const sellerNameStr = String(product.sellerName || "").toLowerCase();
  const isAdmin = sellerNameStr.includes('admin') || sellerNameStr.includes('kabale online') || sellerNameStr.includes('official');
  const fakeViews = (safeName.length * 3) + 12;

  // ==========================================
  // 3. OPTIMIZE IMAGES
  // ==========================================
  const optimizedImages = product.images?.map((img: string) => optimizeImage(img)) || [];

  // ==========================================
  // 4. FETCH RELATED PRODUCTS
  // ==========================================
  const rawCategoryProducts = await getProducts(safeCategory);
  const relatedProducts = rawCategoryProducts
    .filter((p) => p.id !== product.id && p.publicId !== product.publicId)
    .sort(() => 0.5 - Math.random())
    .slice(0, 8) // Grab up to 8 for the scrollable list
    .map((p) => ({
      ...p,
      images: p.images?.map((img: string) => optimizeImage(img)) || []
    }));

  // ==========================================
  // 5. HELPER: RENDER DESCRIPTION AS BULLETS
  // ==========================================
  const renderDescription = (desc?: string) => {
    if (!desc) return <p className="text-slate-700 text-sm">No description provided by the seller.</p>;
    
    // Split by newlines and remove empty lines
    const lines = desc.split('\n').filter(line => line.trim() !== '');
    
    return (
      <ul className="space-y-2">
        {lines.map((line, idx) => {
          // Strip existing dashes or bullets so we don't double up
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
      <div className="mb-6 flex items-center text-sm text-slate-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">  
        <Link href="/" className="hover:text-[#D97706] transition-colors">Home</Link>  
        <span className="mx-2">/</span>  
        <Link href={`/category/${safeCategory}`} className="hover:text-[#D97706] transition-colors capitalize">  
          {safeCategory.replace(/_/g, ' ')}  
        </Link>  
        <span className="mx-2">/</span>  
        <span className="text-slate-900 truncate max-w-[200px]">{safeName}</span>  
      </div>  

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">  
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

            {/* HIGH PRIORITY ACTIONS (Chat & Buy Now) */}
            <div className="mb-8 border-b border-slate-100 pb-8">
              <ProductActions product={{...product, images: optimizedImages}}>
                 {/* Inject Make Offer and Save into the "More actions" drawer */}
                 <div className="flex flex-col gap-3 mt-2 w-full">
                    <MakeOfferButton product={product} />
                    <SaveProductButton product={product} />
                 </div>
              </ProductActions>
            </div> 

            {/* DESCRIPTION */}  
            <div className="mb-8">  
              <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Description</h3>  
              {renderDescription(product.description)}
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

      {/* ========================================== */}  
      {/* HORIZONTALLY SCROLLABLE RELATED PRODUCTS   */}  
      {/* ========================================== */}  
      {relatedProducts.length > 0 && (  
        <div className="mt-16 mb-8">  
          <div className="flex items-center justify-between mb-6">  
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">You Might Also Like</h2>  
          </div>  

          {/* Scrollable Container */}
          <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide">  
            {relatedProducts.map((relProduct) => (  
              <Link   
                key={relProduct.id}   
                href={`/product/${relProduct.publicId || relProduct.id}`}   
                className="flex-none w-[160px] sm:w-[220px] snap-start bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col"  
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
              className="flex-none w-[160px] sm:w-[220px] snap-start bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 p-4"
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
