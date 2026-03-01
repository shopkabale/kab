import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByPublicId } from "@/lib/firebase/firestore";
import ImageGallery from "@/components/ImageGallery";
import ProductActions from "@/components/ProductActions";

// Revalidate every 60 seconds
export const revalidate = 60; 

export default async function ProductDetailsPage({
  params,
}: {
  params: { publicId: string };
}) {
  const product = await getProductByPublicId(params.publicId);

  if (!product) {
    notFound();
  }

  return (
    <div className="py-8 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center text-sm text-slate-500 font-medium">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/${product.category === "student_item" ? "students" : product.category}`} className="hover:text-primary capitalize">
          {product.category.replace('_', ' ')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 truncate">{product.name}</span>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 p-6 lg:p-8">
          
          {/* Left Column: Image Gallery */}
          <div className="w-full mb-8 lg:mb-0">
            <ImageGallery images={product.images || []} title={product.name} />
          </div>

          {/* Right Column: Product Details */}
          <div className="flex flex-col h-full">
            
            {/* Header Section */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {product.category.replace('_', ' ')}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                product.condition === 'new' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {product.condition === 'new' ? 'Brand New' : 'Used'}
              </span>
              <span className="text-xs text-slate-400 font-mono ml-auto">
                ID: {product.publicId || product.id.slice(0, 8)}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-end gap-4 mb-6">
              <span className="text-4xl font-black text-primary">
                UGX {product.price.toLocaleString()}
              </span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full mb-1 ${
                product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Seller Info Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold text-xl">
                {product.sellerName ? product.sellerName.charAt(0).toUpperCase() : "S"}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Sold By</p>
                <p className="text-base font-bold text-slate-900">{product.sellerName || "Verified Seller"}</p>
                <p className="text-sm text-slate-600">📍 Kabale Town</p>
              </div>
            </div>

            {/* Trust Section (Crucial for COD MVP) */}
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

            {/* Description Section */}
            <div className="mb-8 flex-grow">
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Description</h3>
              <div className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap">
                {product.description || "No description provided by the seller."}
              </div>
            </div>

            {/* Interactive Actions (Client Component) */}
            <div className="mt-auto border-t border-slate-100 pt-6">
              <ProductActions product={product} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}