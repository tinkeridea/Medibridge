"use client";
import { QRCodeSVG } from "qrcode.react";
import { clientEnv } from "@/config/env";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

interface EmergencyQRProps {
  slug: string;
}

export function EmergencyQR({ slug }: EmergencyQRProps) {
  const publicUrl = `${clientEnv.appUrl}/e/${slug}`;

  const handleDownload = () => {
    try {
      const svg = document.getElementById("emergency-qr-code");
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
        }
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `MediBridge_Emergency_QR_${slug}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
      toast.success("QR Code downloaded!");
    } catch (err) {
      toast.error("Failed to download QR code");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border-4 border-blue-500/20 max-w-sm mx-auto">
      <div className="mb-4 text-center">
        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide">Emergency Med Card</h3>
        <p className="text-slate-500 text-sm">Scan for vital health info</p>
      </div>
      
      <div className="p-2 bg-white rounded-lg">
        <QRCodeSVG
          id="emergency-qr-code"
          value={publicUrl}
          size={200}
          level={"H"}
          includeMargin={true}
          fgColor="#0f1729"
          bgColor="#ffffff"
        />
      </div>

      <div className="mt-6 w-full flex flex-col gap-3">
        <a 
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
        >
          View Public Card Link
        </a>
        
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
        >
          <Download className="h-4 w-4" />
          Download as Image
        </button>
      </div>
    </div>
  );
}
