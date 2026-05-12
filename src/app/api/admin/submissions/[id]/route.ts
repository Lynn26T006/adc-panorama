import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mysql from "mysql2/promise";

const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 5 });

// 表单字段 → 数据库列名映射
const FIELD_MAP: Record<string, string> = {
  antibody: "antibody",
  brandName: "brand_name",
  target: "target",
  stage: "stage",
  payloadName: "payload_name",
  linkerName: "linker_name",
  conjugationMethod: "conjugation_method",
  dosageForm: "dosage_form",
  lyoBuffer: "lyo_buffer",
  lyoStabilizer: "lyo_stabilizer",
  lyoSurfactant: "lyo_surfactant",
  lyoPh: "lyo_ph",
  storageCondition: "storage_condition",
  referenceUrl: "reference_url",
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const conn = await pool.getConnection();
  try {
    const { id } = await params;
    const { status, reviewNote } = await request.json();
    const reviewerId = (session.user as any).id;

    // 获取提交记录
    const [rows] = await conn.query("SELECT * FROM submissions WHERE id = ?", [id]) as any[];
    if (rows.length === 0) {
      conn.release();
      return NextResponse.json({ error: "提交不存在" }, { status: 404 });
    }
    const sub = rows[0];

    // 如果审核通过，将数据写入 drugs 表
    if (status === "approved") {
      const fieldData = typeof sub.field_data === "string"
        ? JSON.parse(sub.field_data)
        : sub.field_data || {};

      // 构建 INSERT 列和值
      const columns: string[] = [];
      const values: any[] = [];
      const placeholders: string[] = [];

      // drug_name 作为品牌名
      if (sub.drug_name) {
        columns.push("brand_name");
        values.push(sub.drug_name);
        placeholders.push("?");
      }

      for (const [camelKey, value] of Object.entries(fieldData)) {
        const col = FIELD_MAP[camelKey];
        if (col && value && String(value).trim()) {
          columns.push(col);
          values.push(String(value).trim());
          placeholders.push("?");
        }
      }

      let newDrugId: number | null = null;

      if (columns.length > 0) {
        const [result] = await conn.query(
          `INSERT INTO drugs (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
          values
        );
        newDrugId = (result as any).insertId;

        // 写入 data_changelog
        const changelogValues = columns.map((col, i) => [
          newDrugId,
          reviewerId,
          col,
          null,
          String(values[i]),
          "user_submit",
        ]);

        for (const entry of changelogValues) {
          await conn.query(
            "INSERT INTO data_changelog (drug_id, user_id, field, old_value, new_value, source) VALUES (?, ?, ?, ?, ?, ?)",
            entry
          );
        }
      }
    }

    // 更新提交状态
    await conn.query(
      "UPDATE submissions SET status = ?, reviewer_id = ?, review_note = ?, reviewed_at = NOW() WHERE id = ?",
      [status, reviewerId, reviewNote || "", id]
    );

    // 通知提交者
    const notificationType = status === "approved" ? "submission_approved" : "submission_rejected";
    const notificationTitle = status === "approved" ? "数据提交已通过" : "数据提交未通过";
    const notificationBody = status === "approved"
      ? `你提交的「${sub.drug_name || "新药数据"}」已通过审核，已加入数据库`
      : `你提交的「${sub.drug_name || "新药数据"}」未通过审核${reviewNote ? `：${reviewNote}` : ""}`;

    await conn.query(
      "INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, '/products')",
      [sub.user_id, notificationType, notificationTitle, notificationBody.substring(0, 500)]
    );

    conn.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    conn.release();
    console.error("Submission review error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
