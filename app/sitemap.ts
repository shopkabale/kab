import { MetadataRoute } from 'next';
import { adminDb } from "@/lib/firebase/admin";

// 🔥 1. CACHE THE SITEMAP FOR 24 HOURS (86400 seconds)
// This ensures Next.js only asks Firebase for this data ONCE per day in production.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.kabaleonline.com";

  // 2. Fetch Dynamic Products
  // Increased limit to 1000 as requested.
  const productsSnap = await adminDb
    .collection("products")
    .orderBy("createdAt", "desc")
    .limit(1000) 
    .get();

  const productEntries = productsSnap.docs.map((doc) => {
    const data = doc.data();
    // SEO Fix: Use actual DB timestamps so Google knows exactly when content updated
    const lastMod = data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date();
    
    return {
      url: `${baseUrl}/product/${data.publicId || doc.id}`,
      lastModified: lastMod,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    };
  });

  // 3. Fetch Dynamic Blog Posts
  // Increased limit to 1000 as requested.
  const blogSnap = await adminDb
    .collection("blog_posts")
    .orderBy("publishedAt", "desc")
    .limit(1000) 
    .get();

  const blogEntries = blogSnap.docs.map((doc) => {
    const data = doc.data();
    const lastMod = data.updatedAt?.toDate() || data.publishedAt?.toDate() || new Date();
    
    return {
      url: `${baseUrl}/blog/${doc.id}`,
      lastModified: lastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    };
  });

  // 4. Category Hubs (Crucial for SEO)
  const categories = ["electronics", "agriculture", "student_item"];

  const categoryEntries = categories.map(cat => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // 5. All Static & High-Value Pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/officialStore`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/sell`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/ai`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/requests`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  return [
    ...staticPages,
    ...categoryEntries,
    ...productEntries,
    ...blogEntries
  ] as MetadataRoute.Sitemap;
}
