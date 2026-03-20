"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedLead {
  basic: {
    lead_name: string;
    phone: string;
    email: string;
    whatsapp_number: string;
  };
  requirements: {
    move_in_date: string;
    people_count: number;
    accommodation_type: string;
    budget_min: number;
    budget_max: number;
    preferred_locations: string[];
    food_preference: string;
    gender_preference: string;
  };
  profile: {
    occupation: string;
    what_they_do: string;
    company_or_college: string;
    in_blr: boolean;
    smoking_preference: string;
    special_requests: string;
  };
  source: {
    lead_source: string;
    campaign_source: string;
    referral_by: string;
  };
  qualify: {
    lead_temperature: string;
    lead_intent: string;
  };
}

interface LeadAIParserProps {
  onParsed: (data: ParsedLead) => void; // fires when parsing is done — use this to fill your form
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a lead parser for a PG accommodation CRM in India called Gharpayy.

Extract structured information from raw lead text (WhatsApp messages, notes, form pastes etc.) 
and return ONLY a valid JSON object. No explanation, no markdown, no backticks. Just raw JSON.

Rules:
- budget: extract min and max as numbers in INR. "15-20k" → budget_min: 15000, budget_max: 20000. "12k" → both 12000.
- accommodation_type: map to one of: Single, Double, Triple, Studio, Any
- food_preference: veg / non-veg / any
- gender_preference: male / female / any
- occupation: Job / Student / Intern / Other
- lead_source: Website / WhatsApp / Walk-in / Instagram / Referral / Google Ads / Unknown
- lead_temperature: Hot / Warm / Cold (infer from urgency language)
- lead_intent: "Just Browsing" / "Comparing Options" / "Ready to Visit" / "Ready to Book"
- in_blr: true if they mention being in Bangalore already
- people_count: number of people (default 1)
- preferred_locations: array of area names mentioned
- If a field is missing, use empty string "" or 0 or [] or false as appropriate.
- phone: extract 10-digit Indian mobile number
- move_in_date: extract date in YYYY-MM-DD format if mentioned, else ""

Return this exact JSON structure:
{
  "basic": { "lead_name": "", "phone": "", "email": "", "whatsapp_number": "" },
  "requirements": { "move_in_date": "", "people_count": 1, "accommodation_type": "", "budget_min": 0, "budget_max": 0, "preferred_locations": [], "food_preference": "", "gender_preference": "" },
  "profile": { "occupation": "", "what_they_do": "", "company_or_college": "", "in_blr": false, "smoking_preference": "", "special_requests": "" },
  "source": { "lead_source": "WhatsApp", "campaign_source": "", "referral_by": "" },
  "qualify": { "lead_temperature": "Warm", "lead_intent": "Comparing Options" }
}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadAIParser({ onParsed }: LeadAIParserProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleParse = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setStatus("parsing");
    setErrorMsg("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: trimmed }],
        }),
      });

      if (!response.ok) throw new Error(`API error ${response.status}`);

      const data = await response.json();
      const raw = data.content?.map((b: { type: string; text?: string }) => b.type === "text" ? b.text : "").join("") ?? "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed: ParsedLead = JSON.parse(clean);

      onParsed(parsed);
      setStatus("done");

      // Reset after 2s
      setTimeout(() => {
        setText("");
        setStatus("idle");
      }, 2000);
    } catch (err) {
      console.error("Lead parse error:", err);
      setErrorMsg("Couldn't parse the text. Try adding more details like name, phone, location, budget.");
      setStatus("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleParse();
    }
  };

  return (
    <div className="relative w-full mb-4">
      {/* Paste Box */}
      <div
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
          ${status === "parsing" ? "border-yellow-400 bg-yellow-50" : ""}
          ${status === "done" ? "border-green-400 bg-green-50" : ""}
          ${status === "error" ? "border-red-300 bg-red-50" : ""}
          ${status === "idle" ? "border-orange-300 bg-orange-50 hover:border-orange-400" : ""}
        `}
      >
        {/* Animated shimmer when parsing */}
        {status === "parsing" && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent animate-[shimmer_1.5s_infinite]" />
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste lead info — name, phone, budget, location..."
          disabled={status === "parsing"}
          rows={3}
          className="w-full bg-transparent px-4 pt-4 pb-2 text-sm text-gray-700 placeholder-orange-400 resize-none outline-none font-medium"
        />

        {/* Example text */}
        {!text && status === "idle" && (
          <p className="px-4 pb-3 text-xs text-orange-400 font-normal">
            e.g. Rahul Sharma 9876543210 2BHK Koramangala budget 15-20k working professional
          </p>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-orange-200 bg-orange-50/50">
          <span className="text-xs text-orange-400">
            {status === "parsing" && "✨ Parsing with AI..."}
            {status === "done" && "✅ Form filled! Check all tabs."}
            {status === "error" && <span className="text-red-500">{errorMsg}</span>}
            {status === "idle" && text && (
              <span className="text-gray-400">Press ⌘+Enter or click Parse →</span>
            )}
            {status === "idle" && !text && (
              <span className="text-orange-300">AI will auto-fill all form tabs</span>
            )}
          </span>

          <button
            onClick={handleParse}
            disabled={!text.trim() || status === "parsing"}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
              ${text.trim() && status !== "parsing"
                ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 cursor-pointer"
                : "bg-orange-200 text-orange-400 cursor-not-allowed"
              }
            `}
          >
            {status === "parsing" ? "Parsing..." : "Parse →"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// ─── Usage Example ────────────────────────────────────────────────────────────
//
// In your AddLeadModal.tsx or wherever the form lives:
//
// import LeadAIParser, { ParsedLead } from "./LeadAIParser";
//
// const handleParsed = (data: ParsedLead) => {
//   setFormData(prev => ({
//     ...prev,
//     basic: { ...prev.basic, ...data.basic },
//     requirements: { ...prev.requirements, ...data.requirements },
//     profile: { ...prev.profile, ...data.profile },
//     source: { ...prev.source, ...data.source },
//     qualify: { ...prev.qualify, ...data.qualify },
//   }));
// };
//
// <LeadAIParser onParsed={handleParsed} />
// <Tabs> ... </Tabs>  ← your existing 5-tab form