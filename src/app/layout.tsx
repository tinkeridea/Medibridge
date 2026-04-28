import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "MediBridge – AI-Powered Health Assistant",
  description:
    "Understand your medical lab reports, track health trends, share emergency info, and estimate insurance claims – powered by Google Gemini AI.",
  keywords: [
    "medical reports",
    "health AI",
    "insurance claim",
    "lab report analysis",
    "India health",
  ],
  openGraph: {
    title: "MediBridge – AI-Powered Health Assistant",
    description:
      "Understand your medical lab reports with AI. Made for India.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#131d35",
                color: "#f1f5f9",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#131d35" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#131d35" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
