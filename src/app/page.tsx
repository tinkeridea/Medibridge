"use client";
import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, QrCode } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-hero-glow -z-10" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
            Google Solution Challenge 2026
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            Understand Your Health <br />
            <span className="gradient-text">Powered by AI</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            MediBridge helps you decode complex medical lab reports, manage emergency info, and estimate insurance claims in plain language.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
            <Link href="/signup" className="btn-primary w-full sm:w-auto px-8 py-4 text-base">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className="btn-secondary w-full sm:w-auto px-8 py-4 text-base">
              Login to Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Report Analysis</h3>
              <p className="text-slate-400 text-sm">
                Paste your confusing lab reports and get instant, patient-friendly explanations and key findings.
              </p>
            </div>
            
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
              <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Emergency QR</h3>
              <p className="text-slate-400 text-sm">
                Generate a unique QR code linked to your critical medical info for first responders.
              </p>
            </div>
            
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
              <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Claim Estimator</h3>
              <p className="text-slate-400 text-sm">
                Understand what your health insurance policy actually covers when you paste a hospital bill.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-white/10 bg-[#0a0f1e] py-8 text-center mt-auto">
        <p className="text-slate-500 text-sm">
          Built for Google Solution Challenge 2026 – Build with AI
        </p>
      </footer>
    </div>
  );
}
