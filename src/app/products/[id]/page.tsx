"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchDrug } from "@/lib/api-client";
import type { ADCProduct } from "@/lib/types";
import Navbar from "@/components/Navbar";
import ProductDetail from "@/components/ProductDetail";
import CommentSection from "@/components/CommentSection";
import { notFound } from "next/navigation";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<ADCProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const p = await fetchDrug(params.id);
        setProduct(p);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="cyber-card p-12 text-center">
            <div className="w-8 h-8 mx-auto border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </>
    );
  }

  if (!product) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetail product={product} />
        <CommentSection drugId={product.id} />
      </main>
    </>
  );
}
