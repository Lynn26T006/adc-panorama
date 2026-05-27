const BUFFER_CLASS_MAP: Record<string, string> = {
  "柠檬酸钠": "柠檬酸盐",
  "柠檬酸": "柠檬酸",
  "琥珀酸钠": "琥珀酸盐",
  "Tris": "Tris",
  "组氨酸": "L-组氨酸",
  "MES": "MES",
  "磷酸": "磷酸盐",
  "甘氨酸": "甘氨酸",
};

export function classifyBuffer(raw: string): string {
  if (!raw) return "";
  for (const [key, label] of Object.entries(BUFFER_CLASS_MAP)) {
    if (raw.includes(key)) return label;
  }
  return raw.split(" ")[0].split(";")[0].trim();
}

const STABILIZER_CLASS_MAP: Record<string, string> = {
  "海藻糖": "海藻糖",
  "蔗糖": "蔗糖",
  "甘露醇": "甘露醇",
  "D-甘露醇": "甘露醇",
  "氯化钠": "氯化钠",
  "右旋糖酐": "右旋糖酐",
  "聚山梨酯20": "聚山梨酯20",
  "聚山梨酯80": "聚山梨酯80",
};

export function classifyStabilizer(raw: string): string {
  if (!raw) return "";
  for (const [key, label] of Object.entries(STABILIZER_CLASS_MAP)) {
    if (raw.includes(key)) return label;
  }
  return raw.split(" ")[0].split(";")[0].trim();
}

const SURFACTANT_CLASS_MAP: Record<string, string> = {
  "聚山梨酯80": "聚山梨酯80",
  "聚山梨酯20": "聚山梨酯20",
  "Polysorbate 80": "聚山梨酯80",
  "Polysorbate 20": "聚山梨酯20",
  "吐温80": "聚山梨酯80",
  "吐温20": "聚山梨酯20",
};

export function classifySurfactant(raw: string): string {
  if (!raw) return "";
  for (const [key, label] of Object.entries(SURFACTANT_CLASS_MAP)) {
    if (raw.includes(key)) return label;
  }
  return raw.split(" ")[0].split(";")[0].trim().replace(/,$/, "");
}
