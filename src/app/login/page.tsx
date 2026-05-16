"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: "success", text: "注册成功！请检查邮箱验证或直接登录。" });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // 登录成功后直接检查 profile 并跳转
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (!profile || !profile.onboarding_complete) {
          router.push("/onboarding");
        } else {
          router.push("/scroll-map");
        }
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "操作失败" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif text-amber-400">自我改变</h1>
          <p className="text-stone-400 text-sm">流放王子归乡之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              required
              className="w-full px-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              required
              className="w-full px-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "error" ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-stone-100 rounded-lg font-medium transition-colors"
          >
            {loading ? "处理中..." : isSignUp ? "注册" : "登录"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="text-sm text-stone-500 hover:text-amber-400 transition-colors"
          >
            {isSignUp ? "已有账号？登录" : "没有账号？注册"}
          </button>
        </div>
      </div>
    </div>
  );
}