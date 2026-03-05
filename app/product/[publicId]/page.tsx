import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByPublicId } from "@/lib/firebase/firestore";
import ImageGallery from "@/components/ImageGallery";
import ProductActions from "@/components/ProductActions";
import ProductTracker from "@/components/ProductTracker"; // The invisible view counter

export const revalidate = 60; 

// ============================================================================
// 1. DYNAMIC METADATA: This is the magic that WhatsApp/Facebook reads!
// ============================================================================
export async function generateMetadata({ params }: { params: { publicId: string } }): Promise<Metadata> {
  const product = await getProductByPublicId(params.publicId);

  if (!product) {
    return {
      title: "Item Not Found | Kabale Online",
    };
  }

  const safeName = product.name || "Unnamed Item";
  const formattedPrice = `UGX ${(Number(product.price) || 0).toLocaleString()}`;
  
  const title = `${safeName} - ${formattedPrice} | Kabale Online`;
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
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: safeName,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

// ============================================================================
// 2. THE MAIN PAGE UI
// ============================================================================
export default async function ProductDetailsPage({ params }: { params: { publicId: string } }) {
  const product = await getProductByPublicId(params.publicId);

  if (!product) {
    notFound();
  }

  // Safe Fallbacks
  const safeName = product.name || "Unnamed Item";
  const safePrice = Number(product.price) || 0;
  const safeCondition = product.condition || "used";
  const safeCategory = product.category || "general";

  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6">

      {/* 1. SILENT VIEW TRACKER */}
      <ProductTracker productId={product.id} />

      {/* 2. BREADCRUMBS */}
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

          {/* LEFT COLUMN: Image Gallery */}
          <div className="w-full mb-8 lg:mb-0">
            <ImageGallery images={product.images || []} title={safeName} />
          </div>

          {/* RIGHT COLUMN: Product Details */}
          <div className="flex flex-col h-full">

            {/* Header Tags */}
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
              {safeName}
            </h1>

            {/* Pricing & Stock */}
            <div className="flex items-end gap-4 mb-6">
              <span className="text-4xl font-black text-[#D97706]">
                UGX {safePrice.toLocaleString()}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full mb-1 ${
                (Number(product.stock) || 0) > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {(Number(product.stock) || 0) > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Seller Info Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                {product.sellerName ? product.sellerName.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Sold By</p>
                <p className="text-base font-bold text-slate-900 truncate">{product.sellerName || "Verified Seller"}</p>
                <p className="text-xs text-slate-600 font-medium">📍 Kabale Town</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 mb-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-center flex flex-col items-center">
                <span className="text-2xl mb-1">🤝</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase leading-tight">Cash on<br/>Delivery</span>
              </div>
              <div className="text-center flex flex-col items-center border-l border-r border-slate-100 px-2">
                <span className="text-2xl mb-1">📍</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase leading-tight">Local Kabale<br/>Seller</span>
              </div>
              <div className="text-center flex flex-col items-center">
                <span className="text-2xl mb-1">🛡️</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase leading-tight">Verify Before<br/>Payment</span>
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

              {/* Secondary Buttons (WhatsApp, Share, etc.) */}
              <ProductActions product={product} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}