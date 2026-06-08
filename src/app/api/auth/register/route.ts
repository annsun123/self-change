import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/register
 * 使用 Admin API 直接创建用户，绕过邮件确认流程，避免邮件频率限制。
 * 用户以 {username}@selfchange.app 代理邮箱注册，不发送真实邮件。
 */
export async function POST(request: Request) {
  try {
    const { username, password, nickname } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "缺少用户名或密码" },
        { status: 400 }
      );
    }

    const proxyEmail = `${username.trim()}@selfchange.app`;
    const adminClient = createAdminClient();

    // 用 Admin API 创建用户，email_confirm 直接设为 true，不发送邮件
    const { data: userData, error } =
      await adminClient.auth.admin.createUser({
        email: proxyEmail,
        password,
        email_confirm: true,           // 跳过邮件确认
        user_metadata: {
          username: username.trim(),
          nickname: nickname?.trim() || null,
        },
      });

    if (error) {
      // 用户名已存在
      if (
        error.message?.includes("already registered") ||
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate")
      ) {
        return NextResponse.json(
          { error: "该用户名已被使用" },
          { status: 409 }
        );
      }
      console.error("Admin createUser error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId: userData.user?.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Register API error:", msg, err);
    return NextResponse.json(
      { error: `注册失败: ${msg}` },
      { status: 500 }
    );
  }
}
