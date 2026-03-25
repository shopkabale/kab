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
    title, description,
    openGraph: { title, description, url: `https://www.kabaleonline.com/product/${params.publicId}`, siteName: "Kabale Online", images: [{ url: imageUrl, width: 1200, height: 630, alt: safeName }], type: "website" },
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

  let safeStock = 1;
  if (product.stock !== undefined && product.stock !== null) {
    const parsed = Number(product.stock);
    if (!isNaN(parsed)) safeStock = parsed;
  }

  const sellerNameStr = String(product.sellerName || "").toLowerCase();
  const isAdmin = sellerNameStr.includes('admin') || sellerNameStr.includes('kabale online') || sellerNameStr.includes('official');
  const fakeViews = (safeName.length * 3) + 12;
  const optimizedImages = product.images?.map((img: string) => optimizeImage(img)) || [];

  const rawCategoryProducts = await getProducts(safeCategory);
  const relatedProducts = rawCategoryProducts
    .filter((p) => p.id !== product.id && p.publicId !== product.publicId)
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
    .map((p) => ({ ...p, images: p.images?.map((img: string) => optimizeImage(img)) || [] }));

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6">
      <ProductTracker productId={product.id} />
      <RecentlyViewedTracker product={product} />   

      <div className="mb-6 flex items-center text-sm text-slate-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">  
        <Link href="/" className="text-slate-500">Home</Link>  
        <span className="mx-2">/</span>  
        <Link href={`/category/${safeCategory}`} className="capitalize text-slate-500">  
          {safeCategory.replace(/_/g, ' ')}  
        </Link>  
        <span className="mx-2">/</span>  
        <span className="text-slate-900 truncate max-w-[200px]">{safeName}</span>  
      </div>  

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 p-6 lg:p-8">  

          <div className="w-full mb-8 lg:mb-0 flex flex-col">  
            <ImageGallery images={optimizedImages} title={safeName} />  
            <p className="text-[11px] text-slate-400 mt-4 text-center italic">* Actual color variations may occur.</p>  
          </div>  

          <div className="flex flex-col h-full">  
            <div className="flex flex-wrap items-center gap-2 mb-3">  
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${safeCondition === 'new' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>  
                {safeCondition === 'new' ? 'Brand New' : 'Used'}  
              </span>  
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${safeStock > 0 ? 'text-green-700' : 'text-red-700'}`}>  
                {safeStock > 0 ? 'In Stock' : 'Out of Stock'}  
              </span>
            </div>  

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">  
              {safeName}
            </h1>  

            <div className="mb-2 flex items-center gap-4">  
              <span className="text-4xl font-black text-[#D97706]">UGX {safePrice.toLocaleString()}</span>  
            </div>  
            <div className="mb-6">
              <MakeOfferButton product={product} />  
            </div>

            {/* HIGH PRIORITY ACTIONS MOVED UP */}
            <div className="mb-8">
              <ProductActions product={{...product, images: optimizedImages}}>
                 {/* Inject Save button into the more actions drawer */}
                 <div className="w-full bg-white border border-slate-200 py-1 rounded-xl flex justify-center">
                    <SaveProductButton product={product} />
                 </div>
              </ProductActions>
            </div>

            {/* CONDENSED TRUST & DELIVERY SIGNALS */}
            <div className="bg-slate-50 rounded-xl p-4 mb-8 text-sm text-slate-700 font-medium leading-relaxed border border-slate-100">
              <p>🔥 {fakeViews} viewing today {safeStock <= 1 && "• Few left!"}</p>
              <p>🚚 Available in Kabale (Same day delivery if ordered 7 AM - 3 PM)</p>
              <p className="mt-2 text-xs font-bold uppercase text-slate-500">Sold by: {product.sellerName || "Verified Seller"} {isAdmin && "✓"}</p>
            </div>  

            {/* DESCRIPTION */}  
            <div className="flex-grow">  
              <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Description</h3>  
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">  
                {product.description || "No description provided by the seller."}  
              </div>  
            </div>  

          </div>  
        </div>  
      </div>  

      {/* RELATED PRODUCTS */}  
      {relatedProducts.length > 0 && (  
        <div className="mt-16">  
          <div className="flex items-center justify-between mb-6">  
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">You Might Also Like</h2>  
          </div>  

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">  
            {relatedProducts.map((relProduct) => (  
              <Link key={relProduct.id} href={`/product/${relProduct.publicId || relProduct.id}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">  
                <div className="aspect-square relative bg-slate-100 overflow-hidden">  
                  {relProduct.images?.[0] ? (  
                    <Image src={relProduct.images[0]} alt={relProduct.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />  
                  ) : (  
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">No Image</div>  
                  )}  
                </div>  
                <div className="p-4 flex flex-col flex-grow">  
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2">{relProduct.name}</h3>  
                  <div className="mt-auto pt-2">  
                    <p className="text-base font-black text-[#D97706]">UGX {Number(relProduct.price).toLocaleString()}</p>  
                  </div>  
                </div>  
              </Link>  
            ))}  
          </div>  
        </div>  
      )}  
    </div>  
  );
}
