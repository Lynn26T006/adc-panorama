"use client";

import { useCallback, useState } from "react";

const FIRST_BATCH = 8; // 默认展开8个选项，超出的收起

type GroupProps = {
  title: string;
  queryKey: string;
  allOptions: string[];
  picked: string[];
  onPick: (key: string, val: string) => void;
};

function FilterGroup({ title, queryKey, allOptions, picked, onPick }: GroupProps) {
  const [showAll, setShowAll] = useState(false);
  if (allOptions.length === 0) return null;

  const overflow = allOptions.length > FIRST_BATCH;
  const visibleSet = showAll ? allOptions : allOptions.slice(0, FIRST_BATCH);

  return (
    <div>
      <div className="text-xs font-semibold text-cyber-text2/70 uppercase tracking-wider mb-2">
        {title}
        {overflow && <span className="text-cyber-text2/40 ml-1">({allOptions.length})</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleSet.map((val) => {
          const on = picked.includes(val);
          return (
            <button
              key={val}
              onClick={() => onPick(queryKey, val)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                on
                  ? "bg-cyber-accent/15 border-cyber-accent/60 text-cyber-accent"
                  : "border-cyber-border/50 text-cyber-text2/70 hover:border-cyber-border hover:text-cyber-text"
              }`}
            >
              {val}
            </button>
          );
        })}
        {overflow && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs px-2.5 py-1 rounded-full border border-cyber-border/30 text-cyber-accent/60 hover:text-cyber-accent hover:border-cyber-accent/50 transition-all"
          >
            +{allOptions.length - FIRST_BATCH} 更多
          </button>
        )}
        {overflow && showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="text-xs px-2.5 py-1 rounded-full border border-cyber-border/30 text-cyber-text2/50 hover:text-cyber-text2 transition-all"
          >
            收起
          </button>
        )}
      </div>
    </div>
  );
}

function readUrlParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

type PanelProps = {
  stages: string[];
  targets: string[];
  indications: string[];
  conjugationMethods: string[];
  payloadClasses: string[];
  linkerTypes: string[];
};

export default function FilterPanel({
  stages,
  targets,
  indications,
  conjugationMethods,
  payloadClasses,
  linkerTypes,
}: PanelProps) {
  const url = readUrlParams();
  const current = {
    stage: (url.get("stage") || "").split(",").filter(Boolean),
    target: (url.get("target") || "").split(",").filter(Boolean),
    indication: (url.get("indication") || "").split(",").filter(Boolean),
    conjugationMethod: (url.get("conjugationMethod") || "").split(",").filter(Boolean),
    payloadClass: (url.get("payloadClass") || "").split(",").filter(Boolean),
    linkerType: (url.get("linkerType") || "").split(",").filter(Boolean),
  };

  // 点击某个筛选值时，在地址栏里对应param的逗号列表中增删
  const handlePick = useCallback((param: string, val: string) => {
    const q = new URLSearchParams(window.location.search);
    const list = q.get(param)?.split(",").filter(Boolean) || [];
    const pos = list.indexOf(val);
    if (pos >= 0) {
      list.splice(pos, 1);
    } else {
      list.push(val);
    }
    if (list.length > 0) {
      q.set(param, list.join(","));
    } else {
      q.delete(param);
    }
    q.delete("page"); // 换筛选条件时重置到第一页
    window.location.href = `/products?${q.toString()}`;
  }, []);

  const dirty = Object.values(current).some((arr) => arr.length > 0);

  return (
    <div className="cyber-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-cyber-text">筛选器</span>
        {dirty && (
          <button
            onClick={() => { window.location.href = "/products"; }}
            className="text-xs text-cyber-pink hover:text-cyber-pink/80 transition-colors"
          >
            清除全部
          </button>
        )}
      </div>
      <FilterGroup title="阶段" queryKey="stage" allOptions={stages} picked={current.stage} onPick={handlePick} />
      <FilterGroup title="靶点" queryKey="target" allOptions={targets} picked={current.target} onPick={handlePick} />
      <FilterGroup title="偶联方式" queryKey="conjugationMethod" allOptions={conjugationMethods} picked={current.conjugationMethod} onPick={handlePick} />
      <FilterGroup title="载荷类型" queryKey="payloadClass" allOptions={payloadClasses} picked={current.payloadClass} onPick={handlePick} />
      <FilterGroup title="连接子类型" queryKey="linkerType" allOptions={linkerTypes} picked={current.linkerType} onPick={handlePick} />

      {/* 适应症用 details/summary 展开，因为数量太多了 */}
      <details>
        <summary className="text-xs font-semibold text-cyber-text2/70 uppercase tracking-wider cursor-pointer mb-2">
          适应症
        </summary>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {indications.map((opt) => {
            const selected = current.indication.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => handlePick("indication", opt)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  selected
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
