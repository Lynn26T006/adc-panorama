export interface ADCProduct {
  id: string;
  genericNameEn: string;
  genericNameCn: string;
  brandName: string;
  target: string;
  antibody: string;
  antibodySubclass: string;
  indication: string[];
  stage: string;
  companyOriginator: string;
  companyLicensee: string;
  approvalYear: number | null;
  approvalRegions: string[];

  payloadName: string;
  payloadClass: string;
  payloadMechanism: string;
  linkerName: string;
  linkerType: string;
  linkerStructure: string;

  conjugationMethod: string;
  conjugationSite: string;
  conjugationChemistry: string;
  dar: string;
  darDistribution: string;
  purificationMethod: string;

  dosageForm: string;
  lyophilization: boolean;
  lyoExcipientsBuffer: string;
  lyoExcipientsStabilizer: string;
  lyoExcipientsSurfactant: string;
  lyoPh: string;
  lyoPreConc: string;
  lyoPostConc: string;
  lyoCycle: string;
  reconstitutionMedia: string;
  liquidExcipients: string;
  storageCondition: string;
  shelfLife: string;
  containerClosure: string;

  purityMethod: string;
  potencyMethod: string;
  criticalQualityAttrs: string;

  cellLine: string;
  antibodySequenceHeavy: string;
  antibodySequenceLight: string;
  signalPeptide: string;
  plasmidInfo: string;

  payloadSmiles: string;
  payloadStructure: string;

  pdbId: string;
  manufacturer: string;

  patentNumber: string;
  patentTitle: string;
  patentAssignee: string;
  patentFilingDate: string;
  patentExpiry: string;
  referenceLabel: string;
  referenceUrl: string;
  lastUpdated: string;
  notes: string;
}

export type StageFilter =
  | "已上市"
  | "NDA"
  | "临床III期"
  | "临床II期"
  | "临床I期"
  | "IND";

export type SortField = "brandName" | "target" | "stage" | "approvalYear" | "conjugationMethod";
export type SortOrder = "asc" | "desc";
