"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FaBullhorn, FaPaperPlane, FaCheckCircle } from "react-icons/fa";

export default function AdminBroadcastPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== "admin") return;

    if (!window.confirm("🚨 WARNING: This will send an email to EVERY registered user on Kabale Online. Are you absolutely sure?")) {
      return;
    }

    setLoading(true);
    setSuccessMsg("");

    try {
      // Convert basic line breaks to HTML so the email looks exactly how you typed it
      const formattedContent = content.replace(/\n/g, "<br>");

      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: user.id,
          subject: subject,
          htmlContent: formattedContent
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message);
        setSubject("");
        setContent("");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-8 p-4">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <FaBullhorn className="text-[#D97706]" /> Email Broadcast
        </h1>
        <p className="text-slate-600 mt-2 font-medium">Send newsletters, updates, or alerts to all registered users simultaneously.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
        
        {successMsg && (
          <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 flex items-center gap-3 font-bold">
            <FaCheckCircle className="text-xl shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Email Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Big Update: New Sellers on Kabale Online!"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-colors font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Email Content (Supports basic HTML formatting)
            </label>
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message here... Note: Line breaks are automatically converted to HTML."
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-colors font-medium resize-y"
            ></textarea>
            <p className="text-xs text-slate-500 mt-2">
              Tip: You can use HTML tags like &lt;strong&gt;bold&lt;/strong&gt; or &lt;a href="url"&gt;Links&lt;/a&gt; for advanced formatting.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading || !subject || !content}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-black text-white uppercase tracking-widest transition-all ${
                loading || !subject || !content
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-[#D97706] active:scale-95 shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? "Sending Broadcast..." : <><FaPaperPlane /> Send to All Users</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
