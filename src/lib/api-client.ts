import type { ADCProduct } from "./types";

export type { ADCProduct };

const BASE = "";

export interface DrugRow {
  id: number;
  adcdbId: string | null;
  antibody: string;
  brandName: string | null;
  genericCn: string | null;
  antibodySubclass: string | null;
  target: string | null;
  stage: string | null;
  indication: string[] | null;
  approvalYear: number | null;
  approvalRegions: string[] | null;
  lyophilization: boolean | null;
  dosageForm: string | null;
  lyoBuffer: string | null;
  lyoStabilizer: string | null;
  lyoSurfactant: string | null;
  lyoPh: string | null;
  lyoCycle: string | null;
  lyoPreConc: string | null;
  lyoPostConc: string | null;
  reconstitutionMedia: string | null;
  liquidExcipients: string | null;
  storageCondition: string | null;
  shelfLife: string | null;
  containerClosure: string | null;
  payloadClass: string | null;
  payloadName: string | null;
  payloadMechanism: string | null;
  linkerName: string | null;
  linkerType: string | null;
  linkerStructure: string | null;
  conjugationMethod: string | null;
  conjugationSite: string | null;
  conjugationChemistry: string | null;
  dar: string | null;
  darDistribution: string | null;
  purificationMethod: string | null;
  purityMethod: string | null;
  potencyMethod: string | null;
  criticalQualityAttrs: string | null;
  companyOriginator: string | null;
  companyLicensee: string | null;
  manufacturer: string | null;
  payloadSmiles: string | null;
  payloadStructure: string | null;
  pdbId: string | null;
  heavyChainSeq: string | null;
  lightChainSeq: string | null;
  cellLine: string | null;
  patentNumber: string | null;
  patentTitle: string | null;
  patentAssignee: string | null;
  patentFilingDate: string | null;
  patentExpiry: string | null;
  referenceLabel: string | null;
  referenceUrl: string | null;
  notes: string | null;
  lastUpdated: string | null;
  [key: string]: unknown;
}

export function normalizeDrug(row: DrugRow): ADCProduct {
  return {
    id: String(row.id),
    genericNameEn: "", // 数据库未存储，从antibody提取或留空
    genericNameCn: row.genericCn || "",
    brandName: row.brandName || "",
    target: row.target || "",
    antibody: row.antibody || "",
    antibodySubclass: row.antibodySubclass || "",
    indication: row.indication || [],
    stage: row.stage || "",
    companyOriginator: row.companyOriginator || "",
    companyLicensee: row.companyLicensee || "",
    approvalYear: row.approvalYear,
    approvalRegions: row.approvalRegions || [],
    payloadName: row.payloadName || "",
    payloadClass: row.payloadClass || "",
    payloadMechanism: row.payloadMechanism || "",
    linkerName: row.linkerName || "",
    linkerType: row.linkerType || "",
    linkerStructure: row.linkerStructure || "",
    conjugationMethod: row.conjugationMethod || "",
    conjugationSite: row.conjugationSite || "",
    conjugationChemistry: row.conjugationChemistry || "",
    dar: row.dar || "",
    darDistribution: row.darDistribution || "",
    purificationMethod: row.purificationMethod || "",
    dosageForm: row.dosageForm || "",
    lyophilization: row.lyophilization ?? false,
    lyoExcipientsBuffer: row.lyoBuffer || "",
    lyoExcipientsStabilizer: row.lyoStabilizer || "",
    lyoExcipientsSurfactant: row.lyoSurfactant || "",
    lyoPh: row.lyoPh || "",
    lyoPreConc: row.lyoPreConc || "",
    lyoPostConc: row.lyoPostConc || "",
    lyoCycle: row.lyoCycle || "",
    reconstitutionMedia: row.reconstitutionMedia || "",
    liquidExcipients: row.liquidExcipients || "",
    storageCondition: row.storageCondition || "",
    shelfLife: row.shelfLife || "",
    containerClosure: row.containerClosure || "",
    purityMethod: row.purityMethod || "",
    potencyMethod: row.potencyMethod || "",
    criticalQualityAttrs: row.criticalQualityAttrs || "",
    cellLine: row.cellLine || "",
    antibodySequenceHeavy: row.heavyChainSeq || "",
    antibodySequenceLight: row.lightChainSeq || "",
    signalPeptide: "",
    plasmidInfo: "",
    payloadSmiles: row.payloadSmiles || "",
    payloadStructure: row.payloadStructure || "",
    pdbId: row.pdbId || "",
    manufacturer: row.manufacturer || "",
    patentNumber: row.patentNumber || "",
    patentTitle: row.patentTitle || "",
    patentAssignee: row.patentAssignee || "",
    patentFilingDate: row.patentFilingDate || "",
    patentExpiry: row.patentExpiry || "",
    referenceLabel: row.referenceLabel || "",
    referenceUrl: row.referenceUrl || "",
    lastUpdated: row.lastUpdated || "",
    notes: row.notes || "",
  };
}

export interface PaginatedResult {
  products: ADCProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StatsResult {
  totalDrugs: number;
  withFormulation: number;
  lyophilized: number;
  approved: number;
  topTargets: { name: string; count: number }[];
}

export interface FormulationResult {
  products: ADCProduct[];
  page: number;
  pageSize: number;
  total: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

// ---- Drugs API ----

export async function fetchDrugs(params: {
  search?: string;
  stage?: string;
  target?: string;
  payloadClass?: string;
  conjugationMethod?: string;
  sort?: string;
  order?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedResult> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const raw = await fetchJson<{ products: DrugRow[]; total: number; page: number; pageSize: number; totalPages: number }>(`${BASE}/api/drugs/?${q.toString()}`);
  return { ...raw, products: raw.products.map(normalizeDrug) };
}

export async function fetchDrug(id: string): Promise<ADCProduct> {
  const raw = await fetchJson<DrugRow>(`${BASE}/api/drugs/${id}`);
  return normalizeDrug(raw);
}

// ---- Formulation API ----

export async function fetchFormulation(params: {
  dosage?: string;
  buffer?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<FormulationResult> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const raw = await fetchJson<{ products: DrugRow[]; page: number; pageSize: number; total: number }>(`${BASE}/api/formulation/?${q.toString()}`);
  return { ...raw, products: raw.products.map(normalizeDrug) };
}

// ---- Stats API ----

export async function fetchStats(): Promise<StatsResult> {
  return fetchJson(`${BASE}/api/stats/`);
}

// ---- Static helpers (for client-side filter options) ----
// These are small enough to keep in-memory after first fetch
let cachedTargets: string[] | null = null;
let cachedPayloadClasses: string[] | null = null;
let cachedConjugationMethods: string[] | null = null;

export async function fetchTargets(): Promise<string[]> {
  if (cachedTargets) return cachedTargets;
  const { products } = await fetchDrugs({ pageSize: 1 });
  // Get from stats endpoint or a dedicated filter endpoint
  // For now, fetch a sample page and cache isn't perfect
  return cachedTargets || [];
}
