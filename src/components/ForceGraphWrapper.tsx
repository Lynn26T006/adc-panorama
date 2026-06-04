"use client";

import dynamic from "next/dynamic";
import type { ADCProduct } from "@/lib/types";

const ForceGraph = dynamic(() => import("@/components/ForceGraph"), { ssr: false });

export default function ForceGraphWrapper({ products }: { products: ADCProduct[] }) {
  return <ForceGraph products={products} />;
}
