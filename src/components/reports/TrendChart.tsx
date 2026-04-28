"use client";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from "recharts";
import type { HealthMetric } from "@/types";
import { formatTimestamp } from "@/lib/utils";

interface TrendChartProps {
  metrics: HealthMetric[];
  metricName: string;
}

export function TrendChart({ metrics, metricName }: TrendChartProps) {
  const chartData = useMemo(() => {
    return metrics
      .map((m) => ({
        dateRaw: m.date,
        date: formatTimestamp(m.date, "dd MMM"),
        value: m.metricValue,
        unit: m.unit,
        status: m.status,
        normalRange: m.normalRange,
      }))
      .sort((a, b) => {
        // Sort chronologically
        const aTime = a.dateRaw?.seconds || 0;
        const bTime = b.dateRaw?.seconds || 0;
        return aTime - bTime;
      });
  }, [metrics]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-white/10 rounded-xl bg-white/5 border-dashed">
        <p className="text-slate-400 text-sm">No data available for this metric yet.</p>
      </div>
    );
  }

  // Parse normal range if possible (e.g. "12.0 - 15.0" -> [12.0, 15.0])
  let yMin = "auto";
  let yMax = "auto";
  let hasRange = false;
  let rangeStart = 0;
  let rangeEnd = 0;

  const sampleRange = chartData[0]?.normalRange;
  if (sampleRange && sampleRange.includes("-")) {
    const parts = sampleRange.split("-").map((p) => parseFloat(p.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      hasRange = true;
      rangeStart = parts[0];
      rangeEnd = parts[1];
    }
  }

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10} 
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#131d35", borderColor: "#1e2d4a", borderRadius: "8px" }}
            itemStyle={{ color: "#3b82f6" }}
            labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
            cursor={{ stroke: "#1e2d4a", strokeWidth: 1, strokeDasharray: "3 3", fill: "transparent" }}
            formatter={(value: number, name: string, props: any) => [
              `${value} ${props.payload.unit}`,
              metricName,
            ]}
          />
          
          {hasRange && (
            <ReferenceArea 
              y1={rangeStart} 
              y2={rangeEnd} 
              fill="#10b981" 
              fillOpacity={0.1} 
            />
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#0a0f1e", stroke: "#3b82f6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {hasRange && (
        <div className="flex items-center justify-end gap-2 mt-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
          <span className="text-xs text-slate-400">Normal Range: {sampleRange}</span>
        </div>
      )}
    </div>
  );
}
