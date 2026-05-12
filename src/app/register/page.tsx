"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "注册失败");
      setLoading(false);
      return;
    }

    // 注册成功，自动登录
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("注册成功但登录失败，请前往登录页");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-md mx-auto px-4 py-16">
        <div className="cyber-card p-8">
          <h1 className="text-xl font-bold text-cyber-text text-center mb-6">注册</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-cyber-text2/70 uppercase block mb-1">用户名（可选）</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-accent"
                placeholder="你的名字"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-cyber-text2/70 uppercase block mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-accent"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-cyber-text2/70 uppercase block mb-1">密码（至少6位）</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-accent"
                placeholder="••••••"
              />
            </div>
            {error && <p className="text-sm text-cyber-pink">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyber-accent hover:bg-cyan-400 text-cyber-bg font-bold text-sm transition-all disabled:opacity-50"
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </form>
          <p className="text-xs text-cyber-text2/60 text-center mt-4">
            已有账号？{" "}
            <Link href="/login" className="text-cyber-accent hover:underline">
              登录
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
