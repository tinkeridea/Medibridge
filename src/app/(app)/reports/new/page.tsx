"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { FileText, Bot, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { storage } from "@/lib/firebase/clientApp";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { nanoid } from "nanoid";

export default function NewReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [reportType, setReportType] = useState("");
  const [reportText, setReportText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Result is like: data:image/jpeg;base64,/9j/4AAQ...
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!reportType || (!reportText.trim() && !file)) {
      toast.error("Please provide either report text or upload a document.");
      return;
    }

    if (file && file.size > 3.5 * 1024 * 1024) {
      toast.error("File is too large. Please upload a file smaller than 3.5MB.");
      return;
    }

    setAnalyzing(true);
    try {
      let fileData;
      let fileMimeType;
      let fileUrl;
      let fileName;
      
      if (file) {
        // Convert to base64 for Gemini
        fileData = await readFileAsBase64(file);
        fileMimeType = file.type;
        fileName = file.name;

        // Upload to Firebase Storage
        const fileRef = ref(storage, `reports/${user.uid}/${nanoid()}-${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(snapshot.ref);
      }

      const token = await user.getIdToken();
      const res = await fetch("/api/analyze-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          reportType, 
          reportText, 
          fileData, 
          fileMimeType,
          fileUrl,
          fileName
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await res.json();
      toast.success("Analysis complete!");
      router.push(`/reports/${data.reportId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze report");
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="page-heading flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-400" />
          Analyze Lab Report
        </h1>
        <p className="text-slate-400 mt-2">
          Paste the raw text of your medical report and let our AI summarize it for you.
        </p>
      </header>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-yellow-400/90 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p>
          <strong>Privacy Note:</strong> Please remove sensitive personal identifiers (like your full name, phone number, or ID numbers) from the text before pasting. This tool is for educational purposes and is not a substitute for professional medical advice.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="glass-card p-6 space-y-6">
        <div>
          <label className="label">Report Type</label>
          <select 
            required 
            className="input-field" 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="">Select a report type...</option>
            <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
            <option value="Lipid Profile">Lipid Profile</option>
            <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
            <option value="Thyroid Profile">Thyroid Profile</option>
            <option value="Kidney Function Test">Kidney Function Test</option>
            <option value="Blood Sugar Fasting/PP">Blood Sugar (Fasting/PP)</option>
            <option value="Urine Routine">Urine Routine</option>
            <option value="Other Lab Report">Other Lab Report</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="label flex items-center justify-between">
              <span>Raw Report Text</span>
              <span className="text-xs font-normal text-slate-500">Optional if file uploaded</span>
            </label>
            <textarea
              required={!file}
              rows={12}
              className="input-field font-mono text-xs"
              placeholder="PATIENT NAME: [REDACTED]&#10;DATE: 12/04/2026&#10;&#10;TEST NAME              RESULT    UNIT    REF. RANGE&#10;Hemoglobin             11.2      g/dL    12.0 - 15.0&#10;Total Leucocyte Count  8500      /cumm   4000 - 11000&#10;..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Upload Document (Optional)</span>
              <span className="text-xs font-normal text-slate-500">PDF, JPG, PNG (Max 3.5MB)</span>
            </label>
            <div className="h-[210px] w-full border-2 border-dashed border-white/20 bg-white/5 rounded-lg flex flex-col items-center justify-center p-4 text-center hover:bg-white/10 hover:border-blue-500/50 transition-colors relative">
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    type="button" 
                    onClick={() => setFile(null)}
                    className="mt-4 text-xs text-red-400 hover:text-red-300"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <>
                  <FileText className="h-8 w-8 text-slate-500 mb-3" />
                  <p className="text-sm text-slate-300 mb-1">Click or drag file to upload</p>
                  <p className="text-xs text-slate-500">Supports PDF, JPEG, PNG, WEBP</p>
                </>
              )}
              <input 
                type="file" 
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={analyzing}
            className="btn-primary w-full sm:w-auto px-8"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Analyzing with Gemini...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Analyze with AI
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
