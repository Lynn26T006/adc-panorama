import { getProductById, getAllProducts } from "@/lib/data";
import Navbar from "@/components/Navbar";
import ProductDetail from "@/components/ProductDetail";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getAllProducts().map(p => ({ id: String(p.id) }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetail product={product} />
      </main>
    </>
  );
}
