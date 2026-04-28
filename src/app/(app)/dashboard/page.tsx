"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getLatestReport, getUserProfile } from "@/lib/firestoreHelpers";
import type { Report, UserProfile } from "@/types";
import { formatTimestamp, reportStatusBadge, truncate } from "@/lib/utils";
import { FileText, Plus, ArrowRight, UserCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const [prof, rep] = await Promise.all([
          getUserProfile(user.uid),
          getLatestReport(user.uid),
        ]);
        setProfile(prof);
        setLatestReport(rep);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const statusObj = latestReport ? reportStatusBadge(latestReport.overallStatus) : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="page-heading">
          Welcome back, {profile?.name || user?.email?.split("@")[0]} 👋
        </h1>
        <p className="text-slate-400 mt-2">
          Here is the latest overview of your health.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Latest Report Card */}
        <section className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Latest Lab Report
            </h2>
            <Link
              href="/reports"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {latestReport ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-slate-300">
                  {latestReport.reportType}
                </span>
                <span className="text-slate-500 text-sm">•</span>
                <span className="text-sm text-slate-400">
                  {formatTimestamp(latestReport.createdAt)}
                </span>
                <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${statusObj?.bg} ${statusObj?.text}`}>
                  {statusObj?.label}
                </span>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 mb-4 flex-1">
                <p className="text-sm text-slate-300 line-clamp-3">
                  {latestReport.aiSummary}
                </p>
              </div>

              <Link
                href={`/reports/${latestReport.id}`}
                className="btn-secondary w-full justify-center"
              >
                View Full Report
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <p className="text-slate-400 text-sm mb-4">
                You haven't uploaded any lab reports yet.
              </p>
            </div>
          )}
        </section>

        {/* Quick Actions & Profile Snippet */}
        <div className="space-y-6">
          <section className="glass-card p-6">
            <h2 className="section-heading mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/reports/new" className="flex items-center p-3 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 transition-colors group">
                <div className="h-10 w-10 rounded bg-blue-500/20 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                  <Plus className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-200">Analyze New Report</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Paste text to get AI summary</p>
                </div>
              </Link>

              <Link href="/profile" className="flex items-center p-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors group">
                <div className="h-10 w-10 rounded bg-emerald-500/20 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                  <UserCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-200">Emergency Profile</h3>
                  <p className="text-xs text-slate-400 mt-0.5">View & share your QR card</p>
                </div>
              </Link>
            </div>
          </section>

          {profile && (
            <section className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                Profile Snippet
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-slate-500 mb-1">Blood Group</span>
                  <span className="font-medium text-slate-200">{profile.bloodGroup || "—"}</span>
                </div>
                <div>
                  <span className="block text-slate-500 mb-1">Age</span>
                  <span className="font-medium text-slate-200">{profile.age || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-slate-500 mb-1">Allergies</span>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies?.length > 0 ? (
                      profile.allergies.map((alg, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs">
                          {alg}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">None recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
