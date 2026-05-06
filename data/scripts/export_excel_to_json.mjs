#!/usr/bin/env node

/**
 * Export adc_products.json to Excel (.xlsx) format.
 * Usage: node scripts/export_excel_to_json.mjs  (reads JSON, writes Excel)
 * Or:    node scripts/export_excel_to_json.mjs --reverse  (reads Excel, writes JSON)
 */

import * as XLSX from "xlsx";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = resolve(__dirname, "../adc_products.json");
const excelPath = resolve(__dirname, "../adc_products.xlsx");

const args = process.argv.slice(2);
const reverse = args.includes("--reverse");

if (reverse) {
  // Read Excel → Write JSON
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  // Convert fields back from Excel format
  const products = data.map((row) => ({
    ...row,
    indication: row.indication
      ? row.indication.split(";").map((s) => s.trim())
      : [],
    approvalRegions: row.approvalRegions
      ? row.approvalRegions.split(";").map((s) => s.trim())
      : [],
    lyophilization:
      row.lyophilization === "是" ||
      row.lyophilization === "true" ||
      row.lyophilization === true,
    approvalYear: row.approvalYear ? parseInt(String(row.approvalYear)) || null : null,
  }));

  writeFileSync(jsonPath, JSON.stringify(products, null, 2), "utf-8");
  console.log(`✅ Exported ${products.length} products to ${jsonPath}`);
} else {
  // Read JSON → Write Excel
  const products = JSON.parse(readFileSync(jsonPath, "utf-8"));

  // Flatten arrays for Excel
  const rows = products.map((p) => ({
    ...p,
    indication: Array.isArray(p.indication) ? p.indication.join("; ") : p.indication,
    approvalRegions: Array.isArray(p.approvalRegions) ? p.approvalRegions.join("; ") : p.approvalRegions,
    lyophilization: p.lyophilization ? "是" : "否",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const cols = Object.keys(rows[0] || {}).map(() => ({ wch: 30 }));
  worksheet["!cols"] = cols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ADC Products");
  XLSX.writeFile(workbook, excelPath);
  console.log(`✅ Exported ${rows.length} products to ${excelPath}`);
}
