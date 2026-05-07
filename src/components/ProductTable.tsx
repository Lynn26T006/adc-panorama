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

function Truncate({ text, maxLen = 20 }: { text: string; maxLen?: number }) {
  if (!text || text === "未公开") return <span className="text-cyber-text2/40 text-xs">-</span>;
  const display = text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
  return (
    <span className="text-xs text-cyber-text2" title={text}>
      {display}
    </span>
  );
}

export default function ProductTable({ products }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-cyber-border text-left">
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[16%]">商品名</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[10%]">靶点</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[22%] hidden md:table-cell">适应症</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[9%]">阶段</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[14%] hidden lg:table-cell">公司</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[16%] hidden xl:table-cell">偶联方式</th>
            <th className="py-3 px-3 text-cyber-text2 font-medium text-xs uppercase tracking-wider w-[8%] hidden xl:table-cell">批准</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="cyber-row border-b border-cyber-border/30">
              <td className="py-3 px-3">
                <Link href={`/products/${p.id}/`} className="font-semibold text-cyber-text hover:text-cyber-accent transition-colors no-underline text-xs" title={p.genericNameEn}>
                  <Truncate text={p.brandName} maxLen={22} />
                </Link>
                <div className="text-[10px] text-cyber-text2/50 mt-0.5 truncate">{p.genericNameEn}</div>
              </td>
              <td className="py-3 px-3">
                {p.target ? (
                  <Link href={`/products?target=${encodeURIComponent(p.target)}`}
                    className="cyber-badge border-cyber-pink/50 text-cyber-pink hover:border-cyber-pink no-underline text-[11px] max-w-full truncate block"
                    title={p.target}>
                    {p.target.length > 12 ? p.target.slice(0,10) + "…" : p.target}
                  </Link>
                ) : (
                  <span className="text-cyber-text2/40 text-xs">-</span>
                )}
              </td>
              <td className="py-3 px-3 hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {p.indication.slice(0, 2).map((ind) => (
                    <Link key={ind} href={`/products?indication=${encodeURIComponent(ind)}`}
                      className="text-[11px] text-cyber-text2 hover:text-cyber-accent transition-colors no-underline truncate max-w-[140px]"
                      title={ind}>
                      {ind}
                    </Link>
                  ))}
                  {p.indication.length > 2 && (
                    <span className="text-[10px] text-cyber-text2/50">+{p.indication.length - 2}</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-3">
                <Link href={`/products?stage=${encodeURIComponent(p.stage)}`}
                  className={`cyber-badge text-[11px] ${stageColors[p.stage] || "border-cyber-border text-cyber-text2"} no-underline`}>
                  {p.stage.length > 8 ? p.stage.slice(0,6) + "…" : p.stage}
                </Link>
              </td>
              <td className="py-3 px-3 hidden lg:table-cell">
                {p.companyOriginator ? (
                  <Link href={`/products?company=${encodeURIComponent(p.companyOriginator)}`}
                    className="text-cyber-text2 hover:text-cyber-accent transition-colors no-underline text-xs"
                    title={p.companyOriginator}>
                    {p.companyOriginator.length > 18 ? p.companyOriginator.slice(0,15) + "…" : p.companyOriginator}
                  </Link>
                ) : (
                  <span className="text-cyber-text2/40 text-xs">-</span>
                )}
              </td>
              <td className="py-3 px-3 hidden xl:table-cell">
                {p.conjugationMethod ? (
                  <Link href={`/products?conjugationMethod=${encodeURIComponent(p.conjugationMethod)}`}
                    className="text-[11px] text-cyber-text2 hover:text-cyber-accent transition-colors no-underline"
                    title={p.conjugationMethod}>
                    {p.conjugationMethod.length > 20 ? p.conjugationMethod.slice(0,17) + "…" : p.conjugationMethod}
                  </Link>
                ) : (
                  <span className="text-cyber-text2/40 text-xs">-</span>
                )}
              </td>
              <td className="py-3 px-3 hidden xl:table-cell text-cyber-text2 text-xs">
                {p.approvalYear || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
