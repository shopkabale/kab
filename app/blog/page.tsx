import { adminDb } from "@/lib/firebase/admin";
import Link from "next/link";

// Force dynamic rendering so new articles appear instantly
export const dynamic = "force-dynamic";

export default async function BlogHomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const activeCategory = searchParams.category || "All";

  // 1. Fetch Posts from Firestore
  let postsQuery: FirebaseFirestore.Query = adminDb.collection("blog_posts").orderBy("publishedAt", "desc");
  
  if (activeCategory !== "All") {
    postsQuery = postsQuery.where("category", "==", activeCategory);
  }

  const snapshot = await postsQuery.limit(15).get();
  const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  // 2. Separate Featured vs Regular (Only show featured on the 'All' feed)
  const featuredPost = allPosts.find(p => p.isFeatured);
  const regularPosts = activeCategory === "All" && featuredPost 
    ? allPosts.filter(p => p.id !== featuredPost.id) 
    : allPosts;

  const topRecentPosts = regularPosts.slice(0, 2);
  const feedPosts = activeCategory === "All" && featuredPost ? regularPosts.slice(2) : regularPosts;

  // Categories list
  const CATEGORIES = ["All", "Fashion", "Campus", "Business", "Tech"];

  return (
    <>
      {/* Sticky Navigation */}
      <nav className="kb-sticky-nav">
        <div className="kb-nav-row">
          <div className="kb-filter-row" style={{ width: "100%", justifyContent: "flex-start", gap: "10px" }}>
            {CATEGORIES.map(category => (
              <Link 
                key={category}
                href={category === "All" ? "/blog" : `/blog?category=${category}`}
                className={`kb-chip ${activeCategory === category ? "active" : ""}`}
                style={{ textDecoration: 'none' }}
              >
                {category === "All" ? "All Stories" : category}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="kb-blog-wrapper">
        
        {/* Magazine Hero Grid (Only visible on 'All' category if a featured post exists) */}
        {activeCategory === "All" && featuredPost && (
          <section className="kb-hero-grid">
            <Link href={`/blog/${featuredPost.id}`} className="kb-feat-card">
              <img src={featuredPost.featuredImage || featuredPost.image || "/og-image.jpg"} alt={featuredPost.title} />
              <div className="kb-feat-overlay">
                <span className="kb-feat-badge">{featuredPost.category || "Featured"}</span>
                <h2 className="kb-feat-title">{featuredPost.title}</h2>
              </div>
            </Link>

            <div className="kb-sub-col">
              {topRecentPosts.map(post => {
                 // --- CRASH FIX: Safe date handling ---
                 const dateStr = post.publishedAt && typeof post.publishedAt.toDate === 'function' 
                    ? post.publishedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                    : "Recently";

                 return (
                  <Link key={post.id} href={`/blog/${post.id}`} className="kb-sub-card">
                    <img src={post.featuredImage || post.image || "/og-image.jpg"} alt={post.title} className="kb-sub-img" />
                    <div className="kb-sub-info">
                      <span className="kb-sub-cat">{post.category}</span>
                      <h4>{post.title}</h4>
                      <span style={{ fontSize: "0.75rem", color: "#666" }}>{dateStr}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="kb-layout-split">
          
          {/* Main Feed Column */}
          <div className="kb-feed-col">
            <div className="kb-widget-title">
              {activeCategory === "All" ? "Latest Articles" : `${activeCategory} Articles`}
            </div>

            <div className="kb-feed">
              {feedPosts.length > 0 ? (
                feedPosts.map(post => {
                  // --- CRASH FIX FOR FEED: Bulletproof Date Parsing ---
                  const dateStr = post.publishedAt && typeof post.publishedAt.toDate === 'function' 
                    ? post.publishedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                    : "Recently";

                  return (
                    <Link key={post.id} href={`/blog/${post.id}`} className="kb-article-card">
                      <img src={post.featuredImage || post.image || "/og-image.jpg"} alt={post.title} className="kb-article-img" />
                      <div>
                        <div className="kb-article-meta">
                          <span style={{ color: "#D97706" }}>{post.category}</span> • {dateStr}
                        </div>
                        <h3 className="kb-article-title">{post.title}</h3>
                        <p className="kb-article-excerpt">{post.excerpt}</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  No stories found for <strong>{activeCategory}</strong> yet.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="kb-sidebar">
            {/* Newsletter */}
            <div className="kb-widget kb-newsletter-box">
              <span style={{ fontSize: "2.5rem", display: "block", margin: "0 auto 10px", color: "#D97706" }}>💌</span>
              <h3 style={{ fontSize: "1.4rem" }}>The Weekly Drop</h3>
              <p>Join students getting thrift alerts & campus updates.</p>
              <form action="#" method="POST">
                <input type="email" className="kb-input" placeholder="Your email address" required />
                <button type="submit" className="kb-sub-btn">Subscribe Free</button>
              </form>
              <small style={{ color: "#aaa", fontSize: "0.75rem", marginTop: "10px", display: "block" }}>
                No spam. Unsubscribe anytime.
              </small>
            </div>

            {/* Trending / Popular */}
            <div className="kb-widget">
              <div className="kb-widget-title">Trending Now</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {allPosts.slice(0, 4).map((post) => {
                   const readTimeStr = typeof post.readTime === 'number' ? `${post.readTime} min read` : (post.readTime || '3 min read');
                   return (
                   <Link key={post.id} href={`/blog/${post.id}`} style={{ display: "flex", gap: "15px", alignItems: "center", textDecoration: "none", color: "inherit", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                     <img src={post.featuredImage || post.image || "/og-image.jpg"} style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }} alt={post.title} />
                     <div>
                       <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 4px", color: '#111' }}>{post.title}</h4>
                       <span style={{ fontSize: "0.75rem", color: "#888" }}>{readTimeStr}</span>
                     </div>
                   </Link>
                   );
                })}
              </div>
            </div>
          </aside>

        </div>
      </main>
    </>
  );
}