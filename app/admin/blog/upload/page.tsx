"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config"; // Ensure this is your client DB

// 1. DYNAMICALLY IMPORT THE EDITOR (Crucial for Next.js)
// This prevents SSR crashes because the editor needs the 'window' object
import dynamic from "next/dynamic";
import "easymde/dist/easymde.min.css";
const SimpleMdeReact = dynamic(() => import("react-simplemde-editor"), { ssr: false });

export default function BlogUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("id");

  // --- FORM STATE ---
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  
  // --- IMAGE STATE ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!editId);

  // --- LOAD EXISTING POST FOR EDITING ---
  useEffect(() => {
    if (editId) {
      const fetchPost = async () => {
        try {
          const snap = await getDoc(doc(db, "blog_posts", editId));
          if (snap.exists()) {
            const d = snap.data();
            setTitle(d.title || "");
            setContent(d.content || "");
            setCategory(d.category || "Fashion");
            setTags(d.tags ? d.tags.join(", ") : "");
            setReadTime(d.readTime || "");
            setExcerpt(d.excerpt || "");
            setIsFeatured(d.isFeatured || false);
            
            const imgSrc = d.featuredImage || d.image;
            if (imgSrc) {
              setExistingImageUrl(imgSrc);
              setPreviewUrl(imgSrc);
            }
          }
        } catch (error) {
          console.error("Error loading post:", error);
          alert("Failed to load article.");
        } finally {
          setPageLoading(false);
        }
      };
      fetchPost();
    }
  }, [editId]);

  // --- HANDLE IMAGE SELECTION ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- SUBMIT: UPLOAD & SAVE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length < 10) return alert("Content is too short!");
    if (!editId && !imageFile && !existingImageUrl) return alert("Cover Image Required!");

    setLoading(true);

    try {
      let finalImageUrl = existingImageUrl;

      // 1. Upload new image to Cloudinary if selected
      if (imageFile) {
        // NOTE: Make sure this matches your Next.js Cloudinary API route!
        const sigRes = await fetch('/api/cloudinary/sign', { method: "POST" }); 
        const sigData = await sigRes.json();

        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('api_key', sigData.apiKey);
        fd.append('timestamp', sigData.timestamp);
        fd.append('signature', sigData.signature);
        fd.append('folder', 'kabale_blog');

        const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, { 
          method: 'POST', body: fd 
        });
        const upData = await upRes.json();

        if (upData.error) throw new Error(upData.error.message);
        finalImageUrl = upData.secure_url;
      }

      // 2. Prepare Data
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t !== "");

      const postData = {
        title,
        content,
        category,
        tags: tagsArray,
        readTime,
        excerpt,
        isFeatured,
        featuredImage: finalImageUrl,
        image: finalImageUrl, // Legacy backup
        author: "Kabale Editor",
        updatedAt: serverTimestamp(),
      };

      // 3. Save to Firestore
      if (editId) {
        await updateDoc(doc(db, "blog_posts", editId), postData);
        alert("Article Updated! ✅");
      } else {
        await addDoc(collection(db, "blog_posts"), {
          ...postData,
          publishedAt: serverTimestamp(),
          views: 0,
        });
        alert("Article Published! 🎉");
      }

      // 4. Redirect back to Dashboard
      router.push("/admin/blog");

    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="p-10 text-center font-bold">Loading Editor...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-slate-900">
          {editId ? "Edit Article" : "Write New Article"}
        </h1>
        <button onClick={() => router.push("/admin/blog")} className="text-slate-500 hover:text-slate-800 font-medium">
          ← Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Article Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D97706] outline-none font-bold text-lg" 
                placeholder="e.g. 5 Thrift Tips for Students" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Content (Markdown)</label>
              {/* This replaces your old HTML <textarea> */}
              <div className="prose max-w-none">
                <SimpleMdeReact 
                  value={content} 
                  onChange={setContent} 
                  options={{
                    spellChecker: false,
                    placeholder: "Write your story in Markdown here...",
                    status: false,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Publishing */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 border-b pb-2">Publishing Settings</h3>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg">
                <option value="Fashion">Fashion</option>
                <option value="Campus">Campus Life</option>
                <option value="Business">Business</option>
                <option value="Tech">Tech</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tags (Comma separated)</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="e.g. vintage, nike, cheap" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Read Time</label>
              <input type="text" value={readTime} onChange={(e) => setReadTime(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="e.g. 4 min read" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Short Excerpt</label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" rows={3} placeholder="Summary for home page..."></textarea>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="featured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-5 h-5 accent-[#D97706]" />
              <label htmlFor="featured" className="text-sm font-bold text-slate-700 cursor-pointer">Set as Featured Post</label>
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">Cover Image</h3>
            
            <label className="cursor-pointer block">
              <div className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex flex-col items-center justify-center hover:bg-slate-100 transition-colors relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <span className="text-3xl block mb-2">📷</span>
                    <span className="text-sm font-medium">Click to Upload</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Publishing..." : (editId ? "Update Article" : "Publish Article")}
          </button>
        </div>

      </form>
    </div>
  );
}