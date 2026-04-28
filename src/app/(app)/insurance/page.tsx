"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPolicies, getLatestClaimEstimate } from "@/lib/firestoreHelpers";
import { db } from "@/lib/firebase/clientApp";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { nanoid } from "nanoid";
import type { InsurancePolicy, ClaimEstimate } from "@/types";
import { formatINR, formatTimestamp, confidenceColor, coverageStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";
import { ShieldAlert, FileText, CheckCircle2, AlertTriangle, XCircle, Info, Calculator } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function InsurancePage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [latestEstimate, setLatestEstimate] = useState<ClaimEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  // Policy Form State
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    insurerName: "",
    policyNumber: "",
    sumInsured: "",
    planName: "",
    validFrom: "",
    validTo: "",
    policyText: "",
  });

  // Claim Form State
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [billText, setBillText] = useState("");
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [pols, est] = await Promise.all([
          getPolicies(user.uid),
          getLatestClaimEstimate(user.uid),
        ]);
        setPolicies(pols);
        setLatestEstimate(est);
        if (pols.length > 0) setSelectedPolicyId(pols[0].id);
      } catch (error) {
        console.error("Error loading insurance data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingPolicy(true);
    try {
      const id = nanoid();
      const newPolicy: InsurancePolicy = {
        id,
        userId: user.uid,
        insurerName: policyForm.insurerName,
        policyNumber: policyForm.policyNumber,
        sumInsured: Number(policyForm.sumInsured),
        planName: policyForm.planName,
        validFrom: policyForm.validFrom,
        validTo: policyForm.validTo,
        policyText: policyForm.policyText,
        createdAt: Timestamp.now(),
      };
      await setDoc(doc(db, "insurance_policies", id), newPolicy);
      setPolicies([newPolicy, ...policies]);
      setSelectedPolicyId(id);
      setIsAddingPolicy(false);
      toast.success("Policy saved successfully!");
    } catch (error) {
      toast.error("Failed to save policy");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleEstimateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedPolicyId || !billText.trim()) {
      toast.error("Please select a policy and paste the bill text.");
      return;
    }

    const selectedPolicy = policies.find(p => p.id === selectedPolicyId);
    if (!selectedPolicy) return;

    setEstimating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/estimate-claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          policyId: selectedPolicyId,
          policyText: selectedPolicy.policyText,
          billText,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Estimation failed");
      }

      const data = await res.json();
      setLatestEstimate(data);
      toast.success("Estimate generated!");
      setBillText("");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate estimate");
    } finally {
      setEstimating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="page-heading flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-blue-400" />
          Insurance Claims
        </h1>
        <p className="text-slate-400 mt-2">
          Manage your health policies and estimate claim coverage using AI.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Policies & Form */}
        <div className="space-y-6">
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
              <h2 className="section-heading">My Policies</h2>
              {!isAddingPolicy && (
                <button onClick={() => setIsAddingPolicy(true)} className="text-sm text-blue-400 hover:text-blue-300">
                  + Add Policy
                </button>
              )}
            </div>

            {isAddingPolicy ? (
              <form onSubmit={handleSavePolicy} className="space-y-4 animate-fade-in">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="label">Insurer Name</label><input required className="input-field" value={policyForm.insurerName} onChange={e=>setPolicyForm({...policyForm, insurerName: e.target.value})} /></div>
                  <div><label className="label">Plan Name</label><input required className="input-field" value={policyForm.planName} onChange={e=>setPolicyForm({...policyForm, planName: e.target.value})} /></div>
                  <div><label className="label">Policy Number</label><input required className="input-field" value={policyForm.policyNumber} onChange={e=>setPolicyForm({...policyForm, policyNumber: e.target.value})} /></div>
                  <div><label className="label">Sum Insured (₹)</label><input required type="number" className="input-field" value={policyForm.sumInsured} onChange={e=>setPolicyForm({...policyForm, sumInsured: e.target.value})} /></div>
                  <div><label className="label">Valid From</label><input required type="date" className="input-field text-slate-400" value={policyForm.validFrom} onChange={e=>setPolicyForm({...policyForm, validFrom: e.target.value})} /></div>
                  <div><label className="label">Valid To</label><input required type="date" className="input-field text-slate-400" value={policyForm.validTo} onChange={e=>setPolicyForm({...policyForm, validTo: e.target.value})} /></div>
                </div>
                <div>
                  <label className="label flex justify-between">
                    <span>Policy Wording (Text)</span>
                    <span className="text-xs text-slate-500">Paste coverage sections here</span>
                  </label>
                  <textarea required rows={6} className="input-field text-xs font-mono" value={policyForm.policyText} onChange={e=>setPolicyForm({...policyForm, policyText: e.target.value})} placeholder="Paste the key terms, inclusions, and exclusions of your policy document..." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsAddingPolicy(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={savingPolicy} className="btn-primary">{savingPolicy ? <Spinner size="sm" /> : "Save Policy"}</button>
                </div>
              </form>
            ) : policies.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No policies added yet.</p>
            ) : (
              <div className="space-y-3">
                {policies.map(p => (
                  <div key={p.id} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-200">{p.planName}</h3>
                        <p className="text-sm text-slate-400">{p.insurerName} • {p.policyNumber}</p>
                      </div>
                      <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-semibold">
                        {formatINR(p.sumInsured)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Valid: {p.validFrom} to {p.validTo}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* New Claim Estimate Form */}
          <section className="glass-card p-6">
            <h2 className="section-heading mb-4 border-b border-white/10 pb-2">Estimate New Claim</h2>
            <form onSubmit={handleEstimateClaim} className="space-y-4">
              <div>
                <label className="label">Select Policy to apply</label>
                <select required className="input-field" value={selectedPolicyId} onChange={e=>setSelectedPolicyId(e.target.value)} disabled={policies.length === 0}>
                  {policies.length === 0 ? <option value="">No policies available</option> : policies.map(p => <option key={p.id} value={p.id}>{p.planName} ({p.insurerName})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Hospital Bill Details</label>
                <textarea required rows={8} className="input-field text-xs font-mono" value={billText} onChange={e=>setBillText(e.target.value)} placeholder="Room Rent: 15000&#10;Consultation: 3000&#10;Medicines: 8500&#10;Consumables (Gloves, Syringes): 2500..." />
              </div>
              <button type="submit" disabled={estimating || policies.length === 0} className="btn-primary w-full justify-center">
                {estimating ? <span className="flex items-center gap-2"><Spinner size="sm" /> Estimating...</span> : <span className="flex items-center gap-2"><Calculator className="h-4 w-4"/> AI Claim Estimate</span>}
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Estimate Results */}
        <div>
          {latestEstimate ? (
            <div className="glass-card overflow-hidden sticky top-24">
              <div className="p-6 border-b border-white/10 bg-gradient-to-br from-blue-900/20 to-transparent">
                <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <Calculator className="h-5 w-5" />
                  <h2 className="font-bold uppercase tracking-wider text-sm">AI Estimate Result</h2>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-400 mb-1">Estimated Claimable Amount</p>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-extrabold text-white">{formatINR(latestEstimate.estimatedCoverageAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Explanation</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{latestEstimate.plainExplanation}</p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Policy Rules Applied</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{latestEstimate.aiCoverageSummary}</p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Itemized Breakdown</h3>
                  <div className="space-y-3">
                    {latestEstimate.coverageBreakdown.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-slate-200">{item.item}</span>
                          <span className="font-mono text-slate-300">{formatINR(item.amount)}</span>
                        </div>
                        <div className="flex items-start gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${coverageStatusColor(item.status)} bg-white/5`}>
                            {item.status}
                          </span>
                          <p className="text-xs text-slate-400 leading-tight">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-yellow-400/90 text-xs leading-relaxed">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{latestEstimate.disclaimer}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card h-full flex flex-col items-center justify-center p-12 text-center border-dashed border-white/20">
              <ShieldAlert className="h-16 w-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Estimates Yet</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Select a policy, paste a hospital bill, and click estimate to see what might be covered by your insurance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
