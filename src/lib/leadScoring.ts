import { ILead } from "@/models/Lead";

export type LeadTemperature = "Hot" | "Warm" | "Cold";

export interface LeadIntelligence {
  score: number;           // 0–10
  temperature: LeadTemperature;
  agingDays: number;
  isAging: boolean;        // true if no contact in 5+ days
  breakdown: {
    stageScore: number;
    activityScore: number;
    recencyScore: number;
    priorityScore: number;
    profileScore: number;
  };
}

// Stage progression score (0–3)
const STAGE_SCORES: Record<string, number> = {
  New:                0.5,
  Contacted:          1.0,
  "Visit Scheduled":  1.5,
  Visited:            2.0,
  Negotiation:        2.5,
  Booked:             3.0,
  Lost:               0,
};

// Activity recency score (0–2): rewards recent engagement
function getRecencyScore(lead: ILead): number {
  const lastContact = lead.lastContactedAt || lead.updatedAt || lead.createdAt;
  const daysSince = (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 1)  return 2.0;
  if (daysSince <= 3)  return 1.5;
  if (daysSince <= 7)  return 1.0;
  if (daysSince <= 14) return 0.5;
  return 0;
}

// Activity count score (0–2): rewards engagement volume
function getActivityScore(lead: ILead): number {
  const count = (lead.activities || []).length;
  if (count >= 10) return 2.0;
  if (count >= 6)  return 1.5;
  if (count >= 3)  return 1.0;
  if (count >= 1)  return 0.5;
  return 0;
}

// Priority score (0–1)
function getPriorityScore(lead: ILead): number {
  if (lead.priority === "High")   return 1.0;
  if (lead.priority === "Medium") return 0.5;
  return 0;
}

// Profile completeness score (0–2)
function getProfileScore(lead: ILead): number {
  let score = 0;
  if (lead.propertyType)     score += 0.4;
  if (lead.budget)           score += 0.4;
  if (lead.preferredLocality) score += 0.4;
  if (lead.email || lead.whatsapp) score += 0.4;
  if (lead.subPipeline)      score += 0.4;
  return Math.min(score, 2);
}

export function computeLeadIntelligence(lead: ILead): LeadIntelligence {
  const stageScore    = STAGE_SCORES[lead.stage] ?? 0;
  const activityScore = getActivityScore(lead);
  const recencyScore  = getRecencyScore(lead);
  const priorityScore = getPriorityScore(lead);
  const profileScore  = getProfileScore(lead);

  const raw = stageScore + activityScore + recencyScore + priorityScore + profileScore;
  // Max possible = 3 + 2 + 2 + 1 + 2 = 10
  const score = Math.min(Math.round(raw * 10) / 10, 10);

  // Temperature thresholds
  let temperature: LeadTemperature = "Cold";
  if (score >= 7)      temperature = "Hot";
  else if (score >= 4) temperature = "Warm";

  // Aging
  const lastContact = lead.lastContactedAt || lead.updatedAt || lead.createdAt;
  const agingDays = Math.floor(
    (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isAging = agingDays >= 5 && lead.stage !== "Booked" && lead.stage !== "Lost";

  return {
    score,
    temperature,
    agingDays,
    isAging,
    breakdown: { stageScore, activityScore, recencyScore, priorityScore, profileScore },
  };
}

// Compute and attach intelligence fields to a plain lead object (for API responses)
export function attachLeadIntelligence(lead: any): any {
  const intel = computeLeadIntelligence(lead as ILead);
  return {
    ...lead,
    leadScore:   intel.score,
    temperature: intel.temperature,
    agingDays:   intel.agingDays,
    isAging:     intel.isAging,
  };
}