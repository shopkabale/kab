import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";

export const revalidate = 60; 

export const metadata = {
  title: "Student Market | Kabale Online",
  description: "Buy and sell items within the Kabale University community.",
};

export default async function StudentsPage() {
  const products = await getProducts("student_item");

  return (
    <div className="py-8">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Student Market
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Textbooks, furniture, and essentials for Kabale University students.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
          <h3 className="text-lg font-medium text-slate-900">No student items found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Be the first to list your old textbooks or furniture!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              
              <div className="flex flex-col flex-grow p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-slate-500 mb-1">ID: {product.publicId}</p>
                <h3 className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2">
                  {product.name}
                </h3>
                <div className="mt-auto pt-2 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                  <span className="text-sm sm:text-lg font-bold text-primary">
                    UGX {product.price.toLocaleString()}
                  </span>
                  <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full w-fit ${
                    product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.stock > 0 ? 'In Stock' : 'Out'}
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