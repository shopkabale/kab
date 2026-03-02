"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Make sure this points to your client config!

export default function AdminBlogDashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all posts when the page loads
  const loadPosts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "blog_posts"), orderBy("publishedAt", "desc"));
      const snap = await getDocs(q);
      
      const fetchedPosts = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      alert("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Handle Deletion
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, "blog_posts", id));
        // Remove the deleted post from the screen instantly without refreshing the page
        setPosts(prev => prev.filter(post => post.id !== id));
      } catch (error: any) {
        alert("Error deleting post: " + error.message);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-slate-900">All Articles</h1>
        <Link 
          href="/admin/blog/upload" 
          className="bg-[#D97706] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-700 transition-colors shadow-sm"
        >
          <span>➕</span> New Article
        </Link>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 w-20">Image</th>
                <th className="p-4">Title</th>
                <th className="p-4 hidden md:table-cell">Category</th>
                <th className="p-4 hidden md:table-cell">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
                      Loading articles...
                    </div>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    No articles yet. Click "New Article" to start writing.
                  </td>
                </tr>
              ) : (
                posts.map(post => {
                  const date = post.publishedAt 
                    ? new Date(post.publishedAt.toDate ? post.publishedAt.toDate() : post.publishedAt).toLocaleDateString() 
                    : 'N/A';
                  const displayImage = post.featuredImage || post.image || '/og-image.jpg';

                  return (
                    <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <img 
                          src={displayImage} 
                          alt="Cover" 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200" 
                        />
                      </td>
                      <td className="p-4">
                        <strong className="text-slate-900 font-bold block leading-tight">{post.title}</strong>
                        {post.isFeatured && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block">Featured</span>}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                          {post.category}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell text-slate-500 text-sm">
                        {date}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Button */}
                          <Link 
                            href={`/admin/blog/upload?id=${post.id}`}
                            className="w-8 h-8 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center hover:bg-sky-200 transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </Link>
                          {/* Delete Button */}
                          <button 
                            onClick={() => handleDelete(post.id, post.title)}
                            className="w-8 h-8 rounded-md bg-red-100 text-red-700 flex items-center justify-center hover:bg-red-200 transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}