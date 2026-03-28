import { MetadataRoute } from 'next';
import { adminDb } from "@/lib/firebase/admin";

// 🔥 1. CACHE THE SITEMAP FOR 24 HOURS (86400 seconds)
// This ensures Next.js only asks Firebase for this data ONCE per day in production.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.kabaleonline.com";

  // 2. Fetch Dynamic Products
  // 🔥 Lowered the limit to 100. For the free tier (50k daily), this is much safer.
  // You want to index your active/recent items, not every item ever sold.
  const productsSnap = await adminDb
    .collection("products")
    .orderBy("createdAt", "desc")
    .limit(100) 
    .get();

  const productEntries = productsSnap.docs.map((doc) => ({
    url: `${baseUrl}/product/${doc.data().publicId || doc.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 3. Fetch Dynamic Blog Posts
  // Lowered to 100. Unless you have more than 100 articles, this is plenty.
  const blogSnap = await adminDb
    .collection("blog_posts")
    .orderBy("publishedAt", "desc")
    .limit(100) 
    .get();

  const blogEntries = blogSnap.docs.map((doc) => ({
    url: `${baseUrl}/blog/${doc.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 4. Category Hubs (Crucial for SEO)
  const categories = ["electronics", "agriculture", "student_item"];

  const categoryEntries = categories.map(cat => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 5. All Static Pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/ai`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/requests`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  return [
    ...staticPages,
    ...categoryEntries,
    ...productEntries,
    ...blogEntries
  ] as MetadataRoute.Sitemap;
}
