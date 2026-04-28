"use client";
import { useEffect, useState } from "react";
import { getEmergencyProfileBySlug, getLatestReport } from "@/lib/firestoreHelpers";
import { ShieldAlert, HeartPulse, Phone, AlertCircle, Clock, ActivitySquare } from "lucide-react";
import { FullPageSpinner } from "@/components/ui/Spinner";
import type { EmergencyProfile, Report } from "@/types";
import { formatTimestamp } from "@/lib/utils";

export default function PublicEmergencyCard({ params }: { params: { slug: string } }) {
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getEmergencyProfileBySlug(params.slug);
        if (data) {
          setProfile(data);
          try {
            const report = await getLatestReport(data.userId);
            setLatestReport(report);
          } catch(e) {
            console.error("Failed to load report", e);
          }
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.slug]);

  if (loading) return <FullPageSpinner />;

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Card Not Found</h1>
          <p className="text-slate-600">This emergency QR card is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          
          {/* Header */}
          <div className="bg-red-600 px-6 py-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <ShieldAlert className="h-32 w-32 text-white" />
            </div>
            <div className="relative z-10">
              <HeartPulse className="h-12 w-12 text-white mx-auto mb-3" />
              <h1 className="text-3xl font-bold text-white uppercase tracking-wider mb-1">
                Emergency Info
              </h1>
              <p className="text-red-200 text-sm font-medium">MEDICAL ALERT</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Identity */}
            <div className="text-center pb-6 border-b border-slate-100">
              <h2 className="text-3xl font-extrabold text-slate-900">{profile.name}</h2>
              <div className="mt-2 flex items-center justify-center gap-4 text-slate-600 font-medium">
                <span>{profile.age ? `${profile.age} years` : "Age N/A"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <div className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full">
                  <HeartPulse className="h-4 w-4" />
                  {profile.bloodGroup || "Unknown Blood Group"}
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Known Allergies
              </h3>
              {profile.allergies?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.map((alg, i) => (
                    <span key={i} className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold border border-rose-200">
                      {alg}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 bg-slate-50 px-4 py-3 rounded-lg text-sm border border-slate-100">
                  No known allergies reported.
                </p>
              )}
            </div>

            {/* Chronic Conditions */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Chronic Conditions
              </h3>
              {profile.chronicConditions?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.chronicConditions.map((cond, i) => (
                    <span key={i} className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-sm font-semibold border border-orange-200">
                      {cond}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 bg-slate-50 px-4 py-3 rounded-lg text-sm border border-slate-100">
                  No chronic conditions reported.
                </p>
              )}
            </div>

            {/* Recent Medical Alert */}
            {latestReport && (
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ActivitySquare className="h-4 w-4" /> Recent Health Analysis
                </h3>
                <div className={`rounded-xl p-4 border ${latestReport.overallStatus === 'abnormal' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`text-xs font-bold uppercase tracking-wider ${latestReport.overallStatus === 'abnormal' ? 'text-red-600' : 'text-blue-600'}`}>
                      {latestReport.reportType}
                    </p>
                    <p className="text-xs font-medium text-slate-500">{formatTimestamp(latestReport.createdAt)}</p>
                  </div>
                  <p className="text-sm text-slate-800 font-medium">
                    {latestReport.aiSummary}
                  </p>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mt-8">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" /> Emergency Contact
              </h3>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-lg">
                  {profile.emergencyContact?.name || "Not provided"}
                </p>
                <p className="text-slate-500 font-medium text-sm">
                  Relation: {profile.emergencyContact?.relation || "N/A"}
                </p>
                {profile.emergencyContact?.phone ? (
                  <a 
                    href={`tel:${profile.emergencyContact.phone}`}
                    className="inline-flex items-center gap-2 mt-3 w-full justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-sm"
                  >
                    <Phone className="h-5 w-5" />
                    Call {profile.emergencyContact.phone}
                  </a>
                ) : (
                  <p className="text-slate-500 font-medium mt-2">No phone number provided</p>
                )}
              </div>
            </div>

          </div>
          
          <div className="bg-slate-50 border-t border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Powered by MediBridge</p>
          </div>
        </div>
      </div>
    </div>
  );
}
