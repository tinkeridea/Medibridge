import { NextResponse } from "next/server";
import { generateHealthPrediction } from "@/lib/geminiClient";
import { adminDb, adminAuth } from "@/lib/firebase/adminApp";
import type { UserProfile, HealthMetric } from "@/types";

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
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // 2. Fetch User Profile
    const profileDoc = await adminDb.collection("users").doc(userId).get();
    if (!profileDoc.exists) {
      return NextResponse.json({ error: "User profile not found. Please complete your profile first." }, { status: 404 });
    }
    const profile = profileDoc.data() as UserProfile;

    // 3. Fetch Historical Metrics
    const metricsSnapshot = await adminDb.collection("health_metrics")
      .where("userId", "==", userId)
      .get();
    
    const metrics = metricsSnapshot.docs
      .map(doc => doc.data() as HealthMetric)
      .sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0));

    // 4. Call Gemini
    const aiResult = await generateHealthPrediction({ profile, metrics });

    return NextResponse.json(aiResult);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("Prediction API error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
