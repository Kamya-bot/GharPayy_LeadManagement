"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface LeadForm {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  moveInDate: string;
  numberOfPeople: string;
  accommodationType: string;
  budgetMin: string;
  budgetMax: string;
  preferredLocation: string;
  occupation: string;
  company: string;
  gender: string;
  ageGroup: string;
  source: string;
  assignedTo: string;
  zone: string;
  priority: string;
  stage: string;
  inBlr: string;
  subPipeline: string;
  notes: string;
  tags: string;
}

const EMPTY: LeadForm = {
  name: "", phone: "", email: "", whatsapp: "",
  moveInDate: "", numberOfPeople: "1", accommodationType: "", budgetMin: "", budgetMax: "", preferredLocation: "",
  occupation: "", company: "", gender: "", ageGroup: "",
  source: "", assignedTo: "", zone: "", priority: "Medium",
  stage: "New", inBlr: "", subPipeline: "", notes: "", tags: "",
};

const TABS = ["Basic", "Requirements", "Profile", "Source", "Qualify"] as const;
type Tab = typeof TABS[number];

const ACCOMMODATION_TYPES = ["Single", "Double", "Triple", "Quad", "Private Room", "Entire Flat"];
const SOURCES = ["WhatsApp", "Website", "Referral", "Walk-in", "Housing.com", "99acres", "MagicBricks", "Facebook", "Instagram", "Cold Call", "Other"];
const STAGES = ["New", "Contacted", "Visit Scheduled", "Visited", "Negotiation", "Booked", "Lost"];
const GENDERS = ["Male", "Female", "Any"];
const AGE_GROUPS = ["18-22", "22-26", "26-30", "30+"];
const PRIORITIES = ["Low", "Medium", "High"];
const SUB_PIPELINES = ["Student", "Working Professional", "Family", "Corporate", "Other"];

// ─── FREE Smart Parser (no API, no cost) ─────────────────────────────────────

function parseLeadText(raw: string): Partial<LeadForm> {
  const result: Partial<LeadForm> = {};
  const text = raw.trim();
  const lower = text.toLowerCase();

  const phoneMatch = text.match(/(?:\+91[-.\s]?|91[-.\s]?|0)?([6-9]\d{9})/);
  if (phoneMatch) result.phone = phoneMatch[1];

  const namedMatch = text.match(/(?:name|naam)[:\s]+([A-Za-z]+(?: [A-Za-z]+){0,3})/i);
  if (namedMatch) {
    result.name = namedMatch[1].trim();
  } else {
    const beforePhone = phoneMatch ? text.split(phoneMatch[0])[0] : text;
    const nameMatch = beforePhone.match(/([A-Z][a-z]+(?: [A-Z][a-z]+){0,2})/);
    if (nameMatch) result.name = nameMatch[1].trim();
  }

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.email = emailMatch[0];

  const budgetRange = text.match(/(\d+\.?\d*)\s*(k)?\s*[-–to]+\s*(\d+\.?\d*)\s*(k)?/i);
  if (budgetRange) {
    const v1 = parseFloat(budgetRange[1]);
    const v2 = parseFloat(budgetRange[3]);
    result.budgetMin = String(budgetRange[2] ? v1 * 1000 : v1 < 500 ? v1 * 1000 : v1);
    result.budgetMax = String(budgetRange[4] ? v2 * 1000 : v2 < 500 ? v2 * 1000 : v2);
  } else {
    const singleBudget = text.match(/(?:budget|rent|pay|upto)[:\s]*[₹Rs.]?\s*(\d+\.?\d*)\s*(k)?/i);
    if (singleBudget) {
      const v = parseFloat(singleBudget[1]);
      const actual = String(singleBudget[2] ? v * 1000 : v < 500 ? v * 1000 : v);
      result.budgetMin = actual;
      result.budgetMax = actual;
    }
  }

  if (/\b1\s*sharing\b|single\s*(room|sharing|occupancy)?/i.test(text))      result.accommodationType = "Single";
  else if (/\b2\s*sharing\b|double\s*(room|sharing|occupancy)?/i.test(text)) result.accommodationType = "Double";
  else if (/\b3\s*sharing\b|triple\s*(room|sharing|occupancy)?/i.test(text)) result.accommodationType = "Triple";
  else if (/\b4\s*sharing\b|quad/i.test(text))                               result.accommodationType = "Quad";
  else if (/private\s*room/i.test(text))                                     result.accommodationType = "Private Room";
  else if (/flat|apartment|\d\s*bhk/i.test(text))                            result.accommodationType = "Entire Flat";

  const peopleMatch = text.match(/(\d+)\s*(?:people|person|persons|boys|girls|bed|pax|heads)/i);
  if (peopleMatch) result.numberOfPeople = peopleMatch[1];

  const blrAreas = [
    "koramangala", "hsr layout", "hsr", "indiranagar", "whitefield",
    "marathahalli", "electronic city", "bellandur", "sarjapur", "btm",
    "jayanagar", "jp nagar", "banashankari", "hebbal", "yelahanka",
    "mg road", "domlur", "egl", "kadubeesanahalli", "kr puram",
    "bommanahalli", "silk board", "haralur", "varthur", "kadugodi",
    "mahadevapura", "cv raman nagar", "old airport road", "kalyan nagar",
    "banaswadi", "nagawara", "thanisandra", "hennur", "devanahalli",
  ];
  const foundAreas: string[] = [];
  for (const area of blrAreas) {
    if (lower.includes(area)) foundAreas.push(area.replace(/\b\w/g, c => c.toUpperCase()));
  }
  if (foundAreas.length) {
    result.preferredLocation = foundAreas.join(", ");
  } else {
    const locMatch = text.match(/(?:in|near|at|location|area|locality)[:\s]+([A-Za-z][A-Za-z\s,]{2,30})(?:\.|,|\n|budget|for|₹|$)/i);
    if (locMatch) result.preferredLocation = locMatch[1].trim();
  }

  const datePatterns = [
    /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+(\d{4}))?/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/i,
  ];
  for (const pattern of datePatterns) {
    const m = text.match(pattern);
    if (m) {
      try {
        const d = new Date(m[0]);
        if (!isNaN(d.getTime())) { result.moveInDate = d.toISOString().split("T")[0]; break; }
      } catch { /* skip */ }
    }
  }
  if (!result.moveInDate) {
    if (/immediate|asap|urgent|right away|right now/i.test(text)) {
      result.moveInDate = new Date().toISOString().split("T")[0];
    } else if (/next month/i.test(text)) {
      const d = new Date(); d.setMonth(d.getMonth() + 1);
      result.moveInDate = d.toISOString().split("T")[0];
    }
  }

  if (/\bfemale|girl|women|lady|ladies\b/i.test(text)) result.gender = "Female";
  else if (/\bmale|boy\b/i.test(text))                 result.gender = "Male";

  if (/\bstudent|college|university|btech|mtech|mba|bca|mca|degree\b/i.test(text)) {
    result.subPipeline = "Student";
    result.occupation = "Student";
  } else if (/\bworking|professional|employee|job|software|engineer|developer|analyst|manager|consultant\b/i.test(text)) {
    result.subPipeline = "Working Professional";
    if (/software engineer/i.test(text))  result.occupation = "Software Engineer";
    else if (/developer/i.test(text))     result.occupation = "Developer";
    else if (/data analyst/i.test(text))  result.occupation = "Data Analyst";
    else if (/analyst/i.test(text))       result.occupation = "Analyst";
    else if (/manager/i.test(text))       result.occupation = "Manager";
    else if (/consultant/i.test(text))    result.occupation = "Consultant";
    else                                   result.occupation = "Working Professional";
  } else if (/\bfamily|couple|married\b/i.test(text)) {
    result.subPipeline = "Family";
  } else if (/\bintern\b/i.test(text)) {
    result.subPipeline = "Working Professional";
    result.occupation = "Intern";
  }

  const companyMatch = text.match(/(?:at|from|works? at|working at|company[:\s]+|college[:\s]+|employer[:\s]+)([A-Z][A-Za-z\s&.]{2,30})(?:,|\.|$|\n)/);
  if (companyMatch) result.company = companyMatch[1].trim();

  if (/whatsapp/i.test(text))                       result.source = "WhatsApp";
  else if (/instagram|insta\b/i.test(text))         result.source = "Instagram";
  else if (/facebook|\bfb\b/i.test(text))           result.source = "Facebook";
  else if (/referr|referred|reference/i.test(text)) result.source = "Referral";
  else if (/housing\.com/i.test(text))              result.source = "Housing.com";
  else if (/99acres/i.test(text))                   result.source = "99acres";
  else if (/magic\s*bricks/i.test(text))            result.source = "MagicBricks";
  else if (/walk.?in/i.test(text))                  result.source = "Walk-in";
  else if (/website|online/i.test(text))            result.source = "Website";

  if (/\bin blr|in bangalore|currently in|already in|staying in\b/i.test(text))      result.inBlr = "INBLR";
  else if (/\bnot in|outside|coming from|relocat|moving to bangalore\b/i.test(text)) result.inBlr = "NOBLR";

  const noteMatch = text.match(/(?:note|requirement|need|want|looking for|special)[:\s]+(.+?)(?:\.|$)/i);
  if (noteMatch) result.notes = noteMatch[1].trim();

  return result;
}

// ─── Budget enum mapper ───────────────────────────────────────────────────────

function getBudgetEnum(min: string): string | undefined {
  const v = Number(min);
  if (!v) return undefined;
  if (v < 8000)  return "Under ₹5L";
  if (v < 12000) return "₹5L–₹10L";
  if (v < 20000) return "₹10L–₹20L";
  if (v < 30000) return "₹20L–₹30L";
  if (v < 50000) return "₹30L–₹50L";
  return "Above ₹50L";
}

// ─── Tab styles ───────────────────────────────────────────────────────────────

const inputCls = "h-9 text-sm border-slate-200 rounded-xl focus-visible:ring-indigo-500";
const labelCls = "text-xs font-medium text-slate-500 mb-1 block";

function BasicTab({ form, set }: { form: LeadForm; set: (f: string, v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className={labelCls}>Full Name *</Label>
          <Input className={inputCls} placeholder="Rahul Sharma" value={form.name} onChange={e => set("name", e.target.value)} />
        </div>
        <div>
          <Label className={labelCls}>Phone *</Label>
          <Input className={inputCls} placeholder="9876543210" value={form.phone} onChange={e => set("phone", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className={labelCls}>Email</Label>
          <Input className={inputCls} type="email" placeholder="rahul@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
        </div>
        <div>
          <Label className={labelCls}>WhatsApp</Label>
          <Input className={inputCls} placeholder="Same as phone?" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function RequirementsTab({ form, set }: { form: LeadForm; set: (f: string, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className={labelCls}>Move-in Date</Label>
          <Input className={inputCls} type="date" value={form.moveInDate} onChange={e => set("moveInDate", e.target.value)} />
        </div>
        <div>
          <Label className={labelCls}>No. of People</Label>
          <Input className={inputCls} type="number" min="1" max="10" value={form.numberOfPeople} onChange={e => set("numberOfPeople", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className={labelCls}>Accommodation Type</Label>
          <select
            value={form.accommodationType}
            onChange={e => set("accommodationType", e.target.value)}
            className="h-9 w-full text-sm border border-slate-200 rounded-xl px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">Select type</option>
            {ACCOMMODATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className={labelCls}>Budget (₹/month)</Label>
          <select
            value={form.budgetMin ? `${form.budgetMin}-${form.budgetMax}` : ""}
            onChange={e => {
              const val = e.target.value;
              if (!val) { set("budgetMin", ""); set("budgetMax", ""); return; }
              const [min, max] = val.split("-");
              set("budgetMin", min);
              set("budgetMax", max || "");
            }}
            className="h-9 w-full text-sm border border-slate-200 rounded-xl px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">Select budget</option>
            <option value="5000-8000">₹5,000–8,000</option>
            <option value="8000-12000">₹8,000–12,000</option>
            <option value="12000-18000">₹12,000–18,000</option>
            <option value="18000-25000">₹18,000–25,000</option>
            <option value="25000-">₹25,000+</option>
          </select>
        </div>
      </div>
      <div>
        <Label className={labelCls}>Preferred Location</Label>
        <Input className={inputCls} placeholder="Koramangala, HSR Layout..." value={form.preferredLocation} onChange={e => set("preferredLocation", e.target.value)} />
      </div>
    </div>
  );
}

function ProfileTab({ form, set }: { form: LeadForm; set: (f: string, v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className={labelCls}>Occupation</Label>
          <Input className={inputCls} placeholder="Software Engineer" value={form.occupation} onChange={e => set("occupation", e.target.value)} />
        </div>
        <div>
          <Label className={labelCls}>Company / College</Label>
          <Input className={inputCls} placeholder="Infosys / IIT Bhopal" value={form.company} onChange={e => set("company", e.target.value)} />
        </div>
      </div>
      <div>
        <Label className={labelCls}>Gender</Label>
        <div className="flex gap-2 mt-1">
          {GENDERS.map(g => (
            <button type="button" key={g} onClick={() => set("gender", form.gender === g ? "" : g)}
              className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${form.gender === g ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >{g}</button>
          ))}
        </div>
      </div>
      <div>
        <Label className={labelCls}>Age Group</Label>
        <div className="flex gap-2 mt-1">
          {AGE_GROUPS.map(a => (
            <button type="button" key={a} onClick={() => set("ageGroup", form.ageGroup === a ? "" : a)}
              className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${form.ageGroup === a ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >{a}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourceTab({ form, set }: { form: LeadForm; set: (f: string, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className={labelCls}>Lead Source *</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {SOURCES.map(s => (
            <button type="button" key={s} onClick={() => set("source", form.source === s ? "" : s)}
              className={`py-2 rounded-xl border text-xs font-medium transition-all ${form.source === s ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >{s}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className={labelCls}>Assigned To *</Label>
          <Input className={inputCls} placeholder="Agent name" value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)} />
        </div>
        <div>
          <Label className={labelCls}>Zone</Label>
          <Input className={inputCls} placeholder="North Bhopal" value={form.zone} onChange={e => set("zone", e.target.value)} />
        </div>
      </div>
      <div>
        <Label className={labelCls}>Priority</Label>
        <div className="flex gap-2">
          {PRIORITIES.map(p => (
            <button type="button" key={p} onClick={() => set("priority", p)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                form.priority === p
                  ? p === "High" ? "bg-rose-50 border-rose-400 text-rose-700"
                    : p === "Medium" ? "bg-amber-50 border-amber-400 text-amber-700"
                    : "bg-slate-100 border-slate-400 text-slate-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QualifyTab({ form, set }: { form: LeadForm; set: (f: string, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className={labelCls}>Location Type</Label>
        <div className="flex gap-2 mt-1">
          {["INBLR", "NOBLR"].map(v => (
            <button type="button" key={v} onClick={() => set("inBlr", form.inBlr === v ? "" : v)}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                form.inBlr === v
                  ? v === "INBLR" ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                    : "bg-orange-50 border-orange-400 text-orange-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >{v === "INBLR" ? "🏙 INBLR" : "🛣 NOBLR"}</button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {form.inBlr === "INBLR" ? "Inside Bangalore" : form.inBlr === "NOBLR" ? "Outside / Not in Bangalore" : "Select if lead is inside or outside Bangalore"}
        </p>
      </div>
      <div>
        <Label className={labelCls}>Sub-Pipeline</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {SUB_PIPELINES.map(s => (
            <button type="button" key={s} onClick={() => set("subPipeline", form.subPipeline === s ? "" : s)}
              className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                form.subPipeline === s ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >{s}</button>
          ))}
        </div>
      </div>
      <div>
        <Label className={labelCls}>Initial Stage</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {STAGES.map(s => (
            <button type="button" key={s} onClick={() => set("stage", s)}
              className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                form.stage === s ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >{s}</button>
          ))}
        </div>
      </div>
      <div>
        <Label className={labelCls}>Tags <span className="text-slate-400 font-normal">(comma-separated)</span></Label>
        <Input className={inputCls} placeholder="investor, urgent, student" value={form.tags} onChange={e => set("tags", e.target.value)} />
      </div>
      <div>
        <Label className={labelCls}>Notes</Label>
        <Textarea
          placeholder="Any specific requirements, concerns, or context..."
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          rows={4}
          className="text-sm border-slate-200 rounded-xl resize-none focus-visible:ring-indigo-500"
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AddLeadDialogProps {
  onCreated?: (lead: any) => void;
}

const AddLeadDialog = ({ onCreated }: AddLeadDialogProps) => {
  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState<Tab>("Basic");
  const [form, setForm]           = useState<LeadForm>({ ...EMPTY });
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleParse() {
    if (!pasteText.trim()) return;
    const parsed = parseLeadText(pasteText);
    setForm(prev => ({ ...prev, ...parsed }));
    setPasteText("");
    toast.success("Fields auto-filled ✨");
  }

  async function submit() {
    if (!form.name.trim())       { setError("Name is required."); setTab("Basic"); return; }
    if (!form.phone.trim())      { setError("Phone is required."); setTab("Basic"); return; }
    if (!form.source)            { setError("Lead source is required."); setTab("Source"); return; }
    if (!form.assignedTo.trim()) { setError("Assigned agent is required."); setTab("Source"); return; }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name:        form.name,
        phone:       form.phone,
        email:       form.email || undefined,
        whatsapp:    form.whatsapp || undefined,
        source:      form.source,
        assignedTo:  form.assignedTo,
        zone:        form.zone || undefined,
        priority:    form.priority,
        stage:       form.stage,
        inBlr:       form.inBlr || undefined,
        subPipeline: form.subPipeline || undefined,
        budget:      getBudgetEnum(form.budgetMin),
        preferredLocality: form.preferredLocation || undefined,
        notes: [
          form.notes,
          form.occupation        ? `Occupation: ${form.occupation}` : "",
          form.company           ? `Company/College: ${form.company}` : "",
          form.gender            ? `Gender: ${form.gender}` : "",
          form.ageGroup          ? `Age: ${form.ageGroup}` : "",
          form.moveInDate        ? `Move-in: ${form.moveInDate}` : "",
          form.numberOfPeople !== "1" ? `People: ${form.numberOfPeople}` : "",
          form.accommodationType ? `Accommodation: ${form.accommodationType}` : "",
        ].filter(Boolean).join("\n") || undefined,
        tags:        form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        initialNote: `Lead created via Add Lead form. Source: ${form.source}`,
        createdBy:   "Admin",
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create lead");
      const data = await res.json();

      toast.success(`Lead created — ${form.name}`);
      setOpen(false);
      setForm({ ...EMPTY });
      setTab("Basic");
      onCreated?.(data.lead);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const tabIndex = TABS.indexOf(tab);

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setForm({ ...EMPTY }); setTab("Basic"); setError(""); } }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700">
          <Plus size={13} /> Add Lead
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-500" /> Add New Lead
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4">
          {/* Smart Paste Box */}
          <div className="mb-4 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-3">
            <p className="text-xs text-amber-700 font-medium mb-1.5 flex items-center gap-1">
              <Sparkles size={11} /> Paste lead info — name, phone, budget, location...
            </p>
            <Textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleParse(); }}
              placeholder="e.g. Rahul Sharma 9876543210 2BHK Koramangala budget 15-20k working professional"
              rows={2}
              className="text-xs border-0 bg-transparent resize-none p-0 focus-visible:ring-0 placeholder:text-amber-400"
            />
            {pasteText.trim() && (
              <div className="flex justify-end mt-1.5">
                <button type="button" onClick={handleParse}
                  className="text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg transition-all"
                >Auto-fill fields →</button>
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5 mb-4">
            {TABS.map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >{t}</button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 pb-2 max-h-64 overflow-y-auto">
          {tab === "Basic"        && <BasicTab        form={form} set={set} />}
          {tab === "Requirements" && <RequirementsTab form={form} set={set} />}
          {tab === "Profile"      && <ProfileTab      form={form} set={set} />}
          {tab === "Source"       && <SourceTab       form={form} set={set} />}
          {tab === "Qualify"      && <QualifyTab      form={form} set={set} />}
        </div>

        {error && (
          <div className="mx-6 mt-2 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{error}</div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between mt-2">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <div key={t} className={`w-1.5 h-1.5 rounded-full transition-all ${tab === t ? "bg-indigo-500 w-4" : "bg-slate-200"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {tabIndex > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setTab(TABS[tabIndex - 1])}>← Back</Button>
            )}
            {tabIndex < TABS.length - 1 ? (
              <Button type="button" size="sm" onClick={() => setTab(TABS[tabIndex + 1])} className="bg-indigo-600 hover:bg-indigo-700">Next →</Button>
            ) : (
              <Button type="button" size="sm" onClick={submit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Creating…" : "Create Lead ✓"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadDialog;