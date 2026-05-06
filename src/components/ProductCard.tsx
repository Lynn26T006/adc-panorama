"use client";

import Link from "next/link";
import { ADCProduct } from "@/lib/types";

const stageColors: Record<string, string> = {
  "已上市": "border-cyber-green/50 text-cyber-green",
  "NDA": "border-cyber-orange/50 text-cyber-orange",
  "临床III期": "border-cyber-accent/50 text-cyber-accent",
  "临床II期": "border-cyber-accent2/50 text-cyber-accent2",
  "临床I期": "border-cyber-pink/50 text-cyber-pink",
  "IND": "border-cyber-pink/50 text-cyber-pink",
};

interface Props {
  product: ADCProduct;
}

export default function ProductCard({ product: p }: Props) {
  return (
    <Link href={`/products/${p.id}`} className="cyber-card p-4 block no-underline group">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-bold text-cyber-text group-hover:text-cyber-accent transition-colors">{p.brandName}</div>
          <div className="text-xs text-cyber-text2/60 mt-0.5">{p.genericNameEn}</div>
        </div>
        <span className={`cyber-badge text-xs ${stageColors[p.stage] || ""}`}>{p.stage}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Link
          href={`/products?target=${encodeURIComponent(p.target)}`}
          className="cyber-badge border-cyber-pink/50 text-cyber-pink text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {p.target}
        </Link>
        {p.indication.slice(0, 2).map((ind) => (
          <Link
            key={ind}
            href={`/products?indication=${encodeURIComponent(ind)}`}
            className="cyber-badge border-cyber-green/50 text-cyber-green text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {ind}
          </Link>
        ))}
        {p.indication.length > 2 && (
          <span className="text-xs text-cyber-text2/50 self-center">+{p.indication.length - 2}</span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-cyber-text2">
        <Link
          href={`/products?company=${encodeURIComponent(p.companyOriginator)}`}
          className="hover:text-cyber-accent transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {p.companyOriginator}
        </Link>
        <span>·</span>
        <Link
          href={`/products?conjugationMethod=${encodeURIComponent(p.conjugationMethod)}`}
          className="hover:text-cyber-accent transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {p.conjugationMethod}
        </Link>
      </div>
    </Link>
  );
}
