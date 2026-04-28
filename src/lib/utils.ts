// src/lib/utils.ts
// General utility functions used across the app.

import { format } from "date-fns";
import type { FirestoreTimestampLike } from "@/types";

/** Convert a Firestore Timestamp to a human-readable date string */
export function formatTimestamp(
  ts: FirestoreTimestampLike | undefined | null,
  fmt = "dd MMM yyyy"
): string {
  if (!ts) return "—";
  try {
    return format(ts.toDate(), fmt);
  } catch {
    return "—";
  }
}

/** Format a number as Indian Rupees */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Get a color class based on a metric status */
export function statusColor(status: "low" | "normal" | "high" | string): string {
  switch (status) {
    case "normal":
      return "text-green-400";
    case "low":
      return "text-blue-400";
    case "high":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

/** Get a badge color based on report overall status */
export function reportStatusBadge(status: "normal" | "abnormal" | string) {
  return status === "normal"
    ? { bg: "bg-green-500/20", text: "text-green-400", label: "Normal" }
    : { bg: "bg-red-500/20", text: "text-red-400", label: "Abnormal" };
}

/** Get color for coverage confidence */
export function confidenceColor(conf: "low" | "medium" | "high" | string): string {
  switch (conf) {
    case "high":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

/** Get color class for coverage item status */
export function coverageStatusColor(
  status: "covered" | "unclear" | "excluded" | string
): string {
  switch (status) {
    case "covered":
      return "text-green-400";
    case "unclear":
      return "text-yellow-400";
    case "excluded":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

/** Clamp a string to a max length */
export function truncate(str: string, maxLen = 100): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}
