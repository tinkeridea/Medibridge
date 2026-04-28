"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getReports, getHealthMetrics } from "@/lib/firestoreHelpers";
import type { Report, HealthMetric } from "@/types";
import { formatTimestamp, reportStatusBadge } from "@/lib/utils";
import { FileText, Plus, LineChart as ChartIcon, ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { TrendChart } from "@/components/reports/TrendChart";

export default function ReportsListPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMetricName, setSelectedMetricName] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [reps, mets] = await Promise.all([
          getReports(user.uid),
          getHealthMetrics(user.uid),
        ]);
        setReports(reps);
        setMetrics(mets);
        
        // Auto-select first available metric for the chart
        if (mets.length > 0) {
          const uniqueNames = Array.from(new Set(mets.map(m => m.metricName)));
          if (uniqueNames.includes("Hemoglobin")) {
            setSelectedMetricName("Hemoglobin");
          } else {
            setSelectedMetricName(uniqueNames[0]);
          }
        }
      } catch (error) {
        console.error("Error loading reports", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Extract unique metric names for the dropdown
  const uniqueMetricNames = useMemo(() => {
    return Array.from(new Set(metrics.map(m => m.metricName))).sort();
  }, [metrics]);

  // Filter metrics for the chart
  const chartMetrics = useMemo(() => {
    if (!selectedMetricName) return [];
    return metrics.filter(m => m.metricName === selectedMetricName);
  }, [metrics, selectedMetricName]);

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="page-heading flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-400" />
            Medical Reports
          </h1>
          <p className="text-slate-400 mt-2">View all your AI-analyzed lab reports and track health trends.</p>
        </div>
        <Link href="/reports/new" className="btn-primary shrink-0">
          <Plus className="h-5 w-5" /> Analyze New Report
        </Link>
      </header>

      {/* Trend Chart Section */}
      {metrics.length > 0 && (
        <section className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="section-heading flex items-center gap-2">
              <ChartIcon className="h-5 w-5 text-blue-400" />
              Health Trends
            </h2>
            <select
              className="input-field py-2 text-sm sm:w-auto w-full"
              value={selectedMetricName}
              onChange={(e) => setSelectedMetricName(e.target.value)}
            >
              {uniqueMetricNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          
          <TrendChart metrics={chartMetrics} metricName={selectedMetricName} />
        </section>
      )}

      {/* Reports List */}
      <section className="space-y-4">
        <h2 className="section-heading mb-4">Past Reports</h2>
        
        {reports.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center">
            <FileText className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No reports yet</h3>
            <p className="text-slate-500 max-w-md mb-6">
              You haven&apos;t uploaded any medical reports. Paste your first lab report to get an AI summary and start tracking your metrics.
            </p>
            <Link href="/reports/new" className="btn-primary">
              <Plus className="h-5 w-5" /> Analyze New Report
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reports.map((report) => {
              const status = reportStatusBadge(report.overallStatus);
              return (
                <Link key={report.id} href={`/reports/${report.id}`} className="glass-card-hover block p-5 group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {report.reportType}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTimestamp(report.createdAt)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                    {report.aiSummary}
                  </p>
                  
                  <div className="flex items-center text-blue-500 text-sm font-medium gap-1">
                    View Details <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
