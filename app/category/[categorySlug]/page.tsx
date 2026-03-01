import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";

export const revalidate = 60; 

// Helper to map URL slugs to beautiful page titles and descriptions
const categoryDetails: Record<string, { title: string; description: string }> = {
  "electronics": {
    title: "Electronics Market",
    description: "Laptops, phones, and accessories from trusted vendors in Kabale.",
  },
  "agriculture": {
    title: "Agriculture Market",
    description: "Support local farmers. Buy fresh produce, tools, and supplies.",
  },
  "student_item": {
    title: "Student Market",
    description: "Textbooks, furniture, and campus essentials for Kabale University.",
  }
};

// Dynamically generate the SEO title based on the URL
export async function generateMetadata({ params }: { params: { categorySlug: string } }) {
  const info = categoryDetails[params.categorySlug] || { 
    title: `${params.categorySlug.replace(/_/g, ' ')}`, 
    description: "Browse products on Kabale Online." 
  };
  return {
    title: `${info.title} | Kabale Online`,
    description: info.description,
  };
}

export default async function CategoryPage({ params }: { params: { categorySlug: string } }) {
  // Fetch products strictly for the category in the URL
  const products = await getProducts(params.categorySlug);
  
  // Get the matching text, or generate a fallback if it's a new category
  const info = categoryDetails[params.categorySlug] || {
    title: params.categorySlug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Browse all items in ${params.categorySlug.replace(/_/g, ' ')}.`
  };

  return (
    <div className="py-8">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {info.title}
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          {info.description}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
          <h3 className="text-lg font-medium text-slate-900">No products found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Check back soon! Our vendors are adding new items every day.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/item/${product.publicId || product.id}`}
              className="group flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square bg-slate-100 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name || "Product Image"}
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
                <p className="text-[10px] sm:text-xs text-slate-500 mb-1">
                  ID: {product.publicId || product.id.slice(0, 8)}
                </p>
                <h3 className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2">
                  {product.name || "Unnamed Item"}
                </h3>
                <div className="mt-auto pt-2 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                  <span className="text-sm sm:text-lg font-bold text-primary">
                    UGX {(Number(product.price) || 0).toLocaleString()}
                  </span>
                  <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full w-fit ${
                    (Number(product.stock) || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {(Number(product.stock) || 0) > 0 ? 'In Stock' : 'Out'}
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