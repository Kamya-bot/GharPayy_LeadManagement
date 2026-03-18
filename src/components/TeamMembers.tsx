"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Users, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const IDENTITIES = ["Alpha", "Beta", "Gamma", "Fire", "Water"];

const IDENTITY_COLORS: Record<string, string> = {
  Alpha: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Beta:  "bg-amber-50 text-amber-700 border-amber-200",
  Gamma: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Fire:  "bg-rose-50 text-rose-700 border-rose-200",
  Water: "bg-sky-50 text-sky-700 border-sky-200",
};

const IDENTITY_DESC: Record<string, string> = {
  Alpha: "Lead closer",
  Beta:  "Lead distributor",
  Gamma: "Tour scheduler",
  Fire:  "Visit manager",
  Water: "Customer support",
};

interface Zone {
  id: string;
  name: string;
}

interface TeamMembersProps {
  zones: Zone[];
}

export default function TeamMembers({ zones }: TeamMembersProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>(zones[0]?.name || "");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    identity: "Alpha",
    zone: zones[0]?.name || "",
    zoneId: zones[0]?.id || "",
  });

  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const res = await fetch("/api/team-members");
      if (!res.ok) throw new Error("Failed to fetch team members");
      return res.json();
    },
  });

  const createMember = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create member");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      toast.success(`${form.identity} added to ${form.zone}`);
      setOpen(false);
      setForm({ fullName: "", email: "", password: "", identity: "Alpha", zone: zones[0]?.name || "", zoneId: zones[0]?.id || "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredMembers = selectedZone
    ? members.filter((m: any) => m.zone === selectedZone)
    : members;

  return (
    <div>
      {/* Zone filter tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedZone("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedZone === "" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          All ({members.length})
        </button>
        {zones.map((z) => {
          const count = members.filter((m: any) => m.zone === z.name).length;
          return (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedZone === z.name ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {z.name} ({count})
            </button>
          );
        })}

        {/* Add member button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="ml-auto gap-1.5 text-xs rounded-xl">
              <Plus size={12} /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users size={16} className="text-indigo-500" /> Add Team Member
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Zone */}
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Zone *</Label>
                <select
                  value={form.zone}
                  onChange={e => {
                    const z = zones.find(z => z.name === e.target.value);
                    setForm(f => ({ ...f, zone: e.target.value, zoneId: z?.id || "" }));
                  }}
                  className="h-9 w-full text-sm border border-slate-200 rounded-xl px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                </select>
              </div>

              {/* Identity */}
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Identity *</Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {IDENTITIES.map(id => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, identity: id }))}
                      className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                        form.identity === id
                          ? IDENTITY_COLORS[id]
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {IDENTITY_DESC[form.identity]}
                </p>
              </div>

              {/* Full name */}
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Full Name *</Label>
                <Input
                  className="h-9 text-sm border-slate-200 rounded-xl"
                  placeholder="Rahul Sharma"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                />
              </div>

              {/* Email */}
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Email *</Label>
                <Input
                  className="h-9 text-sm border-slate-200 rounded-xl"
                  placeholder="alpha.domlur@gharpayy.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              {/* Password */}
              <div>
                <Label className="text-xs font-medium text-slate-500 mb-1 block">Password *</Label>
                <Input
                  className="h-9 text-sm border-slate-200 rounded-xl"
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={createMember.isPending || !form.fullName || !form.email || !form.password}
                  onClick={() => createMember.mutate(form)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {createMember.isPending ? "Creating..." : "Add Member"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMembers.map((m: any) => (
          <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm text-slate-900">{m.fullName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{m.email}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border ${IDENTITY_COLORS[m.identity] || "bg-slate-50 text-slate-600"}`}>
                {m.identity}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
              <Shield size={10} className="text-slate-400" />
              <span className="text-[10px] text-slate-400">{m.zone}</span>
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${m.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                {m.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <p className="col-span-3 text-center text-xs text-slate-400 py-10">
            No team members yet. Add your first member above.
          </p>
        )}
      </div>
    </div>
  );
}