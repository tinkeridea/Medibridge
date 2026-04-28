"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDocument, getHealthMetrics } from "@/lib/firestoreHelpers";
import type { Report, HealthMetric } from "@/types";
import { formatTimestamp, reportStatusBadge, statusColor } from "@/lib/utils";
import { FileText, ArrowLeft, Activity, UserCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const rep = await getDocument<Report>("reports", params.id);
        if (rep && rep.userId === user.uid) {
          setReport(rep);
          // Fetch metrics specific to this report
          const allMetrics = await getHealthMetrics(user.uid);
          const repMetrics = allMetrics.filter(m => m.reportId === params.id);
          setMetrics(repMetrics);
        }
      } catch (error) {
        console.error("Error loading report details", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, params.id]);

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  if (!report) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-semibold text-slate-300">Report not found</h2>
        <Link href="/reports" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
          &larr; Back to Reports
        </Link>
      </div>
    );
  }

  const status = reportStatusBadge(report.overallStatus);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Link href="/reports" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to all reports
      </Link>

      <header className="glass-card p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{report.reportType}</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-slate-400">{formatTimestamp(report.createdAt)}</p>
                {report.fileUrl && (
                  <a 
                    href={report.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-medium text-blue-400 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Original
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-lg font-bold border ${status.bg} ${status.text} border-${status.text.replace('text-', '')}/20 flex items-center gap-2`}>
          <Activity className="h-5 w-5" />
          Overall Status: {status.label}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* AI Explanations */}
        <div className="md:col-span-2 space-y-6">
          <section className="glass-card p-6 border-t-4 border-t-blue-500">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Patient-Friendly Summary
            </h2>
            <p className="text-slate-200 leading-relaxed text-sm sm:text-base">
              {report.aiSummary}
            </p>
          </section>

          <section className="glass-card p-6 border-t-4 border-t-emerald-500">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Key Findings
            </h2>
            {report.keyFindings && report.keyFindings.length > 0 ? (
              <ul className="space-y-3">
                {report.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-300 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    {finding}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm">No specific key findings highlighted.</p>
            )}
          </section>
        </div>

        {/* Doctor Summary & Raw Text */}
        <div className="space-y-6">
          <section className="glass-card p-6 bg-slate-900/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Clinical / Doctor Summary
            </h2>
            <p className="text-sm text-slate-300">
              {report.doctorSummary}
            </p>
          </section>

          <section className="glass-card p-6 overflow-hidden flex flex-col max-h-[400px]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Raw Extracted Text
            </h2>
            <div className="flex-1 overflow-y-auto bg-black/40 rounded p-3 border border-white/5">
              <pre className="text-[10px] text-slate-500 font-mono whitespace-pre-wrap">
                {report.rawText}
              </pre>
            </div>
          </section>
        </div>
      </div>

      {/* Metrics Table */}
      {metrics.length > 0 && (
        <section className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="section-heading">Detailed Metrics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Test Name</th>
                  <th className="px-6 py-4 font-medium">Result</th>
                  <th className="px-6 py-4 font-medium">Reference Range</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {metric.metricName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-slate-300">{metric.metricValue}</span>{" "}
                      <span className="text-slate-500 text-xs">{metric.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                      {metric.normalRange}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/5 ${statusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
