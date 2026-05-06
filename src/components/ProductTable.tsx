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
  products: ADCProduct[];
}

export default function ProductTable({ products }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cyber-border text-left">
            <th className="py-3 px-4 text-cyber-text2 font-medium text-xs uppercase tracking-wider">商品名</th>
            <th className="py-3 px-4 text-cyber-text2 font-medium text-xs uppercase tracking-wider">靶点</th>
            <th className="py-3 px-4 text-cyber-text2 font-medium text-xs uppercase tracking-wider hidden md:table-cell">适应症</th>
            <th className="py-3 px-4 text-cyber-text2 font-medium text-xs uppercase tracking-wider">阶段</th>
            <th className="py-3 px-4 text-cyber-text2 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">公司</th>
            <th className="py-3 px-4 text-cyber-text2 font-medium text-xs uppercase tracking-wider hidden xl:table-cell">偶联方式</th>
            <th className="py-3 px-4 text-cyber-text2 font-medium text-xs uppercase tracking-wider hidden xl:table-cell">批准年份</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="cyber-row border-b border-cyber-border/30">
              <td className="py-3 px-4">
                <Link href={`/products/${p.id}`} className="font-semibold text-cyber-text hover:text-cyber-accent transition-colors no-underline">
                  {p.brandName}
                </Link>
                <div className="text-xs text-cyber-text2/60 mt-0.5">{p.genericNameEn}</div>
              </td>
              <td className="py-3 px-4">
                <Link href={`/products?target=${encodeURIComponent(p.target)}`} className="cyber-badge border-cyber-pink/50 text-cyber-pink hover:border-cyber-pink no-underline">
                  {p.target}
                </Link>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <div className="flex flex-wrap gap-1 max-w-[220px]">
                  {p.indication.slice(0, 2).map((ind) => (
                    <Link key={ind} href={`/products?indication=${encodeURIComponent(ind)}`} className="text-xs text-cyber-text2 hover:text-cyber-accent transition-colors no-underline truncate max-w-[180px]">
                      {ind}
                    </Link>
                  ))}
                  {p.indication.length > 2 && (
                    <span className="text-xs text-cyber-text2/50">+{p.indication.length - 2}</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <Link href={`/products?stage=${encodeURIComponent(p.stage)}`} className={`cyber-badge ${stageColors[p.stage] || "border-cyber-border text-cyber-text2"} no-underline`}>
                  {p.stage}
                </Link>
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <Link href={`/products?company=${encodeURIComponent(p.companyOriginator)}`} className="text-cyber-text2 hover:text-cyber-accent transition-colors no-underline text-sm">
                  {p.companyOriginator}
                </Link>
              </td>
              <td className="py-3 px-4 hidden xl:table-cell">
                <Link href={`/products?conjugationMethod=${encodeURIComponent(p.conjugationMethod)}`} className="text-xs text-cyber-text2 hover:text-cyber-accent transition-colors no-underline">
                  {p.conjugationMethod}
                </Link>
              </td>
              <td className="py-3 px-4 hidden xl:table-cell text-cyber-text2 text-sm">
                {p.approvalYear || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
