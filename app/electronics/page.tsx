import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";

// ISR: Revalidate this page every 60 seconds so new products appear quickly
export const revalidate = 60; 

export const metadata = {
  title: "Electronics | Kabale Online",
  description: "Buy and sell electronics locally in Kabale town.",
};

export default async function ElectronicsPage() {
  // Fetch products from Firestore strictly where category is "electronics"
  const products = await getProducts("electronics");

  return (
    <div className="py-8">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Electronics Market
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Laptops, phones, and accessories from trusted vendors in Kabale.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
          <h3 className="text-lg font-medium text-slate-900">No electronics found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Check back soon! Our vendors are adding new items every day.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.publicId}`}
              className="group flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square bg-slate-100 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    No Image
                  </div>
                )}
              </div>
              
              <div className="flex flex-col flex-grow p-4">
                <p className="text-xs text-slate-500 mb-1">ID: {product.publicId}</p>
                <h3 className="text-sm font-medium text-slate-900 line-clamp-2">
                  {product.name}
                </h3>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    UGX {product.price.toLocaleString()}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    product.stock > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}