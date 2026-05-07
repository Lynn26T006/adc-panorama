// ============================================================
// 产品详情页 — 展示单个 ADC 药物的完整信息
// URL 格式: /products/DRG0XXXXX/
// 使用 Next.js 静态生成(SSG)，构建时预渲染所有 3500+ 产品页面
// ============================================================

import { Metadata } from "next";
import { getProductById, getAllProducts } from "@/lib/data";
import Navbar from "@/components/Navbar";
import ProductDetail from "@/components/ProductDetail";
import { notFound } from "next/navigation";

// Next.js 15 的 params 是异步的 Promise 类型
interface Props {
  params: Promise<{ id: string }>;
}

// 构建时告诉 Next.js 需要生成哪些 id 的页面（全量静态化）
export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ id: p.id }));
}

// 根据当前页面的 id 动态生成 meta 标签（浏览器标题栏 + SEO）
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return { title: "Not Found" };
  return {
    title: `${product.brandName} (${product.genericNameEn}) — ADC Panorama`,
    description: `${product.brandName} 靶向 ${product.target}，${product.stage}。${product.indication.join("、")}`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);

  // id 不存在时，显示 Next.js 内置的 404 页面
  if (!product) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetail product={product} />
      </main>
    </>
  );
}
