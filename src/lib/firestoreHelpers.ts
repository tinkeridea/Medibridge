import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase/clientApp";
import type {
  UserProfile,
  EmergencyProfile,
  Report,
  HealthMetric,
  InsurancePolicy,
  ClaimEstimate,
} from "@/types";

// Generic fetcher for a single document
export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
}

// User Profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return getDocument<UserProfile>("users", userId);
}

export async function saveUserProfile(userId: string, data: Partial<UserProfile>) {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, { ...data, updatedAt: Timestamp.now() }, { merge: true });
}

// Emergency Profile
export async function getEmergencyProfileByUserId(userId: string): Promise<EmergencyProfile | null> {
  const q = query(collection(db, "emergency_profiles"), where("userId", "==", userId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as EmergencyProfile;
}

export async function getEmergencyProfileBySlug(slug: string): Promise<EmergencyProfile | null> {
  const q = query(collection(db, "emergency_profiles"), where("qrSlug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as EmergencyProfile;
}

// Reports
export async function getReports(userId: string): Promise<Report[]> {
  const q = query(
    collection(db, "reports"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Report);
}

export async function getLatestReport(userId: string): Promise<Report | null> {
  const q = query(
    collection(db, "reports"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Report;
}

export async function getHealthMetrics(userId: string, metricName?: string): Promise<HealthMetric[]> {
  let q = query(
    collection(db, "health_metrics"),
    where("userId", "==", userId),
    orderBy("date", "asc")
  );
  if (metricName) {
    q = query(
      collection(db, "health_metrics"),
      where("userId", "==", userId),
      where("metricName", "==", metricName),
      orderBy("date", "asc")
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as HealthMetric);
}

// Insurance
export async function getPolicies(userId: string): Promise<InsurancePolicy[]> {
  const q = query(
    collection(db, "insurance_policies"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as InsurancePolicy);
}

export async function getLatestClaimEstimate(userId: string): Promise<ClaimEstimate | null> {
  const q = query(
    collection(db, "claim_estimates"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as ClaimEstimate;
}
