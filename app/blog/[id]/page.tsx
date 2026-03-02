import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";
import { marked } from "marked";
import BlogControls from "@/components/BlogControls";

export const revalidate = 60; // Refresh cache every 60 seconds

type Props = { params: { id: string } };

// --- DYNAMIC SEO FOR WHATSAPP/TWITTER ---
export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const snap = await adminDb.collection("blog_posts").doc(params.id).get();
  if (!snap.exists) return { title: "Article Not Found | Kabale Online" };
  
  const post = snap.data();
  const displayImage = post?.featuredImage || post?.image || "/og-image.jpg";

  return {
    title: `${post?.title} | Kabale Online Journal`,
    description: post?.excerpt || "Read the latest updates on Kabale Online.",
    openGraph: {
      title: post?.title,
      description: post?.excerpt,
      images: [{ url: displayImage, width: 1200, height: 630 }],
      type: "article",
    }
  };
}

// --- MAIN SERVER COMPONENT ---
export default async function BlogPostPage({ params }: Props) {
  const snap = await adminDb.collection("blog_posts").doc(params.id).get();
  if (!snap.exists) notFound();

  const post = { id: snap.id, ...snap.data() } as any;

  // Fetch Related Posts
  const relatedQuery = await adminDb.collection("blog_posts")
    .where("category", "==", post.category || "General")
    .orderBy("publishedAt", "desc")
    .limit(4)
    .get();

  const relatedPosts = relatedQuery.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(p => p.id !== post.id)
    .slice(0, 3);

  const dateStr = post.publishedAt ? new Date(post.publishedAt._seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently";
  const htmlContent = await marked.parse(post.content || "No content available.");
  const displayImage = post.featuredImage || post.image;

  return (
    <>
      <BlogControls postId={post.id} title={post.title} />

      <main className="pb-20">
        <article className="kb-article-wrapper">
          <header className="kb-post-header">
            <span className="kb-cat-badge">{post.category || 'Journal'}</span>
            <h1 className="kb-post-title">{post.title}</h1>
            <div className="kb-author-meta">
              <img src="/icon-192x192.png" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #eee' }} alt="Author" />
              <div>
                <span style={{ fontWeight: 700, color: '#111' }}>{post.author || "Kabale Online"}</span><br />
                <span style={{ color: '#666', fontSize: '0.85rem' }}>{dateStr}</span> • <span style={{ color: '#666', fontSize: '0.85rem' }}>{post.readTime || '3 min read'}</span>
              </div>
            </div>
          </header>

          {displayImage && <img src={displayImage} className="kb-hero-img" alt={post.title} />}

          {/* Renders the Markdown as HTML */}
          <div className="kb-post-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />

          {post.tags && post.tags.length > 0 && (
            <div className="kb-tags-list">
              {post.tags.map((tag: string, i: number) => (
                <span key={i} className="kb-tag-item">#{tag}</span>
              ))}
            </div>
          )}
        </article>

        {relatedPosts.length > 0 && (
          <section className="kb-read-next">
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', margin: '0', color: '#111' }}>Read Next</h2>
              <div className="kb-next-grid">
                {relatedPosts.map((related) => (
                  <Link key={related.id} href={`/blog/${related.id}`} className="kb-next-card">
                    <img src={related.featuredImage || related.image || "/og-image.jpg"} className="kb-next-img" alt={related.title} />
                    <div className="kb-next-body">
                      <div style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700, textTransform: 'uppercase', marginBottom: '5px' }}>{related.category}</div>
                      <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0', lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>{related.title}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}