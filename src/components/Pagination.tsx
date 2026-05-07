"use client";

import { useState } from "react";

interface Props {
  totalPages: number;
  currentPage: number;
}

export default function Pagination({ totalPages, currentPage }: Props) {
  const [inputPage, setInputPage] = useState("");
  if (totalPages <= 1) return null;

  function pageHref(page: number) {
    const sp = new URLSearchParams(window.location.search);
    sp.set("page", String(page));
    return `/products?${sp.toString()}`;
  }

  function handleJump() {
    const p = parseInt(inputPage);
    if (p >= 1 && p <= totalPages) {
      window.location.href = pageHref(p);
    }
  }

  const pages: (number | "...")[] = [];
  const range = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
      {currentPage > 1 && (
        <a href={pageHref(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg text-sm text-cyber-text2 border border-cyber-border hover:border-cyber-accent hover:text-cyber-accent transition-all no-underline">
          上一页
        </a>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-cyber-text2/50">...</span>
        ) : (
          <a key={p} href={pageHref(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline ${
              p === currentPage
                ? "bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/50 glow-text"
                : "text-cyber-text2 border border-transparent hover:border-cyber-border hover:text-cyber-text"
            }`}>
            {p}
          </a>
        )
      )}
      {currentPage < totalPages && (
        <a href={pageHref(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg text-sm text-cyber-text2 border border-cyber-border hover:border-cyber-accent hover:text-cyber-accent transition-all no-underline">
          下一页
        </a>
      )}
      {totalPages > 10 && (
        <span className="flex items-center gap-1 text-xs text-cyber-text2/60 ml-2">
          跳至
          <input
            type="number"
            min={1}
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJump()}
            placeholder={String(currentPage)}
            className="w-16 px-2 py-1 rounded-md bg-cyber-bg border border-cyber-border text-cyber-text text-sm text-center focus:outline-none focus:border-cyber-accent"
          />
          / {totalPages} 页
          <button onClick={handleJump}
            className="px-2 py-1 rounded-md text-xs border border-cyber-border text-cyber-text2 hover:text-cyber-accent hover:border-cyber-accent transition-all">
            GO
          </button>
        </span>
      )}
    </div>
  );
}
