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

  // CMC — payload & linker
  payloadName: string;
  payloadClass: string;
  payloadMechanism: string;
  linkerName: string;
  linkerType: string;
  linkerStructure: string;

  // CMC — conjugation
  conjugationMethod: string;
  conjugationSite: string;
  conjugationChemistry: string;
  dar: string;
  darDistribution: string;
  purificationMethod: string;

  // CMC — formulation & lyophilization
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

  // CMC — analytics
  purityMethod: string;
  potencyMethod: string;
  criticalQualityAttrs: string;

  // Patent & references
  patentNumber: string;
  patentTitle: string;
  patentAssignee: string;
  patentFilingDate: string;
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
