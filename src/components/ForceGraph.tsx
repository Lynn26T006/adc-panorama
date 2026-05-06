"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
import { ADCProduct } from "@/lib/types";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: "drug" | "target" | "company" | "disease";
  product?: ADCProduct;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

const COLORS: Record<string, string> = {
  drug: "#00e5ff",
  target: "#ff6ec7",
  company: "#ffb74d",
  disease: "#69f0ae",
};

interface Props {
  products: ADCProduct[];
}

export default function ForceGraph({ products }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const buildGraph = useCallback(() => {
    const nodes: GraphNode[] = [];
    const nodeMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    products.forEach((p) => {
      const drugNode: GraphNode = { id: p.id, name: p.brandName, group: "drug", product: p };
      if (!nodeMap.has(p.id)) {
        nodeMap.set(p.id, drugNode);
        nodes.push(drugNode);
      }

      // Target node
      const tId = `target_${p.target}`;
      if (!nodeMap.has(tId)) {
        nodeMap.set(tId, { id: tId, name: p.target, group: "target" });
        nodes.push(nodeMap.get(tId)!);
      }
      links.push({ source: p.id, target: tId });

      // Company node
      const compName = p.companyOriginator.trim();
      const cId = `company_${compName}`;
      if (!nodeMap.has(cId)) {
        nodeMap.set(cId, { id: cId, name: compName, group: "company" });
        nodes.push(nodeMap.get(cId)!);
      }
      links.push({ source: p.id, target: cId });

      // Disease node
      const disName = p.indication[0]?.trim() || "其他";
      const dId = `disease_${disName}`;
      if (!nodeMap.has(dId)) {
        nodeMap.set(dId, { id: dId, name: disName, group: "disease" });
        nodes.push(nodeMap.get(dId)!);
      }
      links.push({ source: p.id, target: dId });
    });

    return { nodes, links };
  }, [products]);

  useEffect(() => {
    const { nodes, links } = buildGraph();
    if (!svgRef.current || !containerRef.current) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight || 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", w).attr("height", h);

    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "fg-glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "blur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius(30));

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(0, 229, 255, 0.15)")
      .attr("stroke-width", 1);

    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => (d.group === "drug" ? 12 : d.group === "target" ? 8 : 7))
      .attr("fill", (d) => COLORS[d.group] || "#fff")
      .attr("stroke", "#080c14")
      .attr("stroke-width", 1.5)
      .style("filter", "url(#fg-glow)")
      .style("cursor", "pointer");

    const labels = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.name)
      .attr("font-size", (d) => (d.group === "drug" ? 10 : 8))
      .attr("fill", (d) => COLORS[d.group] || "#e0f7fa")
      .attr("dx", (d) => (d.group === "drug" ? 14 : 10))
      .attr("dy", 3)
      .style("pointer-events", "none")
      .style("text-shadow", "0 0 6px rgba(0,229,255,0.5)");

    node.on("mouseenter", (_, d) => setHovered(d))
      .on("mouseleave", () => setHovered(null))
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelected(d);
        if (d.group === "drug") {
          router.push(`/products/${d.id}`);
        } else if (d.group === "target") {
          router.push(`/products?target=${encodeURIComponent(d.name)}`);
        } else if (d.group === "company") {
          router.push(`/products?company=${encodeURIComponent(d.name)}`);
        } else if (d.group === "disease") {
          router.push(`/products?indication=${encodeURIComponent(d.name)}`);
        }
      });

    svg.on("click", () => setSelected(null));

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);
      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      labels.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    return () => { simulation.stop(); };
  }, [buildGraph, router]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[600px] bg-grid rounded-xl overflow-hidden border border-cyber-border">
      <svg ref={svgRef} className="w-full h-full" />
      {/* Tooltip */}
      {hovered && (
        <div className="absolute top-4 left-4 bg-cyber-card border border-cyber-border rounded-lg px-4 py-3 text-sm z-10 pointer-events-none">
          <div className="font-bold" style={{ color: COLORS[hovered.group] }}>
            {hovered.name}
          </div>
          <div className="text-xs text-cyber-text2 mt-1">
            {hovered.group === "drug" ? "ADC 药物" : hovered.group === "target" ? "靶点" : hovered.group === "company" ? "公司" : "适应症"}
          </div>
          {hovered.product && (
            <div className="text-xs text-cyber-text2 mt-1">
              {hovered.product.companyOriginator} · {hovered.product.stage}
            </div>
          )}
        </div>
      )}
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-cyber-card border border-cyber-border rounded-lg px-3 py-2 text-xs flex gap-4">
        {Object.entries(COLORS).map(([group, color]) => (
          <div key={group} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-cyber-text2">
              {group === "drug" ? "药物" : group === "target" ? "靶点" : group === "company" ? "公司" : "适应症"}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute top-4 right-4 text-xs text-cyber-text2/60">拖拽: 移动 · 滚轮: 缩放 · 点击: 跳转</div>
    </div>
  );
}
