"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { HeartPulse, Activity, AlertTriangle, CheckCircle2, Bot, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import type { HealthPredictionResponse } from "@/types";

export default function PredictionsPage() {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState<HealthPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePrediction = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/predict-health", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate prediction");
      }

      const data = await res.json();
      setPrediction(data);
      toast.success("AI Analysis Complete");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "medium": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "high": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "positive": return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case "negative": return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-heading flex items-center gap-3">
            <HeartPulse className="h-8 w-8 text-rose-400" />
            AI Health Predictions
          </h1>
          <p className="text-slate-400 mt-2">
            Get personalized preventative health insights based on your medical history and lab trends.
          </p>
        </div>
        <button 
          onClick={generatePrediction}
          disabled={loading}
          className="btn-primary shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2"><Spinner size="sm" /> Analyzing Data...</span>
          ) : (
            <span className="flex items-center gap-2"><Bot className="h-5 w-5" /> Generate AI Assessment</span>
          )}
        </button>
      </header>

      {!prediction && !loading && (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <Activity className="h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">Ready for Analysis</h3>
          <p className="text-slate-500 max-w-md">
            Click the button above to let our AI analyze your saved lab reports, allergies, and chronic conditions to identify potential future health risks.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="h-32 loading-pulse"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-48 loading-pulse"></div>
            <div className="h-48 loading-pulse"></div>
          </div>
        </div>
      )}

      {prediction && !loading && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Risk Level & Overview */}
          <section className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-400" /> Executive Summary
              </h2>
              <div className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${getRiskColor(prediction.riskLevel)}`}>
                Risk Level: {prediction.riskLevel}
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                {prediction.analysis}
              </p>
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Identified Trends */}
            <section className="glass-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Identified Trends
              </h2>
              {prediction.trends.length > 0 ? (
                <ul className="space-y-4">
                  {prediction.trends.map((trend, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="mt-0.5 shrink-0 bg-slate-900 p-1.5 rounded-md">
                        {getImpactIcon(trend.impact)}
                      </div>
                      <p>{trend.trend}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm">No specific trends identified from available data.</p>
              )}
            </section>

            {/* Recommendations */}
            <section className="glass-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> AI Recommendations
              </h2>
              <ul className="space-y-3">
                {prediction.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-yellow-400/90 text-xs sm:text-sm leading-relaxed">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              <strong>Disclaimer:</strong> This is an AI-generated assessment based purely on the historical lab data and profile information you have provided. It is designed for educational and preventative purposes only and is absolutely <strong>not a medical diagnosis</strong>. Always consult a qualified healthcare provider for medical advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
