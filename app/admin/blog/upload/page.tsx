"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

export default function BlogUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("id");

  // ================= STATE =================

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Business");
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!editId);

  // ================= SLUG GENERATOR =================

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  // ================= LOAD EDIT MODE =================

  useEffect(() => {
    if (!editId) return;

    const fetchPost = async () => {
      try {
        const snap = await getDoc(doc(db, "blog_posts", editId));
        if (snap.exists()) {
          const d = snap.data();
          setTitle(d.title || "");
          setSlug(d.slug || editId);
          setContent(d.content || "");
          setCategory(d.category || "Business");
          setTags(d.tags ? d.tags.join(", ") : "");
          setReadTime(d.readTime || "");
          setExcerpt(d.excerpt || "");
          setMetaTitle(d.metaTitle || "");
          setMetaDescription(d.metaDescription || "");
          setIsFeatured(d.isFeatured || false);

          if (d.featuredImage) {
            setExistingImageUrl(d.featuredImage);
            setPreviewUrl(d.featuredImage);
          }
        }
      } catch {
        alert("Failed to load article");
      } finally {
        setPageLoading(false);
      }
    };

    fetchPost();
  }, [editId]);

  // ================= IMAGE UPLOAD =================

  const uploadToCloudinary = async (file: File) => {
    try {
      const sigRes = await fetch("/api/cloudinary/blog-sign", { method: "POST" });
      
      if (!sigRes.ok) {
        throw new Error(`Signature API failed with status: ${sigRes.status}`);
      }
      
      const sigData = await sigRes.json();
      if (!sigData.cloudName || !sigData.signature) {
        throw new Error("Signature API is missing cloudName or signature");
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sigData.apiKey);
      fd.append("timestamp", sigData.timestamp);
      fd.append("signature", sigData.signature);
      fd.append("folder", "kabale_blog"); 

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
        { method: "POST", body: fd }
      );

      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.error.message);

      return uploadData.secure_url;
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw error; 
    }
  };

  // ================= EDITOR IMAGE PASTE =================

  const handleEditorPaste = async (event: any) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (!file) continue;

        try {
          // You can add a temporary loading placeholder to the editor here if desired
          const url = await uploadToCloudinary(file);
          setContent((prev) => prev + `\n\n![image](${url})\n\n`);
        } catch (err) {
          alert("Failed to upload pasted image.");
        }
      }
    }
  };

  // ================= SUBMIT =================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug) return alert("Title required");
    if (!content) return alert("Content required");
    if (!editId && !imageFile && !existingImageUrl)
      return alert("Cover image required");

    setLoading(true);

    try {
      let finalImageUrl = existingImageUrl;

      if (imageFile) {
        finalImageUrl = await uploadToCloudinary(imageFile);
      }

      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const postData = {
        title,
        slug,
        content,
        category,
        tags: tagsArray,
        readTime,
        excerpt,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        isFeatured,
        featuredImage: finalImageUrl,
        author: "Kabale Editor",
        updatedAt: serverTimestamp(),
      };

      if (editId) {
        // FIXED: Update using editId, not the potentially modified slug
        await updateDoc(doc(db, "blog_posts", editId), postData);
        alert("Article Updated ✅");
      } else {
        await setDoc(doc(db, "blog_posts", slug), {
          ...postData,
          publishedAt: serverTimestamp(),
          views: 0,
        });
        alert("Article Published 🎉");
      }

      router.push("/admin/blog");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading)
    return <div className="p-10 text-center font-bold">Loading Editor...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
            <input
              type="text"
              placeholder="Article Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(generateSlug(e.target.value));
              }}
              className="w-full p-3 border rounded-lg font-bold text-lg"
            />

            <input
              type="text"
              placeholder="Slug"
              value={slug}
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              className="w-full p-2 border rounded-lg text-sm"
            />

            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || "")}
                onPaste={handleEditorPaste}
                height={500}
                preview="live"
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option>Business</option>
              <option>Campus Life</option>
              <option>Tech</option>
              <option>Fashion</option>
            </select>

            <input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />

            <input
              placeholder="Read time (e.g 4 min read)"
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />

            <textarea
              placeholder="Excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />

            <input
              placeholder="Meta Title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />

            <textarea
              placeholder="Meta Description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              Featured Post
            </label>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <label className="block cursor-pointer">
              <div className="h-48 border-2 border-dashed rounded-xl overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "Click to Upload Cover Image"
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    // Generates the immediate local preview
                    setPreviewUrl(URL.createObjectURL(file)); 
                  } else {
                    setImageFile(null);
                    setPreviewUrl("");
                  }
                }}
              />
            </label>
          </div>

          <button
            disabled={loading}
            className="w-full p-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Save Article"}
          </button>
        </div>
      </form>
    </div>
  );
}