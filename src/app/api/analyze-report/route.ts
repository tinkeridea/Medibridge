import { NextResponse } from "next/server";
import { analyzeMedicalReport } from "@/lib/geminiClient";
import { adminDb, adminAuth } from "@/lib/firebase/adminApp";
import { nanoid } from "nanoid";
import { Timestamp } from "firebase-admin/firestore";
import type { Report, HealthMetric } from "@/types";

export async function POST(req: Request) {
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // 2. Parse Body
    const body = await req.json();
    const { reportText, reportType, fileData, fileMimeType, fileUrl, fileName } = body;
    if (!reportType || (!reportText && !fileData)) {
      return NextResponse.json({ error: "Missing required fields (need report type and either text or file)" }, { status: 400 });
    }

    // 3. Call Gemini
    const aiResult = await analyzeMedicalReport({ 
      reportText: reportText || "", 
      reportType, 
      fileData, 
      fileMimeType 
    });

    // 4. Save to Firestore
    const reportId = nanoid();
    const createdAt = Timestamp.now();

    const reportDoc: Report = {
      id: reportId,
      userId,
      createdAt: createdAt as any, // Typed as client timestamp in shared types, but we cast
      reportType,
      rawText: reportText || "[Document Uploaded]",
      aiSummary: aiResult.patientExplanation,
      doctorSummary: aiResult.doctorSummary,
      overallStatus: aiResult.overallStatus,
      keyFindings: aiResult.keyFindings,
      fileUrl: fileUrl || "",
      fileName: fileName || "",
    };

    const batch = adminDb.batch();
    
    // Write Report
    const reportRef = adminDb.collection("reports").doc(reportId);
    batch.set(reportRef, reportDoc);

    // Write Metrics
    const metricsToSave = aiResult.metrics.map(m => {
      const metricId = nanoid();
      const metricDoc: HealthMetric = {
        id: metricId,
        userId,
        reportId,
        metricName: m.name,
        metricValue: m.value,
        unit: m.unit,
        normalRange: m.normal_range,
        status: m.status,
        date: createdAt as any,
      };
      const metricRef = adminDb.collection("health_metrics").doc(metricId);
      batch.set(metricRef, metricDoc);
      return metricDoc;
    });

    await batch.commit();

    return NextResponse.json({
      reportId,
      aiSummary: reportDoc.aiSummary,
      doctorSummary: reportDoc.doctorSummary,
      overallStatus: reportDoc.overallStatus,
      keyFindings: reportDoc.keyFindings,
      metrics: aiResult.metrics,
    });

  } catch (error: any) {
    console.error("API error details:", error);
    return NextResponse.json({ error: error.message || "Internal server error", stack: error.stack }, { status: 500 });
  }
}
