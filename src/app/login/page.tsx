"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("邮箱或密码错误");
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
          <h1 className="text-xl font-bold text-cyber-text text-center mb-6">登录</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="text-xs font-semibold text-cyber-text2/70 uppercase block mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
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
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
          <p className="text-xs text-cyber-text2/60 text-center mt-4">
            还没有账号？{" "}
            <Link href="/register" className="text-cyber-accent hover:underline">
              注册
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
