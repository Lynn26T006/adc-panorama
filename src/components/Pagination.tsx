"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Props {
  totalPages: number;
  currentPage: number;
}

export default function Pagination({ totalPages, currentPage }: Props) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function pageHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/products?${params.toString()}`;
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
    <div className="flex items-center justify-center gap-1.5 mt-8">
      {currentPage > 1 && (
        <Link
          href={pageHref(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg text-sm text-cyber-text2 border border-cyber-border hover:border-cyber-accent hover:text-cyber-accent transition-all no-underline"
        >
          上一页
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-cyber-text2/50">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline ${
              p === currentPage
                ? "bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/50 glow-text"
                : "text-cyber-text2 border border-transparent hover:border-cyber-border hover:text-cyber-text"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link
          href={pageHref(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg text-sm text-cyber-text2 border border-cyber-border hover:border-cyber-accent hover:text-cyber-accent transition-all no-underline"
        >
          下一页
        </Link>
      )}
    </div>
  );
}
