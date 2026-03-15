import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { Store, Product } from "@/types";

interface StorePageProps {
  params: { slug: string };
}

// 1. DATA FETCHING HELPER
async function getStoreData(slug: string) {
  // Fetch the approved store by its unique slug
  const storeSnapshot = await adminDb
    .collection("stores")
    .where("slug", "==", slug)
    .where("isApproved", "==", true)
    .limit(1)
    .get();

  if (storeSnapshot.empty) return null;

  const store = { id: storeSnapshot.docs[0].id, ...storeSnapshot.docs[0].data() } as Store;

  // Fetch only the active products belonging to this specific store/vendor
  const productsSnapshot = await adminDb
    .collection("products")
    .where("sellerId", "==", store.vendorId)
    .where("stock", ">", 0) // Only show items currently in stock
    .orderBy("createdAt", "desc")
    .get();

  const products = productsSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Product)
  );

  return { store, products };
}

// 2. DYNAMIC SEO & OPEN GRAPH METADATA
export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const data = await getStoreData(params.slug);

  if (!data) {
    return {
      title: "Store Not Found | Kabale Online",
      description: "This store does not exist or is no longer active on Kabale Online.",
    };
  }

  const { store } = data;
  const storeUrl = `https://kabaleonline.com/store/${store.slug}`;
  const defaultImage = "https://kabaleonline.com/default-store-banner.jpg"; // Replace with your actual default

  return {
    title: `${store.name} - Shop Local on Kabale Online`,
    description: store.description,
    openGraph: {
      title: `${store.name} is now on Kabale Online`,
      description: store.description,
      url: storeUrl,
      siteName: "Kabale Online",
      images: [
        {
          url: store.banner || store.logo || defaultImage,
          width: 1200,
          height: 630,
          alt: `${store.name} Storefront Banner`,
        },
      ],
      locale: "en_UG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${store.name} - Kabale Online`,
      description: store.description,
      images: [store.banner || store.logo || defaultImage],
    },
  };
}

// 3. MAIN PAGE COMPONENT
export default async function PublicStorePage({ params }: StorePageProps) {
  const data = await getStoreData(params.slug);

  // If the store doesn't exist or isn't approved, show the 404 page
  if (!data) {
    notFound(); 
  }

  const { store, products } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Store Header & Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12 relative">
        {/* Banner Area */}
        <div className="h-48 sm:h-64 w-full relative bg-slate-900">
          {store.banner ? (
            <Image src={store.banner} alt={`${store.name} Banner`} fill className="object-cover opacity-90" priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 opacity-90"></div>
          )}
        </div>
        
        {/* Profile Info Overlay */}
        <div className="px-6 sm:px-10 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 relative -mt-16 sm:-mt-20">
          
          {/* Logo */}
          <div className="h-32 w-32 sm:h-40 sm:w-40 bg-white rounded-full p-1.5 shadow-xl z-10 relative flex-shrink-0 border border-slate-100">
            {store.logo ? (
              <Image src={store.logo} alt={store.name} fill className="rounded-full object-cover" />
            ) : (
              <div className="h-full w-full bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-5xl">
                {store.name.charAt(0)}
              </div>
            )}
            {/* Verified Badge */}
            <div className="absolute bottom-2 right-2 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-sm" title="Verified Premium Store">
              ✓
            </div>
          </div>
          
          {/* Text Details */}
          <div className="text-center sm:text-left flex-grow pt-2 sm:pt-0">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{store.name}</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">{store.description}</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
              {store.phone && (
                <a href={`tel:${store.phone}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                  📞 {store.phone}
                </a>
              )}
              {store.rating && (
                <div className="inline-flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                  ⭐ {store.rating.toFixed(1)} <span className="text-slate-500 font-medium">({store.ratingCount} reviews)</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Share Button */}
          <a 
            href={`https://wa.me/?text=Check out ${store.name} on Kabale Online! %0A%0Ahttps://kabaleonline.com/store/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto mt-4 sm:mt-0 bg-[#25D366] text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-[#20bd5a] transition-colors shadow-md flex items-center justify-center gap-2"
          >
            Share on WhatsApp
          </a>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Available Products</h2>
        <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{products.length} Items</span>
      </div>

      {products.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4 opacity-50">📦</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No products available</h3>
          <p className="text-slate-500">This store doesn't have any items in stock right now. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {products.map((product) => {
            const hasImages = Array.isArray(product.images) && product.images.length > 0;
            const now = Date.now();
            const isFeatured = product.featured && product.featuredUntil && product.featuredUntil > now;
            const isUrgent = product.urgent && product.urgentUntil && product.urgentUntil > now;

            return (
              <Link href={`/product/${product.publicId || product.id}`} key={product.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full relative">
                
                {/* Product Badges */}
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                  {isUrgent && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase">Urgent</span>}
                  {isFeatured && <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase">Featured</span>}
                </div>

                <div className="aspect-square relative bg-slate-100 overflow-hidden border-b border-slate-100">
                  {hasImages ? (
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 font-bold text-xs uppercase">No Image</div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 leading-snug uppercase tracking-tight mb-2">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                    <p className="text-sm sm:text-lg font-black text-amber-600">UGX {Number(product.price).toLocaleString()}</p>
                    {product.condition && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Condition: {product.condition}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
