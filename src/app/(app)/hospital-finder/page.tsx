"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { MapPin, Navigation, Bot, Building2, Phone, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import type { HospitalFinderResponse, Report } from "@/types";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";

export default function HospitalFinderPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationStr, setLocationStr] = useState("");
  const [medicalIssue, setMedicalIssue] = useState("");
  const [fetchingReport, setFetchingReport] = useState(true);
  const [result, setResult] = useState<HospitalFinderResponse | null>(null);

  useEffect(() => {
    async function fetchLatestReport() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "reports"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const report = snap.docs[0].data() as Report;
          setMedicalIssue(`Patient has a ${report.reportType} showing: ${report.aiSummary}`);
        }
      } catch (err) {
        console.error("Error fetching latest report:", err);
      } finally {
        setFetchingReport(false);
      }
    }
    fetchLatestReport();
  }, [user]);

  const getLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode using a free API or just use lat/lng
          const { latitude, longitude } = position.coords;
          // For prototype, we'll pass coordinates to Gemini. Gemini can understand basic coordinates, 
          // or we can use BigDataCloud free reverse geocoding API.
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          const cityArea = data.city || data.locality || "Unknown Area";
          setLocationStr(`${cityArea}, ${data.principalSubdivision}, ${data.countryName}`);
          toast.success("Location acquired");
        } catch (error) {
          setLocationStr(`Coordinates: ${position.coords.latitude}, ${position.coords.longitude}`);
          toast.success("Coordinates acquired");
        }
        setLocating(false);
      },
      (error) => {
        toast.error("Unable to retrieve your location");
        setLocating(false);
      }
    );
  };

  const handleFindHospitals = async () => {
    if (!locationStr || !medicalIssue) {
      toast.error("Please provide both location and a medical issue");
      return;
    }

    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/find-hospitals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ location: locationStr, medicalIssue }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to find hospitals");
      }

      const data = await res.json();
      setResult(data);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="page-heading flex items-center gap-3">
          <Navigation className="h-8 w-8 text-blue-400" />
          AI Hospital Finder
        </h1>
        <p className="text-slate-400 mt-2">
          Based on your latest medical report, our AI will recommend the most suitable hospitals near you.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Input */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-5 space-y-4">
            <div>
              <label className="label">1. Your Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Delhi, India"
                  className="input-field flex-1"
                  value={locationStr}
                  onChange={(e) => setLocationStr(e.target.value)}
                />
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locating}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-blue-400 border border-white/10 transition-colors"
                  title="Use GPS"
                >
                  {locating ? <Spinner size="sm" /> : <MapPin className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label flex justify-between items-center">
                <span>2. Medical Issue</span>
                {fetchingReport && <Spinner size="sm" />}
              </label>
              <textarea
                placeholder="Describe the medical issue or wait for auto-fill from your latest report..."
                className="input-field min-h-[120px] text-xs leading-relaxed"
                value={medicalIssue}
                onChange={(e) => setMedicalIssue(e.target.value)}
              />
            </div>

            <button
              onClick={handleFindHospitals}
              disabled={loading || !locationStr || !medicalIssue}
              className="btn-primary w-full justify-center"
            >
              {loading ? <Spinner size="sm" /> : <Bot className="h-5 w-5" />}
              Find Hospitals
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="md:col-span-2">
          {!result && !loading && (
            <div className="h-full glass-card p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <Building2 className="h-16 w-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-medium text-slate-300 mb-2">Ready to Search</h3>
              <p className="text-slate-500 max-w-sm">
                Provide your location to find the best-equipped facilities for your specific medical needs.
              </p>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              <div className="h-12 loading-pulse"></div>
              <div className="h-32 loading-pulse"></div>
              <div className="h-32 loading-pulse"></div>
              <div className="h-32 loading-pulse"></div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-lg flex items-center gap-3 text-blue-300">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  <strong>Recommended Facility Types:</strong> {result.recommendedHospitalTypes.join(", ")}
                </p>
              </div>

              <div className="space-y-4">
                {result.hospitals.map((hospital, idx) => (
                  <div key={idx} className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{hospital.name}</h3>
                        <p className="text-sm text-slate-400">{hospital.type}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 whitespace-nowrap">
                        {hospital.distanceEstimate}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-slate-400">Why here:</strong> {hospital.suitabilityReason}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 px-3 py-2 rounded border border-blue-500/20 w-fit">
                        <Phone className="h-4 w-4" />
                        {hospital.contactInfo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
