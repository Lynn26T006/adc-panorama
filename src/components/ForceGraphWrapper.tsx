"use client";

import dynamic from "next/dynamic";

const ForceGraph = dynamic(() => import("@/components/ForceGraph"), { ssr: false });

export default function ForceGraphWrapper() {
  return <ForceGraph />;
}
