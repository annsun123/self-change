"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** 将用户名转换为内部代理邮箱 */
function usernameToEmail(username: string): string {
  // 去掉首尾空格，内部用 .user 域避免与真实邮箱冲突
  return `${username.trim()}@selfchange.app`;
}

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const trimmedUsername = username.trim();
    const trimmedNickname = nickname.trim();

    if (!trimmedUsername) {
      setMessage({ type: "error", text: "请输入用户名" });
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!trimmedNickname) {
        setMessage({ type: "error", text: "请设置昵称" });
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setMessage({ type: "error", text: "密码至少需要6位" });
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: "error", text: "两次输入的密码不一致" });
        setLoading(false);
        return;
      }
    }

    // 内部构造代理邮箱
    const email = usernameToEmail(trimmedUsername);

    try {
      if (isSignUp) {
        // 通过 Admin API 注册，不触发邮件，不受邮件频率限制
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedUsername,
            password,
            nickname: trimmedNickname,
          }),
        });
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "注册失败");
        }

        setMessage({ type: "success", text: "注册成功！请登录。" });
        setIsSignUp(false);
        setPassword("");
        setConfirmPassword("");
        setNickname("");
      } else {
        // 登录：用代理邮箱
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.push("/scroll-map");
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "操作失败" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100 relative"
      style={{
        backgroundImage: "url('/images/app/启动页.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-stone-950/70" />
      <div className="w-full max-w-md p-8 space-y-6 relative z-10">
        {/* Prince illustration */}
        <div className="flex justify-center">
          <img
            src="/images/characters/exiled-prince.png"
            alt="流放王子"
            className="w-32 h-32 object-cover rounded-full border-2 border-amber-600/40 shadow-lg shadow-amber-900/20"
          />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif text-amber-400">自我改变</h1>
          <p className="text-stone-400 text-sm">流放王子归乡之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              autoComplete="username"
              required
              className="w-full px-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          {isSignUp && (
            <div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="昵称（显示名称）"
                autoComplete="nickname"
                required={isSignUp}
                className="w-full px-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              className="w-full px-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          {isSignUp && (
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="确认密码"
                autoComplete="new-password"
                required={isSignUp}
                className="w-full px-4 py-3 bg-stone-900 border border-stone-800 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

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
              setNickname("");
              setConfirmPassword("");
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