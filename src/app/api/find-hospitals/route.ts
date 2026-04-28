import { NextResponse } from "next/server";
import { findNearbyHospitals } from "@/lib/geminiClient";
import { adminAuth } from "@/lib/firebase/adminApp";

export async function POST(req: Request) {
  try {
    // 1. Verify Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    try {
      await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Parse Request
    const body = await req.json();
    const { location, medicalIssue } = body;

    if (!location || !medicalIssue) {
      return NextResponse.json({ error: "Missing location or medical issue" }, { status: 400 });
    }

    // 3. Call AI
    const result = await findNearbyHospitals({ location, medicalIssue });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("API error details:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
