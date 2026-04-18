import { MetadataRoute } from 'next';
import { adminDb } from "@/lib/firebase/admin";

// 🔥 CACHE THE SITEMAP FOR 24 HOURS (86400 seconds)
export const revalidate = 86400;

// Helper to safely parse your mix of integer and Firestore timestamps
const parseDate = (val: any): Date => {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate(); // Firestore Timestamp
  if (typeof val === 'number') return new Date(val); // Milliseconds (int64)
  if (val.seconds) return new Date(val.seconds * 1000); // Alternative Firestore format
  try {
    return new Date(val);
  } catch (e) {
    return new Date();
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.kabaleonline.com";

  // 1. Fetch Dynamic Products
  const productsSnap = await adminDb
    .collection("products")
    .orderBy("createdAt", "desc")
    .limit(1000) 
    .get();

  const productEntries = productsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      url: `${baseUrl}/product/${data.publicId || doc.id}`,
      lastModified: parseDate(data.updatedAt || data.createdAt),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    };
  });

  // 2. Fetch Dynamic Blog Posts
  const blogSnap = await adminDb
    .collection("blog_posts")
    .orderBy("publishedAt", "desc")
    .limit(1000) 
    .get();

  const blogEntries = blogSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      url: `${baseUrl}/blog/${doc.id}`,
      lastModified: parseDate(data.updatedAt || data.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    };
  });

  // 3. Category Hubs 
  const categories = ["electronics", "agriculture", "student_item", "ladies" , "watches"]; // <-- Added 'ladies' category here

  const categoryEntries = categories.map(cat => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // 4. All Static & High-Value Pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/officialStore`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
{ url: `${baseUrl}/policies`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/ladies`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 }, // <-- Added the new Ladies landing page here
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
