import { Metadata } from "next";
import { getProductById, getAllProducts } from "@/lib/data";
import Navbar from "@/components/Navbar";
import ProductDetail from "@/components/ProductDetail";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ id: p.id }));
}

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
