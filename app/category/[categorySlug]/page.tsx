import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/firebase/firestore";

// Force dynamic so Next.js can read the ?page=2 URL parameter perfectly
export const dynamic = "force-dynamic";

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

export default async function CategoryPage({ 
  params,
  searchParams, 
}: { 
  params: { categorySlug: string };
  searchParams: { page?: string };
}) {
  // 1. Fetch products strictly for the category in the URL
  const allCategoryProducts = await getProducts(params.categorySlug);

  // 2. Pagination Setup
  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 12; // Adjust if you want 16 or 20 per page
  const totalItems = allCategoryProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  // 3. Slice the array to get only the items for the current page
  const paginatedProducts = allCategoryProducts.slice(startIndex, startIndex + itemsPerPage);

  // 4. Get the matching text for the header
  const info = categoryDetails[params.categorySlug] || {
    title: params.categorySlug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Browse all items in ${params.categorySlug.replace(/_/g, ' ')}.`
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* HEADER */}
      <div className="mb-8 border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {info.title}
          </h1>
          <p className="mt-2 text-lg text-slate-600 font-medium">
            {info.description}
          </p>
        </div>
        {totalItems > 0 && (
          <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm w-fit">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} items
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {totalItems === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
          <span className="text-5xl block mb-4">🛒</span>
          <h3 className="text-xl font-bold text-slate-900">No products found</h3>
          <p className="mt-2 text-slate-500">
            Check back soon! Our vendors are adding new items to this category every day.
          </p>
        </div>
      ) : (
        <>
          {/* PRODUCT GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {paginatedProducts.map((product) => (
              <Link 
                key={product.id} 
                href={`/product/${product.publicId || product.id}`}
                className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Image Section */}
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name || "Product Image"}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-bold">
                      No Image
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-[9px] font-black text-slate-700 uppercase tracking-widest shadow-sm">
                    {product.category ? product.category.replace('_', ' ') : "General"}
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex flex-col flex-grow p-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    ID: {product.publicId || product.id.slice(0, 8)}
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-[#D97706] transition-colors mb-2">
                    {product.name || "Unnamed Item"}
                  </h3>
                  <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-lg font-black text-[#D97706]">
                      UGX {(Number(product.price) || 0).toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md w-fit ${
                      (Number(product.stock) || 0) > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {(Number(product.stock) || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ========================================== */}
          {/* PAGINATION CONTROLS */}
          {/* ========================================== */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              {currentPage > 1 ? (
                <Link 
                  href={`/category/${params.categorySlug}?page=${currentPage - 1}`}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-[#D97706] transition-colors shadow-sm"
                >
                  ← Previous
                </Link>
              ) : (
                <div className="px-6 py-3 bg-slate-50 border border-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">
                  ← Previous
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">
                  Page <span className="text-slate-900">{currentPage}</span> of {totalPages}
                </span>
              </div>

              {currentPage < totalPages ? (
                <Link 
                  href={`/category/${params.categorySlug}?page=${currentPage + 1}`}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-[#D97706] transition-colors shadow-sm"
                >
                  Next →
                </Link>
              ) : (
                <div className="px-6 py-3 bg-slate-50 border border-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">
                  Next →
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
