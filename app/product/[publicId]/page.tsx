import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByPublicId } from "@/lib/firebase/firestore";

export const revalidate = 60; // ISR for performance

export default async function ProductDetailsPage({
  params,
}: {
  params: { publicId: string };
}) {
  const product = await getProductByPublicId(params.publicId);

  if (!product) {
    notFound(); // Triggers a 404 page if the ID doesn't exist
  }

  return (
    <div className="py-8 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link href={`/${product.category === "student_item" ? "students" : product.category}`} className="text-sm text-primary hover:underline">
          &larr; Back to {product.category}
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="md:flex">
          {/* Image Section */}
          <div className="md:w-1/2 relative aspect-square bg-slate-100">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                No Image Available
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-8 flex flex-col">
            <div className="uppercase tracking-wide text-sm text-primary font-semibold">
              ID: {product.publicId}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {product.name}
            </h1>
            
            <div className="mt-6 flex items-end gap-4">
              <span className="text-4xl font-extrabold text-slate-900">
                UGX {product.price.toLocaleString()}
              </span>
              <span className={`text-sm font-medium px-3 py-1 rounded-full mb-1 ${
                product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
              </span>
            </div>

            <div className="mt-10 mb-6 flex-grow">
              <p className="text-slate-600 text-base leading-relaxed">
                This item is sold by a verified vendor on Kabale Online. Payment is strictly Cash on Delivery to ensure your safety and satisfaction.
              </p>
            </div>

            <button 
              disabled={product.stock <= 0}
              className="w-full bg-slate-900 text-white py-4 px-8 rounded-lg font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Order Now (Cash on Delivery)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}