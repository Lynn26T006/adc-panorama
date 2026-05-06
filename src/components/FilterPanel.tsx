"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterGroupProps {
  label: string;
  param: string;
  options: string[];
  selected: string[];
  onToggle: (param: string, value: string) => void;
}

function FilterGroup({ label, param, options, selected, onToggle }: FilterGroupProps) {
  if (options.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-cyber-text2/70 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(param, opt)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                isActive
                  ? "bg-cyber-accent/15 border-cyber-accent/60 text-cyber-accent"
                  : "border-cyber-border/50 text-cyber-text2/70 hover:border-cyber-border hover:text-cyber-text"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  stages: string[];
  targets: string[];
  indications: string[];
  conjugationMethods: string[];
  payloadClasses: string[];
  linkerTypes: string[];
}

export default function FilterPanel({
  stages,
  targets,
  indications,
  conjugationMethods,
  payloadClasses,
  linkerTypes,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFilters = {
    stage: (searchParams.get("stage") || "").split(",").filter(Boolean),
    target: (searchParams.get("target") || "").split(",").filter(Boolean),
    indication: (searchParams.get("indication") || "").split(",").filter(Boolean),
    conjugationMethod: (searchParams.get("conjugationMethod") || "").split(",").filter(Boolean),
    payloadClass: (searchParams.get("payloadClass") || "").split(",").filter(Boolean),
    linkerType: (searchParams.get("linkerType") || "").split(",").filter(Boolean),
  };

  const onToggle = useCallback(
    (param: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const key = param as keyof typeof currentFilters;
      const current = [...currentFilters[key]];
      const idx = current.indexOf(value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(value);
      if (current.length > 0) params.set(param, current.join(","));
      else params.delete(param);
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router, currentFilters]
  );

  const hasAnyFilters = Object.values(currentFilters).some((arr) => arr.length > 0);

  return (
    <div className="cyber-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-cyber-text">筛选器</span>
        {hasAnyFilters && (
          <button
            onClick={() => router.push("/products")}
            className="text-xs text-cyber-pink hover:text-cyber-pink/80 transition-colors"
          >
            清除全部
          </button>
        )}
      </div>
      <FilterGroup label="阶段" param="stage" options={stages} selected={currentFilters.stage} onToggle={onToggle} />
      <FilterGroup label="靶点" param="target" options={targets} selected={currentFilters.target} onToggle={onToggle} />
      <FilterGroup label="偶联方式" param="conjugationMethod" options={conjugationMethods} selected={currentFilters.conjugationMethod} onToggle={onToggle} />
      <FilterGroup label="载荷类型" param="payloadClass" options={payloadClasses} selected={currentFilters.payloadClass} onToggle={onToggle} />
      <FilterGroup label="连接子类型" param="linkerType" options={linkerTypes} selected={currentFilters.linkerType} onToggle={onToggle} />
      <details>
        <summary className="text-xs font-semibold text-cyber-text2/70 uppercase tracking-wider cursor-pointer mb-2">
          适应症
        </summary>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {indications.map((opt) => {
            const isActive = currentFilters.indication.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => onToggle("indication", opt)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  isActive
                    ? "bg-cyber-green/15 border-cyber-green/60 text-cyber-green"
                    : "border-cyber-border/50 text-cyber-text2/70 hover:border-cyber-border hover:text-cyber-text"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
