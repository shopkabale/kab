import { MetadataRoute } from 'next';
import { adminDb } from "@/lib/firebase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.kabaleonline.com";

  // 1. Fetch Dynamic Products
  // Removed .limit(50) to fetch all products. 
  // Added a generous limit of 10,000 as a best practice safety net.
  const productsSnap = await adminDb
    .collection("products")
    .orderBy("createdAt", "desc")
    .limit(10000) 
    .get();

  const productEntries = productsSnap.docs.map((doc) => ({
    url: `${baseUrl}/product/${doc.data().publicId || doc.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 2. Fetch Dynamic Blog Posts
  // Removed .limit(30) to fetch all blog posts.
  const blogSnap = await adminDb
    .collection("blog_posts")
    .orderBy("publishedAt", "desc")
    .limit(10000) 
    .get();

  const blogEntries = blogSnap.docs.map((doc) => ({
    url: `${baseUrl}/blog/${doc.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 3. Category Hubs (Crucial for SEO)
  const categories = ["electronics", "agriculture", "student_item"];

  const categoryEntries = categories.map(cat => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 4. All Static Pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
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
