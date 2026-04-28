// src/types/index.ts
// Shared TypeScript interfaces for all Firestore collections and API responses.

export interface FirestoreTimestampLike {
  seconds: number;
  toDate(): Date;
}

// ─── Firestore Documents ────────────────────────────────────────────────────

export interface UserProfile {
  id: string; // Firebase uid
  name: string;
  email: string;
  age: number | null;
  gender: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
}

export interface EmergencyProfile {
  id: string;
  userId: string;
  qrSlug: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  name: string;
  age: number | null;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
}

export interface Report {
  id: string;
  userId: string;
  createdAt: FirestoreTimestampLike;
  reportType: string;
  rawText: string;
  aiSummary: string;
  doctorSummary: string;
  overallStatus: "normal" | "abnormal";
  keyFindings: string[];
  fileUrl?: string;
  fileName?: string;
}

export interface HealthMetric {
  id: string;
  userId: string;
  reportId: string;
  metricName: string;
  metricValue: number;
  unit: string;
  normalRange: string;
  status: "low" | "normal" | "high";
  date: FirestoreTimestampLike;
}

export interface InsurancePolicy {
  id: string;
  userId: string;
  insurerName: string;
  policyNumber: string;
  sumInsured: number;
  planName: string;
  validFrom: string;
  validTo: string;
  policyText: string;
  createdAt: FirestoreTimestampLike;
}

export interface ClaimEstimate {
  id: string;
  userId: string;
  policyId: string;
  billText: string;
  aiCoverageSummary: string;
  estimatedCoverageAmount: number;
  coverageConfidence: "low" | "medium" | "high";
  coverageBreakdown: CoverageBreakdownItem[];
  plainExplanation: string;
  disclaimer: string;
  createdAt: FirestoreTimestampLike;
}

export interface CoverageBreakdownItem {
  item: string;
  amount: number;
  status: "covered" | "unclear" | "excluded";
  reason: string;
}

// ─── API Request / Response Shapes ─────────────────────────────────────────

export interface AnalyzeReportRequest {
  reportText: string;
  reportType: string;
  fileData?: string;
  fileMimeType?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface ParsedMetric {
  name: string;
  value: number;
  unit: string;
  normal_range: string;
  status: "low" | "normal" | "high";
}

export interface AnalyzeReportResponse {
  reportId: string;
  aiSummary: string;
  doctorSummary: string;
  overallStatus: "normal" | "abnormal";
  keyFindings: string[];
  metrics: ParsedMetric[];
}

export interface EstimateClaimRequest {
  policyId: string;
  policyText: string;
  billText: string;
}

export interface EstimateClaimResponse {
  estimateId: string;
  aiCoverageSummary: string;
  estimatedCoverageAmount: number;
  coverageConfidence: "low" | "medium" | "high";
  coverageBreakdown: CoverageBreakdownItem[];
  plainExplanation: string;
  disclaimer: string;
}

export interface PredictionTrend {
  trend: string;
  impact: "positive" | "negative" | "neutral";
}

export interface HealthPredictionResponse {
  riskLevel: "low" | "medium" | "high";
  analysis: string;
  trends: PredictionTrend[];
  recommendations: string[];
}

export interface Hospital {
  name: string;
  type: string;
  distanceEstimate: string;
  suitabilityReason: string;
  contactInfo: string;
}

export interface HospitalFinderResponse {
  recommendedHospitalTypes: string[];
  hospitals: Hospital[];
}

// ─── UI Helper Types ────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;
  value: number;
}
