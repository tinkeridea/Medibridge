// src/lib/geminiClient.ts
// Server-side Gemini API client. All AI calls go through this module.
// Never import this in client components – it uses the server-only API key.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { serverEnv } from "@/config/env";
import type { 
  ParsedMetric, 
  CoverageBreakdownItem, 
  HealthPredictionResponse, 
  UserProfile, 
  HealthMetric,
  HospitalFinderResponse
} from "@/types";

// ─── Client singleton ────────────────────────────────────────────────────────

function getGeminiClient() {
  return new GoogleGenerativeAI(serverEnv.geminiApiKey());
}

function getModel() {
  return getGeminiClient().getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}

// ─── Types for internal Gemini responses ─────────────────────────────────────

interface GeminiReportResponse {
  patientExplanation: string;
  keyFindings: string[];
  doctorSummary: string;
  overallStatus: "normal" | "abnormal";
  metrics: ParsedMetric[];
}

interface GeminiClaimResponse {
  coverageRules: string;
  coverageBreakdown: CoverageBreakdownItem[];
  estimatedCoverageAmount: number;
  coverageConfidence: "low" | "medium" | "high";
  plainExplanation: string;
  disclaimer: string;
}

// ─── Analyze Medical Report ──────────────────────────────────────────────────

export async function analyzeMedicalReport({
  reportText,
  reportType,
  fileData,
  fileMimeType,
}: {
  reportText: string;
  reportType: string;
  fileData?: string;
  fileMimeType?: string;
}): Promise<GeminiReportResponse> {
  const model = getModel();

  let textPrompt = `You are a helpful medical assistant helping Indian patients understand their lab reports. 
Analyze the provided ${reportType} lab report and respond ONLY with valid JSON matching the exact schema below.

REPORT TYPE: ${reportType}
`;

  if (reportText) {
    textPrompt += `\nLAB REPORT TEXT:\n---\n${reportText}\n---\n`;
  }

  textPrompt += `\nRespond with ONLY this JSON structure (no markdown, no code blocks, just raw JSON):
{
  "patientExplanation": "A clear, friendly explanation in simple English (2-3 sentences) that a non-medical person can understand. Use simple words and avoid medical jargon.",
  "keyFindings": [
    "Finding 1 in plain language",
    "Finding 2 in plain language", 
    "Finding 3 in plain language"
  ],
  "doctorSummary": "A concise clinical summary (1-2 sentences) using appropriate medical terminology, suitable for a doctor's reference.",
  "overallStatus": "normal",
  "metrics": [
    {
      "name": "Metric name (e.g. Hemoglobin)",
      "value": 12.5,
      "unit": "g/dL",
      "normal_range": "12.0-17.5 g/dL",
      "status": "normal"
    }
  ]
}

Rules:
- overallStatus must be exactly "normal" or "abnormal"
- Each metric status must be exactly "low", "normal", or "high"
- metric value must be a number (not a string)
- If a value is not clearly a number, make your best estimate based on context
- Include all measurable metrics found in the report
- If the report text or document is unclear or not a medical report, still return valid JSON with a helpful explanation`;

  try {
    const promptParts: (string | { inlineData: { data: string; mimeType: string } })[] = [textPrompt];
    
    if (fileData && fileMimeType) {
      promptParts.push({
        inlineData: {
          data: fileData,
          mimeType: fileMimeType
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const text = result.response.text();
    let parsed: GeminiReportResponse;
    try {
      // Sometimes Gemini wraps JSON in markdown blocks even with responseMimeType set
      const sanitizedText = text.replace(/```json\n?|```/g, "").trim();
      parsed = JSON.parse(sanitizedText) as GeminiReportResponse;
    } catch {
      console.error("Failed to parse Gemini response as JSON. Raw text:", text);
      throw new Error("AI returned malformed data.");
    }
    return parsed;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Gemini analyzeMedicalReport error details:", error);
    throw new Error(`Failed to analyze report: ${msg}`);
  }
}

// ─── Estimate Insurance Claim ─────────────────────────────────────────────────

export async function estimateClaim({
  policyText,
  billText,
}: {
  policyText: string;
  billText: string;
}): Promise<GeminiClaimResponse> {
  const model = getModel();

  const prompt = `You are an insurance claim advisor helping Indian patients understand their health insurance claims.
Analyze the policy wording and hospital bill below. Respond ONLY with valid JSON matching the exact schema.

HEALTH INSURANCE POLICY WORDING:
---
${policyText}
---

HOSPITAL BILL / EXPENSE LIST:
---
${billText}
---

Respond with ONLY this JSON structure (no markdown, no code blocks, just raw JSON):
{
  "coverageRules": "Brief summary of the key coverage rules from the policy that are relevant to this bill (2-3 sentences).",
  "coverageBreakdown": [
    {
      "item": "Bill item name",
      "amount": 5000,
      "status": "covered",
      "reason": "Brief reason why this item is covered/unclear/excluded"
    }
  ],
  "estimatedCoverageAmount": 45000,
  "coverageConfidence": "medium",
  "plainExplanation": "A plain-language explanation of the overall claim estimate that a patient can understand (3-4 sentences).",
  "disclaimer": "This is an AI-generated estimate only and is not a guarantee of coverage. Actual claim settlement depends on your insurer's assessment, policy terms, and supporting documents. Please consult your insurance company or a licensed insurance advisor for official decisions."
}

Rules:
- Each item status must be exactly "covered", "unclear", or "excluded"
- amount must be a number (not a string)
- estimatedCoverageAmount must be a number representing total estimated claimable amount in INR
- coverageConfidence must be exactly "low", "medium", or "high"
- If bill amounts are not clearly specified, estimate based on typical Indian hospital costs
- Always include the disclaimer exactly as provided above
- Be conservative in your estimates to avoid misleading the user`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as GeminiClaimResponse;
    return parsed;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Gemini estimateClaim error details:", error);
    throw new Error(`Failed to estimate claim: ${msg}`);
  }
}

// ─── Health Prediction ───────────────────────────────────────────────────────

export async function generateHealthPrediction({
  profile,
  metrics,
}: {
  profile: UserProfile;
  metrics: HealthMetric[];
}): Promise<HealthPredictionResponse> {
  const model = getModel();

  const prompt = `You are an advanced preventative health AI. Analyze the patient's profile and historical lab metrics.
Provide a proactive health risk assessment and actionable recommendations.
Respond ONLY with valid JSON matching the exact schema.

PATIENT PROFILE:
Age: ${profile.age || "Unknown"}
Gender: ${profile.gender || "Unknown"}
Blood Group: ${profile.bloodGroup || "Unknown"}
Allergies: ${profile.allergies.join(", ") || "None reported"}
Chronic Conditions: ${profile.chronicConditions.join(", ") || "None reported"}

HISTORICAL METRICS:
${JSON.stringify(
  metrics.map((m) => ({
    metric: m.metricName,
    value: m.metricValue,
    unit: m.unit,
    status: m.status,
    date: new Date(m.date.seconds * 1000).toISOString().split('T')[0],
  })), null, 2
)}

Respond with ONLY this JSON structure (no markdown, no code blocks, just raw JSON):
{
  "riskLevel": "low",
  "analysis": "A concise paragraph analyzing the current trends in the patient's metrics over time.",
  "trends": [
    {
      "trend": "Description of the trend (e.g. 'Blood sugar is slowly rising')",
      "impact": "negative"
    }
  ],
  "recommendations": [
    "Actionable lifestyle or dietary recommendation 1",
    "Actionable recommendation 2"
  ]
}

Rules:
- riskLevel must be exactly "low", "medium", or "high"
- impact must be exactly "positive", "negative", or "neutral"
- If no metrics are provided, give general health advice based on their profile.
- Be supportive and clear. Do not diagnose, but warn of potential risks.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    let parsed: HealthPredictionResponse;
    try {
      const sanitizedText = text.replace(/```json\n?|```/g, "").trim();
      parsed = JSON.parse(sanitizedText) as HealthPredictionResponse;
    } catch {
      console.error("Failed to parse prediction response as JSON. Raw text:", text);
      throw new Error("AI returned malformed data.");
    }
    return parsed;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Gemini generateHealthPrediction error details:", error);
    throw new Error(`Failed to generate prediction: ${msg}`);
  }
}

// ─── Hospital Finder ────────────────────────────────────────────────────────

export async function findNearbyHospitals({
  location,
  medicalIssue,
}: {
  location: string;
  medicalIssue: string;
}): Promise<HospitalFinderResponse> {
  const model = getModel();

  const prompt = `You are a medical navigation AI assisting a patient in ${location}.
The patient has the following medical condition/issue based on their recent lab report:
"${medicalIssue}"

Your task is to recommend 3 specific, real hospitals or medical clinics near or in ${location} that are well-suited to treat this specific condition.

Respond ONLY with valid JSON matching this exact schema:
{
  "recommendedHospitalTypes": ["Cardiology Center", "General Hospital"],
  "hospitals": [
    {
      "name": "Exact Name of Hospital",
      "type": "Type of facility (e.g., Multi-specialty, Diagnostic Center)",
      "distanceEstimate": "Rough distance or area location (e.g., 'Central City', '~5 km away')",
      "suitabilityReason": "Why this hospital is good for their specific issue (1 sentence).",
      "contactInfo": "Phone number or website if known, otherwise 'Contact info unavailable'"
    }
  ]
}

Rules:
- You must return exactly 3 hospitals.
- They must be practical and plausible for the location provided.
- Keep the suitability reason brief and directly related to the medical issue.
- Respond with ONLY the raw JSON. No markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    let parsed: HospitalFinderResponse;
    try {
      const sanitizedText = text.replace(/```json\n?|```/g, "").trim();
      parsed = JSON.parse(sanitizedText) as HospitalFinderResponse;
    } catch {
      console.error("Failed to parse hospital response as JSON. Raw text:", text);
      throw new Error("AI returned malformed data.");
    }
    return parsed;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Gemini findNearbyHospitals error details:", error);
    throw new Error(`Failed to find hospitals: ${msg}`);
  }
}
