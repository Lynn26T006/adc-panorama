// 产品详情页，展示单个ADC药物的完整信息
// URL格式: /products/DRG0XXXXX/
// 使用Next.js静态生成(SSG)，构建时预渲染所有3500+ 产品页面

import { Metadata } from "next";
import { getProductById, getAllProducts } from "@/lib/data";
import Navbar from "@/components/Navbar";
import ProductDetail from "@/components/ProductDetail";
import { notFound } from "next/navigation";

// Next.js 15的params是异步的Promise类型
interface Props {
  params: Promise<{ id: string }>;
}

// 构建时告诉Next.js需要生成哪些id的页面（全量静态化）
export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ id: p.id }));
}

// 根据当前页面的id动态生成meta标签（浏览器标题栏 + SEO）
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return { title: "Not Found" };
  return {
    title: `${product.brandName} (${product.genericNameEn})，ADC Panorama`,
    description: `${product.brandName} 靶向 ${product.target}，${product.stage}。${product.indication.join("、")}`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);

  // id不存在时，显示Next.js内置的404页面
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
