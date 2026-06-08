import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/confirm
 * 使用 admin client 自动确认用户邮箱
 * 配合用户名注册使用：用户以 {username}@selfchange.user 注册后，
 * 调用此接口立即确认邮箱，无需真实邮箱验证。
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 使用 admin API 更新用户，直接设置 email_confirmed_at
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      console.error("Failed to confirm user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Confirm API error:", err);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
