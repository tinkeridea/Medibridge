import { Navbar } from "@/components/layout/Navbar";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e]">
      <Navbar />
      <main className="flex-1">{children}</main>
      
      <footer className="border-t border-white/10 bg-[#0a0f1e] py-8 text-center">
        <p className="text-slate-500 text-sm">
          Built for Google Solution Challenge 2026 – Build with AI
        </p>
      </footer>
    </div>
  );
}
