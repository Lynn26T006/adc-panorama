"use client";

import { useState } from "react";

interface Props {
  totalPages: number;
  currentPage: number;
}

export default function Pagination({ totalPages, currentPage }: Props) {
  const [goTo, setGoTo] = useState("");
  if (totalPages <= 1) return null;

  function linkToPage(n: number) {
    const q = new URLSearchParams(window.location.search);
    q.set("page", String(n));
    return `/products?${q.toString()}`;
  }

  function doJump() {
    const target = parseInt(goTo);
    if (target >= 1 && target <= totalPages) {
      window.location.href = linkToPage(target);
    }
  }

  const pageList: (number | "...")[] = [];
  const wing = 2;
  for (let idx = 1; idx <= totalPages; idx++) {
    if (idx === 1 || idx === totalPages || (idx >= currentPage - wing && idx <= currentPage + wing)) {
      pageList.push(idx);
    } else if (pageList[pageList.length - 1] !== "...") {
      pageList.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
      {currentPage > 1 && (
        <a href={linkToPage(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg text-sm text-cyber-text2 border border-cyber-border hover:border-cyber-accent hover:text-cyber-accent transition-all no-underline">
          上一页
        </a>
      )}
      {pageList.map((item, k) =>
        item === "..." ? (
          <span key={`dots-${k}`} className="px-2 text-cyber-text2/50">...</span>
        ) : (
          <a key={item} href={linkToPage(item)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline ${
              item === currentPage
                ? "bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/50 glow-text"
                : "text-cyber-text2 border border-transparent hover:border-cyber-border hover:text-cyber-text"
            }`}>
            {item}
          </a>
        )
      )}
      {currentPage < totalPages && (
        <a href={linkToPage(currentPage + 1)}
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
            value={goTo}
            onChange={(e) => setGoTo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doJump()}
            placeholder={String(currentPage)}
            className="w-16 px-2 py-1 rounded-md bg-cyber-bg border border-cyber-border text-cyber-text text-sm text-center focus:outline-none focus:border-cyber-accent"
          />
          / {totalPages} 页
          <button onClick={doJump}
            className="px-2 py-1 rounded-md text-xs border border-cyber-border text-cyber-text2 hover:text-cyber-accent hover:border-cyber-accent transition-all">
            GO
          </button>
        </span>
      )}
    </div>
  );
}
