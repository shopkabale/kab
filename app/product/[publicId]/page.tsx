import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image"; // 👈 Added for the related products grid
import { notFound } from "next/navigation";
import { getProductByPublicId, getProducts } from "@/lib/firebase/firestore"; // 👈 Imported getProducts
import ImageGallery from "@/components/ImageGallery";
import ProductActions from "@/components/ProductActions";
import ProductTracker from "@/components/ProductTracker";
import { optimizeImage } from "@/lib/utils"; 

export const revalidate = 60; 

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

  const fomoStockText = safeStock <= 1 ? "Very few left!" : "Few remaining!";

  // ==========================================
  // 2. BULLETPROOF ADMIN CHECK
  // ==========================================
  const sellerNameStr = String(product.sellerName || "").toLowerCase();
  const isAdmin = sellerNameStr.includes('admin') || sellerNameStr.includes('kabale online') || sellerNameStr.includes('official');

  // Fake FOMO Math
  const fakeViews = (safeName.length * 3) + 12;
  const fakeBought = (safeName.length % 4) + 2;

  // 🔥 3. OPTIMIZE THE MAIN IMAGE GALLERY 🔥
  const optimizedImages = product.images?.map((img: string) => optimizeImage(img)) || [];

  // ==========================================
  // 4. FETCH RELATED PRODUCTS
  // ==========================================
  const rawCategoryProducts = await getProducts(safeCategory);
  
  const relatedProducts = rawCategoryProducts
    // Remove the current product from the list
    .filter((p) => p.id !== product.id && p.publicId !== product.publicId)
    // Randomize them so it feels fresh every time
    .sort(() => 0.5 - Math.random())
    // Keep only 4 to keep the page clean and fast
    .slice(0, 4)
    // Optimize their thumbnail images!
    .map((p) => ({
      ...p,
      images: p.images?.map((img: string) => optimizeImage(img)) || []
    }));

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6">
      <ProductTracker productId={product.id} />

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

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                ID: {product.publicId || product.id.slice(0, 8)}
              </span>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                safeCondition === 'new' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {safeCondition === 'new' ? 'Brand New' : 'Used'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              {safeName} <span className="text-lg font-medium text-slate-500 block sm:inline mt-1 sm:mt-0">(Available in Kabale)</span>
            </h1>

            <div className="mb-3">
              <span className="text-4xl font-black text-[#D97706]">
                UGX {safePrice.toLocaleString()}
              </span>
            </div>

            <div className="mb-6">
              <span className={`text-sm font-bold px-4 py-1.5 rounded-md ${
                safeStock > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {safeStock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="flex flex-col gap-3 mb-6 bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <span className="animate-pulse text-lg">🔥</span>
                <span>{fakeViews} viewing today</span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <span className="text-lg">🛒</span>
                  <span>{fakeBought} bought this week</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                <span className="text-lg">⏳</span>
                <span>{fomoStockText}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <span className="text-xl">🚚</span>
              <div>
                <p className="text-sm font-bold text-emerald-900">Available in Kabale</p>
                <p className="text-xs text-emerald-700 font-medium mt-1">Same day delivery if ordered between 7 AM and 3 PM.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 flex items-center gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${isAdmin ? 'bg-[#D97706] text-white' : 'bg-slate-200 text-slate-700'}`}>
                {isAdmin ? "K" : (product.sellerName ? product.sellerName.charAt(0).toUpperCase() : "S")}
              </div>
              <div className="overflow-hidden flex-grow flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Sold By</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 truncate">{product.sellerName || "Verified Seller"}</span>
                  {isAdmin && (
                    <span className="bg-[#D97706] text-white text-[10px] uppercase font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                      <span>✓</span> Official Store
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-600 font-medium">📍 Kabale Town</span>
              </div>
            </div>

            <div className="mb-8 flex-grow">
              <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2 uppercase tracking-wider">Description</h3>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {product.description || "No description provided by the seller."}
              </div>
            </div>

            <div className="mt-auto border-t border-slate-100 pt-6">
              <ProductActions product={{...product, images: optimizedImages}} />
            </div>

          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* RELATED PRODUCTS SECTION                   */}
      {/* ========================================== */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">You Might Also Like</h2>
            <Link href={`/category/${safeCategory}`} className="text-sm font-bold text-[#D97706] hover:text-amber-600 transition-colors hidden sm:block">
              View more
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((relProduct) => (
              <Link 
                key={relProduct.id} 
                href={`/product/${relProduct.publicId || relProduct.id}`} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group flex flex-col"
              >
                {/* Image */}
                <div className="aspect-square relative bg-slate-100 overflow-hidden">
                  {relProduct.images?.[0] ? (
                    <Image 
                      src={relProduct.images[0]} 
                      alt={relProduct.title || relProduct.name} 
                      fill 
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
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
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-[#D97706] transition-colors">
                    {relProduct.title || relProduct.name}
                  </h3>
                  <div className="mt-auto pt-2">
                    <p className="text-base font-black text-[#D97706]">UGX {Number(relProduct.price).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Mobile 'View more' button */}
          <Link href={`/category/${safeCategory}`} className="block sm:hidden text-center mt-6 w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200">
            View more {safeCategory.replace(/_/g, ' ')}
          </Link>
        </div>
      )}

    </div>
  );
}
