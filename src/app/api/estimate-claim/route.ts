import { NextResponse } from "next/server";
import { estimateClaim } from "@/lib/geminiClient";
import { adminDb, adminAuth } from "@/lib/firebase/adminApp";
import { nanoid } from "nanoid";
import { Timestamp } from "firebase-admin/firestore";
import type { ClaimEstimate } from "@/types";

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
    const { policyId, policyText, billText } = body;
    if (!policyId || !policyText || !billText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Call Gemini
    const aiResult = await estimateClaim({ policyText, billText });

    // 4. Save to Firestore
    const estimateId = nanoid();
    const createdAt = Timestamp.now();

    const estimateDoc: ClaimEstimate = {
      id: estimateId,
      userId,
      policyId,
      billText,
      aiCoverageSummary: aiResult.coverageRules,
      estimatedCoverageAmount: aiResult.estimatedCoverageAmount,
      coverageConfidence: aiResult.coverageConfidence,
      coverageBreakdown: aiResult.coverageBreakdown,
      plainExplanation: aiResult.plainExplanation,
      disclaimer: aiResult.disclaimer,
      createdAt: createdAt as any,
    };

    await adminDb.collection("claim_estimates").doc(estimateId).set(estimateDoc);

    return NextResponse.json(estimateDoc);

  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
