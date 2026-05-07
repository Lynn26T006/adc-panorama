"use client";

import Link from "next/link";
import { ADCProduct } from "@/lib/types";

const stageBadgeClr: Record<string, string> = {
  "已上市": "border-cyber-green/50 text-cyber-green",
  "NDA": "border-cyber-orange/50 text-cyber-orange",
  "临床III期": "border-cyber-accent/50 text-cyber-accent",
  "临床II期": "border-cyber-accent2/50 text-cyber-accent2",
  "临床I期": "border-cyber-pink/50 text-cyber-pink",
  "IND": "border-cyber-pink/50 text-cyber-pink",
};

type CardProps = {
  drug: ADCProduct;
};

export default function ProductCard({ drug }: CardProps) {
  const stageStyle = stageBadgeClr[drug.stage] || "";

  return (
    <Link href={`/products/${drug.id}`} className="cyber-card p-4 block no-underline group">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-bold text-cyber-text group-hover:text-cyber-accent transition-colors">{drug.brandName}</div>
          <div className="text-xs text-cyber-text2/60 mt-0.5">{drug.genericNameEn}</div>
        </div>
        <span className={`cyber-badge text-xs ${stageStyle}`}>{drug.stage}</span>
      </div>
      {/* 靶点 + 适应症 badge 行 */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Link
          href={`/products?target=${encodeURIComponent(drug.target)}`}
          className="cyber-badge border-cyber-pink/50 text-cyber-pink text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {drug.target}
        </Link>
        {drug.indication.slice(0, 2).map((ind) => (
          <Link
            key={ind}
            href={`/products?indication=${encodeURIComponent(ind)}`}
            className="cyber-badge border-cyber-green/50 text-cyber-green text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {ind}
          </Link>
        ))}
        {drug.indication.length > 2 && (
          <span className="text-xs text-cyber-text2/50 self-center">+{drug.indication.length - 2}</span>
        )}
      </div>
      {/* 公司 + 偶联方式 */}
      <div className="mt-3 flex items-center gap-3 text-xs text-cyber-text2">
        <Link
          href={`/products?company=${encodeURIComponent(drug.companyOriginator)}`}
          className="hover:text-cyber-accent transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {drug.companyOriginator}
        </Link>
        <span>·</span>
        <Link
          href={`/products?conjugationMethod=${encodeURIComponent(drug.conjugationMethod)}`}
          className="hover:text-cyber-accent transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {drug.conjugationMethod}
        </Link>
      </div>
    </Link>
  );
}
