"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStage =
  | "New"
  | "Contacted"
  | "Visit Scheduled"
  | "Visited"
  | "Negotiation"
  | "Booked"
  | "Lost";

type LeadSource =
  | "Website" | "WhatsApp" | "Referral" | "Walk-in"
  | "Housing.com" | "99acres" | "MagicBricks"
  | "Facebook" | "Instagram" | "Cold Call" | "Other";

type ActivityType =
  | "stage_change" | "note" | "call" | "visit_scheduled"
  | "visit_done" | "document" | "whatsapp" | "email";

interface Activity {
  _id: string;
  type: ActivityType;
  note: string;
  fromStage?: string;
  toStage?: string;
  performedBy: string;
  createdAt: string;
}

interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  source: LeadSource;
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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: LeadStage[] = [
  "New", "Contacted", "Visit Scheduled", "Visited",
  "Negotiation", "Booked", "Lost",
];

const STAGE_CONFIG: Record<LeadStage, { color: string; bg: string; dot: string }> = {
  New:              { color: "text-sky-700",    bg: "bg-sky-50 border-sky-200",    dot: "bg-sky-400" },
  Contacted:        { color: "text-violet-700", bg: "bg-violet-50 border-violet-200", dot: "bg-violet-400" },
  "Visit Scheduled":{ color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  dot: "bg-amber-400" },
  Visited:          { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-400" },
  Negotiation:      { color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-400" },
  Booked:           { color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  Lost:             { color: "text-rose-700",   bg: "bg-rose-50 border-rose-200",    dot: "bg-rose-400" },
};

const SOURCES: LeadSource[] = [
  "Website","WhatsApp","Referral","Walk-in",
  "Housing.com","99acres","MagicBricks","Facebook","Instagram","Cold Call","Other",
];

const PROPERTY_TYPES = ["1BHK","2BHK","3BHK","4BHK+","Studio","Villa","Plot","Commercial"];

const BUDGETS = [
  "Under ₹5L","₹5L–₹10L","₹10L–₹20L","₹20L–₹30L","₹30L–₹50L","Above ₹50L",
];

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  stage_change: "⇄",
  note: "✎",
  call: "☎",
  visit_scheduled: "📅",
  visit_done: "🏠",
  document: "📄",
  whatsapp: "💬",
  email: "✉",
};

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  whatsapp: "",
  source: "" as LeadSource | "",
  assignedTo: "",
  zone: "",
  priority: "Medium" as "Low" | "Medium" | "High",
  propertyType: "",
  budget: "",
  preferredLocality: "",
  possession: "",
  tags: "",
  notes: "",
  initialNote: "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    High: "text-rose-600 bg-rose-50",
    Medium: "text-amber-600 bg-amber-50",
    Low: "text-slate-500 bg-slate-100",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${map[priority] || map.Low}`}>
      {priority}
    </span>
  );
}

function ActivityItem({ act }: { act: Activity }) {
  const icon = ACTIVITY_ICONS[act.type] || "•";
  const date = new Date(act.createdAt);
  const timeStr = date.toLocaleString("en-IN", {
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
          <p className="text-xs text-slate-400 mt-0.5">
            {act.fromStage} → {act.toStage}
          </p>
        )}
        <p className="text-xs text-slate-400 mt-1">
          {act.performedBy} · {timeStr}
        </p>
      </div>
    </div>
  );
}

// ─── Add Activity Modal ───────────────────────────────────────────────────────

function AddActivityModal({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead;
  onClose: () => void;
  onSaved: (updated: Lead) => void;
}) {
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
            {(["note","call","whatsapp","email","visit_scheduled","visit_done","document","stage_change"] as ActivityType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-all ${
                  type === t
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
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
            {loading ? "Saving…" : "Save Activity"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

function LeadDetailPanel({
  lead,
  onClose,
  onUpdate,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (updated: Lead) => void;
}) {
  const [showActivityModal, setShowActivityModal] = useState(false);

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
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-slate-900 text-lg leading-tight">{lead.name}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{lead.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <StagePill stage={lead.stage} />
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      </div>

      {/* Stage pipeline */}
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Move Stage</p>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map(s => (
            <button
              key={s}
              onClick={() => changeStage(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                lead.stage === s
                  ? `${STAGE_CONFIG[s].bg} ${STAGE_CONFIG[s].color} border-current`
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-2 gap-3 text-sm">
        {[
          ["Source", lead.source],
          ["Priority", <PriorityBadge key="p" priority={lead.priority} />],
          ["Assigned To", lead.assignedTo],
          ["Zone", lead.zone || "—"],
          ["Property", lead.propertyType || "—"],
          ["Budget", lead.budget || "—"],
          ["Locality", lead.preferredLocality || "—"],
          ["Possession", lead.possession || "—"],
        ].map(([label, value]) => (
          <div key={label as string}>
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
    </motion.div>
  );
}

// ─── Add Lead Form ────────────────────────────────────────────────────────────

function AddLeadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.source || !form.assignedTo) {
      setError("Name, phone, source and assigned agent are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        createdBy: "Admin",
      };
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create lead");
      const data = await res.json();
      onCreated(data.lead);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 bg-white";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Add New Lead</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {step} of 2 — {step === 1 ? "Contact & Assignment" : "Property Preference"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-7 pt-4 flex-shrink-0">
          <div className="flex gap-2">
            {[1, 2].map(n => (
              <button
                key={n}
                onClick={() => setStep(n as 1 | 2)}
                className={`flex-1 h-1.5 rounded-full transition-all ${step >= n ? "bg-indigo-500" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-7 py-5">

          {step === 1 && (
            <div className="space-y-4">
              {/* Row: Name + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => set("phone", e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              {/* Row: Email + WhatsApp */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    placeholder="rahul@email.com"
                    value={form.email}
                    onChange={e => set("email", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp Number</label>
                  <input
                    type="tel"
                    placeholder="Same as phone?"
                    value={form.whatsapp}
                    onChange={e => set("whatsapp", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Row: Source + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Lead Source *</label>
                  <select
                    value={form.source}
                    onChange={e => set("source", e.target.value)}
                    className={inputCls}
                    required
                  >
                    <option value="">Select source…</option>
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <div className="flex gap-2">
                    {(["Low", "Medium", "High"] as const).map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => set("priority", p)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          form.priority === p
                            ? p === "High"
                              ? "bg-rose-50 border-rose-400 text-rose-700"
                              : p === "Medium"
                              ? "bg-amber-50 border-amber-400 text-amber-700"
                              : "bg-slate-100 border-slate-400 text-slate-700"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row: Assigned To + Zone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Assigned To *</label>
                  <input
                    type="text"
                    placeholder="Agent name or ID"
                    value={form.assignedTo}
                    onChange={e => set("assignedTo", e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. North Bhopal"
                    value={form.zone}
                    onChange={e => set("zone", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className={labelCls}>Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                <input
                  type="text"
                  placeholder="investor, urgent, resale"
                  value={form.tags}
                  onChange={e => set("tags", e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Initial note */}
              <div>
                <label className={labelCls}>Initial Note</label>
                <textarea
                  placeholder="How did this lead come in? Any context..."
                  value={form.initialNote}
                  onChange={e => set("initialNote", e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Property Type */}
              <div>
                <label className={labelCls}>Property Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button
                      type="button"
                      key={pt}
                      onClick={() => set("propertyType", form.propertyType === pt ? "" : pt)}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        form.propertyType === pt
                          ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className={labelCls}>Budget Range</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUDGETS.map(b => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => set("budget", form.budget === b ? "" : b)}
                      className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                        form.budget === b
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locality + Possession */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Preferred Locality</label>
                  <input
                    type="text"
                    placeholder="e.g. Arera Colony"
                    value={form.preferredLocality}
                    onChange={e => set("preferredLocality", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Possession</label>
                  <select
                    value={form.possession}
                    onChange={e => set("possession", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Any</option>
                    <option>Ready to Move</option>
                    <option>Under Construction</option>
                    <option>Any</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>Additional Notes</label>
                <textarea
                  placeholder="Specific requirements, preferences, concerns..."
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-rose-600 bg-rose-50 px-4 py-2.5 rounded-xl">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-slate-100 flex items-center gap-3 flex-shrink-0">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-2.5 px-5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ← Back
            </button>
          )}
          <button onClick={onClose} className="py-2.5 px-5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 ml-auto">
            Cancel
          </button>
          {step === 1 ? (
            <button
              type="button"
              onClick={() => {
                if (!form.name || !form.phone || !form.source || !form.assignedTo) {
                  setError("Name, phone, source and assigned agent are required.");
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Lead ✓"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

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
      className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
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
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">{lead.source}</span>
        {lead.zone && <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">{lead.zone}</span>}
        {lead.propertyType && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{lead.propertyType}</span>}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <p className="text-xs text-slate-400">{lead.assignedTo}</p>
        <p className="text-xs text-slate-400">{timeAgo(lead.createdAt)}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "All">("All");
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (search) params.set("search", search);
      if (stageFilter !== "All") params.set("stage", stageFilter);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function onLeadCreated(lead: Lead) {
    setLeads(prev => [lead, ...prev]);
    setShowAddModal(false);
    setSelectedLead(lead);
  }

  function onLeadUpdated(updated: Lead) {
    setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
    setSelectedLead(updated);
  }

  const stageGroups = STAGES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.stage === s);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Leads</h1>
          <p className="text-xs text-slate-400 mt-0.5">{leads.length} total leads</p>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
          <input
            type="text"
            placeholder="Search name, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>

        {/* View toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(["pipeline", "list"] as const).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                viewMode === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {v === "pipeline" ? "⊞ Pipeline" : "☰ List"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <span className="text-lg leading-none">+</span> Add Lead
        </button>
      </div>

      {/* Stage filter tabs */}
      <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setStageFilter("All")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            stageFilter === "All" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          All ({leads.length})
        </button>
        {STAGES.map(s => (
          <button
            key={s}
            onClick={() => setStageFilter(stageFilter === s ? "All" : s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              stageFilter === s
                ? `${STAGE_CONFIG[s].bg} ${STAGE_CONFIG[s].color} border ${STAGE_CONFIG[s].bg}`
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {s} ({stageGroups[s]?.length || 0})
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
          // Pipeline Kanban
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const stageleads = stageFilter === "All" || stageFilter === stage
                ? stageGroups[stage]
                : [];
              const cfg = STAGE_CONFIG[stage];
              return (
                <div key={stage} className="flex-shrink-0 w-72">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 border ${cfg.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-semibold ${cfg.color}`}>{stage}</span>
                    <span className={`ml-auto text-xs font-bold ${cfg.color} opacity-70`}>
                      {stageleads.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {stageleads.map(lead => (
                        <LeadCard
                          key={lead._id}
                          lead={lead}
                          onClick={() => setSelectedLead(lead)}
                        />
                      ))}
                    </AnimatePresence>
                    {stageleads.length === 0 && (
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
          // List View
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Name","Phone","Source","Stage","Priority","Assigned To","Zone","Added"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr
                    key={lead._id}
                    onClick={() => setSelectedLead(lead)}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{lead.name}</td>
                    <td className="px-4 py-3 text-slate-500">{lead.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{lead.source}</td>
                    <td className="px-4 py-3"><StagePill stage={lead.stage} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={lead.priority} /></td>
                    <td className="px-4 py-3 text-slate-500">{lead.assignedTo}</td>
                    <td className="px-4 py-3 text-slate-500">{lead.zone || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && (
              <div className="py-16 text-center text-slate-400">No leads found.</div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddLeadModal onClose={() => setShowAddModal(false)} onCreated={onLeadCreated} />
        )}
        {selectedLead && (
          <LeadDetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={onLeadUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
