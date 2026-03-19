"use client";

import { Flame, Thermometer, Snowflake } from "lucide-react";

type Temperature = "Hot" | "Warm" | "Cold";

interface TemperatureBadgeProps {
  temperature: Temperature;
  score?: number;
  size?: "sm" | "md";
}

const CONFIG = {
  Hot:  { icon: Flame,       bg: "bg-red-50 border-red-200",    text: "text-red-600",    label: "Hot"  },
  Warm: { icon: Thermometer, bg: "bg-amber-50 border-amber-200", text: "text-amber-600",  label: "Warm" },
  Cold: { icon: Snowflake,   bg: "bg-sky-50 border-sky-200",    text: "text-sky-600",    label: "Cold" },
};

export function TemperatureBadge({ temperature, score, size = "sm" }: TemperatureBadgeProps) {
  const cfg = CONFIG[temperature] || CONFIG.Cold;
  const Icon = cfg.icon;
  const isSmall = size === "sm";

  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-medium
      ${cfg.bg} ${cfg.text}
      ${isSmall ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"}
    `}>
      <Icon size={isSmall ? 9 : 11} />
      {cfg.label}
      {score !== undefined && (
        <span className="opacity-70 ml-0.5">{score.toFixed(1)}</span>
      )}
    </span>
  );
}

// Aging alert badge
export function AgingBadge({ days }: { days: number }) {
  if (days < 5) return null;

  const isUrgent = days >= 10;
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-medium text-[10px] px-2 py-0.5
      ${isUrgent
        ? "bg-red-50 border-red-200 text-red-600"
        : "bg-orange-50 border-orange-200 text-orange-600"
      }
    `}>
      ⏱ {days}d idle
    </span>
  );
}

// Score bar — visual 0–10 indicator
export function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "bg-red-400" : score >= 4 ? "bg-amber-400" : "bg-sky-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 w-6 text-right">{score.toFixed(0)}</span>
    </div>
  );
}