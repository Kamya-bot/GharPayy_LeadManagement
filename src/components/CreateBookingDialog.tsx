"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface Visit {
  id: string;
  leadId?: string;
  leadName: string;
  leadPhone: string;
  propertyName: string;
}

interface Props {
  visit: Visit;
  open: boolean;
  onClose: () => void;
  onBooked?: () => void;
}

const inputCls = "h-9 text-sm border-slate-200 rounded-xl focus-visible:ring-indigo-500";
const labelCls = "text-xs font-medium text-slate-500 mb-1 block";

const BED_TYPES = ["Single", "Double", "Triple", "Private Room"];

export default function CreateBookingDialog({ visit, open, onClose, onBooked }: Props) {
  const [form, setForm] = useState({
    propertyName: visit.propertyName || "",
    roomNumber: "",
    bedNumber: "",
    bedType: "",
    monthlyRent: "",
    deposit: "",
    moveInDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit() {
    if (!form.monthlyRent) {
      toast.error("Monthly rent is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId:       visit.leadId || "000000000000000000000000",
          visitId:      visit.id,
          leadName:     visit.leadName,
          leadPhone:    visit.leadPhone,
          propertyName: form.propertyName,
          roomNumber:   form.roomNumber || undefined,
          bedNumber:    form.bedType || form.bedNumber || undefined,
          monthly_rent: Number(form.monthlyRent),
          deposit:      form.deposit ? Number(form.deposit) : undefined,
          move_in_date: form.moveInDate || undefined,
          notes:        form.notes || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create booking");

      toast.success(`Booking created for ${visit.leadName} 🎉`);
      onBooked?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CheckCircle size={18} className="text-emerald-500" />
            Confirm Booking
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Creating booking for <strong>{visit.leadName}</strong> at <strong>{visit.propertyName}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Property + Room */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelCls}>Property Name</Label>
              <Input
                className={inputCls}
                value={form.propertyName}
                onChange={e => set("propertyName", e.target.value)}
                placeholder="Green Valley PG"
              />
            </div>
            <div>
              <Label className={labelCls}>Room Number</Label>
              <Input
                className={inputCls}
                value={form.roomNumber}
                onChange={e => set("roomNumber", e.target.value)}
                placeholder="101"
              />
            </div>
          </div>

          {/* Bed Type */}
          <div>
            <Label className={labelCls}>Bed / Room Type</Label>
            <div className="flex gap-2 mt-1">
              {BED_TYPES.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set("bedType", form.bedType === b ? "" : b)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                    form.bedType === b
                      ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Rent + Deposit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelCls}>Monthly Rent (₹) *</Label>
              <Input
                className={inputCls}
                type="number"
                placeholder="12000"
                value={form.monthlyRent}
                onChange={e => set("monthlyRent", e.target.value)}
              />
            </div>
            <div>
              <Label className={labelCls}>Security Deposit (₹)</Label>
              <Input
                className={inputCls}
                type="number"
                placeholder="24000"
                value={form.deposit}
                onChange={e => set("deposit", e.target.value)}
              />
            </div>
          </div>

          {/* Move-in Date */}
          <div>
            <Label className={labelCls}>Move-in Date</Label>
            <Input
              className={inputCls}
              type="date"
              value={form.moveInDate}
              onChange={e => set("moveInDate", e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label className={labelCls}>Notes</Label>
            <Input
              className={inputCls}
              placeholder="Any special terms..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={submit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? "Creating..." : "✓ Confirm Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}