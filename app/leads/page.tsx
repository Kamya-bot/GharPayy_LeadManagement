"use client";

import AddLeadDialog from "@/components/AddLeadDialog";
import { TemperatureBadge, AgingBadge, ScoreBar } from "@/components/TemperatureBadge";
import { ZoneTransferDialog } from "@/components/ZoneTransferDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LeadStage =
  | "New" | "Contacted" | "Visit Scheduled" | "Visited"
  | "Negotiation" | "Booked" | "Lost";

type LeadTemperature = "Hot" | "Warm" | "Cold";

type ActivityType =
  | "stage_change" | "note" | "call" | "visit_scheduled"
  | "visit_done" | "document" | "whatsapp" | "email" | "zone_transfer";

interface Activity {
  _id: string;
  type: ActivityType;
  note: string;
  fromStage?: string;
  toStage?: string;
  fromZone?: string;
  toZone?: string;
  performedBy: string;
  createdAt: string;
}

interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  source: string;
  stage: LeadStage;
  assignedTo: string;
  zone?: string;
  priority: "Low" | "Medium" | "High";
  tags: string[];
  propertyType?: string;
  budget?: string;
  preferredLocality?: string;
  possession?: string;
  notes?: string;
  activities: Activity[];
  createdAt: string;
  nextFollowUpAt?: string;
  // Intelligence fields
  leadScore?: number;
  temperature?: LeadTemperature;
  agingDays?: number;
  isAging?: boolean;
}

interface Zone {
  id: string;
  name: string;
}

const STAGES: LeadStage[] = [
  "New", "Contacted", "Visit Scheduled", "Visited",
  "Negotiation", "Booked", "Lost",
];

const STAGE_CONFIG: Record<LeadStage, { color: string; bg: string; dot: string }> = {
  New:               { color: "text-sky-700",     bg: "bg-sky-50 border-sky-200",         dot: "bg-sky-400" },
  Contacted:         { color: "text-violet-700",  bg: "bg-violet-50 border-violet-200",   dot: "bg-violet-400" },
  "Visit Scheduled": { color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     dot: "bg-amber-400" },
  Visited:           { color: "text-orange-700",  bg: "bg-orange-50 border-orange-200",   dot: "bg-orange-400" },
  Negotiation:       { color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200",   dot: "bg-indigo-400" },
  Booked:            { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  Lost:              { color: "text-rose-700",    bg: "bg-rose-50 border-rose-200",       dot: "bg-rose-400" },
};

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  stage_change:    "⇄",
  note:            "✎",
  call:            "☎",
  visit_scheduled: "📅",
  visit_done:      "🏠",
  document:        "📄",
  whatsapp:        "💬",
  email:           "✉",
  zone_transfer:   "🔀",
};

function StagePill({ stage }: { stage: LeadStage }) {
  const cfg = STAGE_CONFIG[stage];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {stage}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    High:   "text-rose-600 bg-rose-50",
    Medium: "text-amber-600 bg-amber-50",
    Low:    "text-slate-500 bg-slate-100",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${map[priority] || map.Low}`}>
      {priority}
    </span>
  );
}

function ActivityItem({ act }: { act: Activity }) {
  const icon = ACTIVITY_ICONS[act.type] || "•";
  const timeStr = new Date(act.createdAt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
  return (
    <div className="flex gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-base flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-snug">{act.note}</p>
        {act.fromStage && act.toStage && (
          <p className="text-xs text-slate-400 mt-0.5">{act.fromStage} → {act.toStage}</p>
        )}
        {act.fromZone && act.toZone && (
          <p className="text-xs text-indigo-400 mt-0.5">Zone: {act.fromZone} → {act.toZone}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">{act.performedBy} · {timeStr}</p>
      </div>
    </div>
  );
}

function AddActivityModal({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: (updated: Lead) => void }) {
  const [type, setType] = useState<ActivityType>("note");
  const [note, setNote] = useState("");
  const [newStage, setNewStage] = useState<LeadStage>(lead.stage);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!note.trim()) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { performedBy: "Admin" };
      if (type === "stage_change" && newStage !== lead.stage) {
        payload.stage = newStage;
        payload.note = note;
      } else {
        payload.addActivity = { type, note, performedBy: "Admin" };
      }
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      onSaved(data.lead);
    } finally {
      setLoading(false);
    }
  }

  const activityTypes: ActivityType[] = [
    "note", "call", "whatsapp", "email",
    "visit_scheduled", "visit_done", "document", "stage_change",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
      >
        <h3 className="font-semibold text-slate-900 mb-4 text-lg">Log Activity</h3>
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Activity Type</label>
          <div className="grid grid-cols-4 gap-2">
            {activityTypes.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-all
                  ${type === t ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                <span className="text-base">{ACTIVITY_ICONS[t]}</span>
                <span className="capitalize text-[10px]">{t.replace("_", " ")}</span>
              </button>
            ))}
          </div>
        </div>
        {type === "stage_change" && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Move to Stage</label>
            <select
              value={newStage}
              onChange={e => setNewStage(e.target.value as LeadStage)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Note / Remark</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="What happened? Any context..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || !note.trim()}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Activity"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LeadDetailPanel({
  lead, zones, onClose, onUpdate,
}: {
  lead: Lead;
  zones: Zone[];
  onClose: () => void;
  onUpdate: (updated: Lead) => void;
}) {
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  async function changeStage(stage: LeadStage) {
    if (stage === lead.stage) return;
    const res = await fetch(`/api/leads/${lead._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, performedBy: "Admin" }),
    });
    const data = await res.json();
    onUpdate(data.lead);
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-slate-900 text-lg leading-tight">{lead.name}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{lead.phone}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StagePill stage={lead.stage} />
            {lead.temperature && (
              <TemperatureBadge temperature={lead.temperature} score={lead.leadScore} />
            )}
            {lead.isAging && lead.agingDays !== undefined && (
              <AgingBadge days={lead.agingDays} />
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
        >✕</button>
      </div>

      {/* Score bar */}
      {lead.leadScore !== undefined && (
        <div className="px-6 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-1.5">Lead Score</p>
          <ScoreBar score={lead.leadScore} />
        </div>
      )}

      {/* Stage change */}
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Move Stage</p>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map(s => (
            <button
              key={s}
              onClick={() => changeStage(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                ${lead.stage === s
                  ? `${STAGE_CONFIG[s].bg} ${STAGE_CONFIG[s].color} border-current`
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-2 gap-3 text-sm">
        {(
          [
            ["Source", lead.source],
            ["Priority", <PriorityBadge key="p" priority={lead.priority} />],
            ["Assigned To", lead.assignedTo],
            ["Zone", (
              <span key="z" className="flex items-center gap-1.5">
                {lead.zone || "—"}
                {zones.length > 0 && (
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 underline"
                  >Transfer</button>
                )}
              </span>
            )],
            ["Property", lead.propertyType || "—"],
            ["Budget", lead.budget || "—"],
            ["Locality", lead.preferredLocality || "—"],
            ["Possession", lead.possession || "—"],
          ] as [string, React.ReactNode][]
        ).map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="font-medium text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
        {lead.email && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400">Email</p>
            <p className="font-medium text-slate-800 mt-0.5">{lead.email}</p>
          </div>
        )}
        {lead.notes && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400">Notes</p>
            <p className="text-slate-700 mt-0.5 text-sm leading-relaxed">{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Activity log */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Activity Log ({lead.activities.length})
          </p>
          <button
            onClick={() => setShowActivityModal(true)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg"
          >
            + Log Activity
          </button>
        </div>
        {lead.activities.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No activity yet.</p>
        ) : (
          [...lead.activities].reverse().map(act => (
            <ActivityItem key={act._id || act.createdAt} act={act} />
          ))
        )}
      </div>

      {showActivityModal && (
        <AddActivityModal
          lead={lead}
          onClose={() => setShowActivityModal(false)}
          onSaved={updated => { onUpdate(updated); setShowActivityModal(false); }}
        />
      )}

      {showTransferModal && (
        <ZoneTransferDialog
          leadId={lead._id}
          leadName={lead.name}
          currentZone={lead.zone}
          zones={zones}
          onTransferred={onUpdate}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </motion.div>
  );
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`bg-white rounded-2xl border p-4 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group
        ${lead.isAging ? "border-orange-200" : "border-slate-100"}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
            {lead.name}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{lead.phone}</p>
        </div>
        <PriorityBadge priority={lead.priority} />
      </div>

      {/* Temperature + aging badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {lead.temperature && (
          <TemperatureBadge temperature={lead.temperature} score={lead.leadScore} />
        )}
        {lead.isAging && lead.agingDays !== undefined && (
          <AgingBadge days={lead.agingDays} />
        )}
      </div>

      {/* Score bar */}
      {lead.leadScore !== undefined && (
        <div className="mb-2">
          <ScoreBar score={lead.leadScore} />
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mt-1">
        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">{lead.source}</span>
        {lead.zone && (
          <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">{lead.zone}</span>
        )}
        {lead.propertyType && (
          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{lead.propertyType}</span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <p className="text-xs text-slate-400">{lead.assignedTo}</p>
        <p className="text-xs text-slate-400">{timeAgo(lead.createdAt)}</p>
      </div>
    </motion.div>
  );
}

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "All">("All");
  const [tempFilter, setTempFilter] = useState<"All" | "Hot" | "Warm" | "Cold">("All");
  const [agingFilter, setAgingFilter] = useState(false);
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (search)              params.set("search", search);
      if (stageFilter !== "All") params.set("stage", stageFilter);
      if (tempFilter !== "All")  params.set("temperature", tempFilter);
      if (agingFilter)           params.set("aging", "true");
      if (user?.zone && user?.role !== "admin") params.set("zone", user.zone);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, tempFilter, agingFilter, user]);

  // Fetch zones for transfer dialog
  useEffect(() => {
    fetch("/api/zones")
      .then(r => r.json())
      .then(data => setZones((data.zones || data || []).map((z: any) => ({ id: z._id || z.id, name: z.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function onLeadCreated(lead: Lead) { setLeads(prev => [lead, ...prev]); setSelectedLead(lead); }
  function onLeadUpdated(updated: Lead) {
    setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
    setSelectedLead(updated);
  }

  const filtered = leads;
  const stageGroups = STAGES.reduce((acc, s) => {
    acc[s] = filtered.filter(l => l.stage === s);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  const agingCount = leads.filter(l => l.isAging).length;
  const hotCount   = leads.filter(l => l.temperature === "Hot").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Leads</h1>
          <p className="text-xs text-slate-400 mt-0.5">{leads.length} leads</p>
        </div>
        <div className="relative w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
          <input
            type="text"
            placeholder="Search name, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(["pipeline", "list"] as const).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
                ${viewMode === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {v === "pipeline" ? "⋮ Pipeline" : "☰ List"}
            </button>
          ))}
        </div>
        <AddLeadDialog onCreated={onLeadCreated} />
      </div>

      {/* Zone banner */}
      {user?.zone && user?.role !== "admin" && (
        <div className="px-6 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
          <span className="text-xs font-medium text-indigo-700">📌 Viewing: {user.zone} zone leads</span>
          <span className="text-xs text-indigo-400">({user.identity} · {user.zone})</span>
        </div>
      )}

      {/* Aging alert banner */}
      {agingCount > 0 && (
        <div className="px-6 py-2 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
          <span className="text-xs font-medium text-orange-700">
            ⏱ {agingCount} lead{agingCount > 1 ? "s" : ""} have had no contact in 5+ days
          </span>
          <button
            onClick={() => setAgingFilter(v => !v)}
            className={`text-xs px-2.5 py-0.5 rounded-full border font-medium transition-all
              ${agingFilter ? "bg-orange-500 text-white border-orange-500" : "border-orange-300 text-orange-600 hover:bg-orange-100"}`}
          >
            {agingFilter ? "Show all" : "Show aging only"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
        {/* Stage filters */}
        <button
          onClick={() => setStageFilter("All")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
            ${stageFilter === "All" && tempFilter === "All" && !agingFilter
              ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
        >
          All ({leads.length})
        </button>
        {STAGES.map(s => (
          <button
            key={s}
            onClick={() => setStageFilter(stageFilter === s ? "All" : s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${stageFilter === s
                ? `${STAGE_CONFIG[s].bg} ${STAGE_CONFIG[s].color} border ${STAGE_CONFIG[s].bg}`
                : "text-slate-500 hover:bg-slate-100"}`}
          >
            {s} ({stageGroups[s]?.length || 0})
          </button>
        ))}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Temperature filters */}
        {(["Hot", "Warm", "Cold"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTempFilter(tempFilter === t ? "All" : t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border
              ${tempFilter === t
                ? t === "Hot" ? "bg-red-50 text-red-600 border-red-200"
                  : t === "Warm" ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-sky-50 text-sky-600 border-sky-200"
                : "text-slate-500 border-transparent hover:bg-slate-100"
              }`}
          >
            {t === "Hot" ? "🔥" : t === "Warm" ? "🌡" : "❄️"} {t}
            {" "}({leads.filter(l => l.temperature === t).length})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === "pipeline" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const stageLeads = stageFilter === "All" || stageFilter === stage ? stageGroups[stage] : [];
              const cfg = STAGE_CONFIG[stage];
              return (
                <div key={stage} className="flex-shrink-0 w-72">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 border ${cfg.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-semibold ${cfg.color}`}>{stage}</span>
                    <span className={`ml-auto text-xs font-bold ${cfg.color} opacity-70`}>{stageLeads.length}</span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {stageLeads.map(lead => (
                        <LeadCard key={lead._id} lead={lead} onClick={() => setSelectedLead(lead)} />
                      ))}
                    </AnimatePresence>
                    {stageLeads.length === 0 && (
                      <div className="h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <span className="text-xs text-slate-400">No leads</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Name", "Phone", "Source", "Stage", "Temp", "Score", "Aging", "Zone", "Priority", "Added"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr
                    key={lead._id}
                    onClick={() => setSelectedLead(lead)}
                    className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors
                      ${lead.isAging ? "bg-orange-50/30" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{lead.name}</td>
                    <td className="px-4 py-3 text-slate-500">{lead.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{lead.source}</td>
                    <td className="px-4 py-3"><StagePill stage={lead.stage} /></td>
                    <td className="px-4 py-3">
                      {lead.temperature && <TemperatureBadge temperature={lead.temperature} />}
                    </td>
                    <td className="px-4 py-3 w-24">
                      {lead.leadScore !== undefined && <ScoreBar score={lead.leadScore} />}
                    </td>
                    <td className="px-4 py-3">
                      {lead.isAging && lead.agingDays !== undefined && <AgingBadge days={lead.agingDays} />}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{lead.zone || "—"}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={lead.priority} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-slate-400">No leads found.</div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedLead && (
          <LeadDetailPanel
            lead={selectedLead}
            zones={zones}
            onClose={() => setSelectedLead(null)}
            onUpdate={onLeadUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}