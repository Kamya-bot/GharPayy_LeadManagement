"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Zone {
  id: string;
  name: string;
}

interface ZoneTransferDialogProps {
  leadId: string;
  leadName: string;
  currentZone?: string;
  zones: Zone[];
  onTransferred: (updatedLead: any) => void;
  onClose: () => void;
}

export function ZoneTransferDialog({
  leadId,
  leadName,
  currentZone,
  zones,
  onTransferred,
  onClose,
}: ZoneTransferDialogProps) {
  const [toZone, setToZone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const availableZones = zones.filter((z) => z.name !== currentZone);

  async function handleTransfer() {
    if (!toZone) { toast.error("Please select a zone"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/transfer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toZone, reason, performedBy: "Admin" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transfer failed");
      }
      const data = await res.json();
      toast.success(`Lead transferred to ${toZone}`);
      onTransferred(data.lead);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <h3 className="font-semibold text-slate-900 text-lg mb-1">Transfer Zone</h3>
        <p className="text-sm text-slate-500 mb-5">
          Moving <span className="font-medium text-slate-700">{leadName}</span> from{" "}
          <span className="font-medium text-indigo-600">{currentZone || "Unassigned"}</span>
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Transfer to Zone</label>
            <select
              value={toZone}
              onChange={(e) => setToZone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select zone...</option>
              {availableZones.map((z) => (
                <option key={z.id} value={z.name}>{z.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why is this lead being transferred?"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={loading || !toZone}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Transferring..." : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}