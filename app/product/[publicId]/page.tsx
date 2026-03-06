import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByPublicId } from "@/lib/firebase/firestore";
import ImageGallery from "@/components/ImageGallery";
import ProductActions from "@/components/ProductActions";
import ProductTracker from "@/components/ProductTracker";

export const revalidate = 60; 

export async function generateMetadata({ params }: { params: { publicId: string } }): Promise<Metadata> {
  const product = await getProductByPublicId(params.publicId);

  if (!product) return { title: "Item Not Found | Kabale Online" };

  const safeName = product.name || "Unnamed Item";
  const formattedPrice = `UGX ${(Number(product.price) || 0).toLocaleString()}`;
  
  // SEO Title with "Available in Kabale" injected automatically
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
  
  // Fake FOMO Math (Generates consistent fake numbers based on the product name length so they don't jump around)
  const fakeViews = (safeName.length * 3) + 12;
  const fakeBought = (safeName.length % 4) + 2;

  // Admin check (Adjust these strings to match your actual admin display name)
  const isAdmin = product.sellerName?.toLowerCase().includes('admin') || product.sellerName?.toLowerCase().includes('kabale online');

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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 p-6 lg:p-8">

          {/* LEFT COLUMN: Image Gallery & Color Notice */}
          <div className="w-full mb-8 lg:mb-0 flex flex-col">
            <ImageGallery images={product.images || []} title={safeName} />
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

            {/* Title with injected location */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
              {safeName} <span className="text-lg font-medium text-slate-500 block sm:inline mt-1 sm:mt-0">(Available in Kabale)</span>
            </h1>

            {/* Pricing */}
            <div className="flex items-end gap-4 mt-4 mb-2">
              <span className="text-4xl font-black text-[#D97706]">
                UGX {safePrice.toLocaleString()}
              </span>
            </div>

            {/* FOMO Section */}
            <div className="flex items-center gap-3 text-xs font-bold text-red-600 bg-red-50 py-2 px-3 rounded-lg w-fit mb-6 border border-red-100">
              <span className="animate-pulse">🔥</span>
              <span>{fakeViews} viewing today</span>
              <span className="text-red-300">•</span>
              <span>{fakeBought} bought this week</span>
              <span className="text-red-300">•</span>
              <span>Few remaining!</span>
            </div>

            {/* Same Day Delivery Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 flex items-start gap-3">
              <span className="text-xl">🚚</span>
              <div>
                <p className="text-sm font-bold text-emerald-900">Available in Kabale</p>
                <p className="text-xs text-emerald-700 font-medium">Same day delivery if ordered between 7 AM and 3 PM.</p>
              </div>
            </div>

            {/* Seller Info Box with Official Store Check */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${isAdmin ? 'bg-[#D97706] text-white' : 'bg-slate-200 text-slate-700'}`}>
                {isAdmin ? "K" : (product.sellerName ? product.sellerName.charAt(0).toUpperCase() : "S")}
              </div>
              <div className="overflow-hidden flex-grow">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Sold By</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-slate-900 truncate">{product.sellerName || "Verified Seller"}</p>
                  {isAdmin && (
                    <span className="bg-[#D97706] text-white text-[9px] uppercase font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                      <span>✓</span> Official Store
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">📍 Kabale Town</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 flex-grow">
              <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2 uppercase tracking-wider">Description</h3>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {product.description || "No description provided by the seller."}
              </div>
            </div>

            {/* Actions: Checkout & Extras */}
            <div className="mt-auto border-t border-slate-100 pt-6 space-y-4">
              <Link 
                href={`/checkout/${product.publicId || product.id}`}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                🛒 Proceed to Checkout
              </Link>
              <ProductActions product={product} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}