"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Props {
  drugId: string;
}

export default function BookmarkButton({ drugId }: Props) {
  const { data: session } = useSession();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!session?.user) { setChecked(true); return; }
    fetch(`/api/bookmarks/${drugId}/`)
      .then(r => r.json())
      .then(d => { setBookmarked(d.bookmarked); setChecked(true); })
      .catch(() => setChecked(true));
  }, [drugId, session]);

  async function toggle() {
    if (!session?.user) return;
    setLoading(true);
    if (bookmarked) {
      await fetch(`/api/bookmarks/${drugId}/`, { method: "DELETE" });
      setBookmarked(false);
    } else {
      await fetch("/api/bookmarks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugId }),
      });
      setBookmarked(true);
    }
    setLoading(false);
  }

  if (!checked) {
    return <span className="w-7 h-7 rounded-full bg-cyber-border/20 animate-pulse" />;
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? "取消收藏" : "收藏"}
      className={`p-1.5 rounded-full transition-all ${
        bookmarked
          ? "text-yellow-400 hover:text-yellow-300 bg-yellow-400/10"
          : "text-cyber-text2/40 hover:text-yellow-400 hover:bg-yellow-400/5"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}
