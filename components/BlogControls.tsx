"use client";

import { useEffect, useState } from "react";

interface BlogControlsProps {
  postId: string;
  title: string;
}

export default function BlogControls({ postId, title }: BlogControlsProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Silently increment the view count via API
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    }).catch(console.error);

    // 2. Track reading progress
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setProgress((winScroll / height) * 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [postId]);

  const shareArticle = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const safeTitle = encodeURIComponent(title);
    
    if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${safeTitle}%20${url}`);
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${safeTitle}&url=${url}`);
    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  };

  return (
    <>
      <div id="kb-progress-container">
        <div id="kb-progress-bar" style={{ width: `${progress}%`, backgroundColor: '#D97706' }}></div>
      </div>

      <div className="kb-share-bar">
        <button className="kb-share-btn" onClick={() => shareArticle('whatsapp')} style={{ color: '#25D366' }} title="Share on WhatsApp">📱</button>
        <button className="kb-share-btn" onClick={() => shareArticle('twitter')} style={{ color: '#000' }} title="Share on X">𝕏</button>
        <button className="kb-share-btn" onClick={() => shareArticle('copy')} style={{ color: '#D97706' }} title="Copy Link">🔗</button>
      </div>
    </>
  );
}