"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const FORM_FIELDS = [
  { key: "antibody", label: "抗体名称", placeholder: "如 Trastuzumab" },
  { key: "brandName", label: "商品名", placeholder: "如 Kadcyla" },
  { key: "target", label: "靶点", placeholder: "如 HER2" },
  { key: "stage", label: "研发阶段", placeholder: "如 已上市 / 临床III期" },
  { key: "payloadName", label: "载荷名称", placeholder: "如 DM1" },
  { key: "linkerName", label: "连接子", placeholder: "如 SMCC" },
  { key: "conjugationMethod", label: "偶联方式", placeholder: "如 半胱氨酸偶联" },
  { key: "dosageForm", label: "剂型", placeholder: "如 冻干粉针" },
  { key: "lyoBuffer", label: "缓冲体系", placeholder: "如 L-组氨酸" },
  { key: "lyoStabilizer", label: "稳定剂", placeholder: "如 蔗糖" },
  { key: "lyoSurfactant", label: "表面活性剂", placeholder: "如 聚山梨酯80" },
  { key: "lyoPh", label: "pH", placeholder: "如 pH 6.0" },
  { key: "storageCondition", label: "储存条件", placeholder: "如 2-8°C" },
  { key: "referenceUrl", label: "参考来源URL", placeholder: "如 https://..." },
];

export default function SubmitPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [drugName, setDrugName] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!session?.user) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-16 text-center">
          <div className="cyber-card p-8">
            <p className="text-cyber-text2 mb-4">请登录后提交数据</p>
            <Link href="/login" className="text-cyber-accent hover:underline">前往登录</Link>
          </div>
        </main>
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!drugName.trim()) { setError("请填写药物名称"); return; }

    const hasData = Object.values(formData).some(v => v);
    if (!hasData) { setError("请至少填写一个字段"); return; }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/submissions/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drugName: drugName.trim(), fieldData: formData }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error || "提交失败");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto px-4 py-16 text-center">
          <div className="cyber-card p-8">
            <div className="text-3xl mb-4">✅</div>
            <h1 className="text-lg font-bold text-cyber-text mb-2">提交成功！</h1>
            <p className="text-sm text-cyber-text2 mb-6">你的数据已提交，管理员审核通过后会加入数据库。</p>
            <button onClick={() => { setDone(false); setDrugName(""); setFormData({}); }} className="text-sm px-4 py-2 rounded-lg bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30 hover:bg-cyber-accent/20 transition-all">
              继续提交
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl font-extrabold gradient-text mb-2">提交数据</h1>
        <p className="text-sm text-cyber-text2 mb-8">
          提交新的 ADC 药物数据或修正现有数据，管理员审核通过后会更新到数据库。
        </p>

        <form onSubmit={handleSubmit} className="cyber-card p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-cyber-text2 uppercase block mb-1">药物名称 *</label>
            <input
              type="text"
              value={drugName}
              onChange={e => setDrugName(e.target.value)}
              placeholder="ADC 药物名称或代号"
              required
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FORM_FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs text-cyber-text2/70 block mb-1">{f.label}</label>
                <input
                  type="text"
                  value={formData[f.key] || ""}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-text2/30 focus:outline-none focus:border-cyber-accent"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-cyber-pink">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-cyber-accent hover:bg-cyan-400 text-cyber-bg font-bold text-sm transition-all disabled:opacity-50"
          >
            {submitting ? "提交中..." : "提交审核"}
          </button>
        </form>
      </main>
    </>
  );
}
