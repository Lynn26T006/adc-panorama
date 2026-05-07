"use client";

import { useCallback, useState } from "react";

interface FilterGroupProps {
  label: string;
  param: string;
  options: string[];
  selected: string[];
  onToggle: (param: string, value: string) => void;
}

const INITIAL_SHOW = 8;

function FilterGroup({ label, param, options, selected, onToggle }: FilterGroupProps) {
  const [expanded, setExpanded] = useState(false);
  if (options.length === 0) return null;
  const hasMore = options.length > INITIAL_SHOW;
  const visible = expanded ? options : options.slice(0, INITIAL_SHOW);

  return (
    <div>
      <div className="text-xs font-semibold text-cyber-text2/70 uppercase tracking-wider mb-2">
        {label}
        {hasMore && <span className="text-cyber-text2/40 ml-1">({options.length})</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((opt) => {
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
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs px-2.5 py-1 rounded-full border border-cyber-border/30 text-cyber-accent/60 hover:text-cyber-accent hover:border-cyber-accent/50 transition-all"
          >
            +{options.length - INITIAL_SHOW} 更多
          </button>
        )}
        {hasMore && expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="text-xs px-2.5 py-1 rounded-full border border-cyber-border/30 text-cyber-text2/50 hover:text-cyber-text2 transition-all"
          >
            收起
          </button>
        )}
      </div>
    </div>
  );
}

function getSearchParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
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
  const sp = getSearchParams();
  const currentFilters = {
    stage: (sp.get("stage") || "").split(",").filter(Boolean),
    target: (sp.get("target") || "").split(",").filter(Boolean),
    indication: (sp.get("indication") || "").split(",").filter(Boolean),
    conjugationMethod: (sp.get("conjugationMethod") || "").split(",").filter(Boolean),
    payloadClass: (sp.get("payloadClass") || "").split(",").filter(Boolean),
    linkerType: (sp.get("linkerType") || "").split(",").filter(Boolean),
  };

  const onToggle = useCallback((param: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    const key = param as keyof typeof currentFilters;
    const current = params.get(param)?.split(",").filter(Boolean) || [];
    const idx = current.indexOf(value);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(value);
    if (current.length > 0) params.set(param, current.join(","));
    else params.delete(param);
    params.delete("page");
    window.location.href = `/products?${params.toString()}`;
  }, []);

  const hasAnyFilters = Object.values(currentFilters).some((arr) => arr.length > 0);

  return (
    <div className="cyber-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-cyber-text">筛选器</span>
        {hasAnyFilters && (
          <button
            onClick={() => { window.location.href = "/products"; }}
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
