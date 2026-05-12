import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import crypto from "crypto";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 5,
});

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const emailClean = String(email).toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    // 检查是否已存在
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [emailClean]) as [any[], any];
    if (existing.length > 0) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 12);
    const name = displayName || emailClean.split("@")[0];

    await pool.query(
      "INSERT INTO users (id, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, 'user')",
      [id, emailClean, hash, name]
    );

    return NextResponse.json({ success: true, message: "注册成功" }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
