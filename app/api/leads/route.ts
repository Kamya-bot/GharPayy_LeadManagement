import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Zone from "@/models/Zone";
import { attachLeadIntelligence } from "@/lib/leadScoring";

// --- GET /api/leads ---
export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const stage       = searchParams.get("stage");
  const assignedTo  = searchParams.get("assignedTo");
  const zone        = searchParams.get("zone");
  const inBlr       = searchParams.get("inBlr");
  const subPipeline = searchParams.get("subPipeline");
  const search      = searchParams.get("search");
  const temperature = searchParams.get("temperature");
  const aging       = searchParams.get("aging"); // "true" = only aging leads
  const page        = parseInt(searchParams.get("page") || "1", 10);
  const limit       = parseInt(searchParams.get("limit") || "50", 10);

  const query: Record<string, unknown> = {};
  if (stage)       query.stage = stage;
  if (assignedTo)  query.assignedTo = assignedTo;
  if (zone)        query.zone = zone;
  if (inBlr)       query.inBlr = inBlr;
  if (subPipeline) query.subPipeline = subPipeline;
  if (temperature) query.temperature = temperature;
  if (search) {
    query.$or = [
      { name:  { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [rawLeads, total] = await Promise.all([
    Lead.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Lead.countDocuments(query),
  ]);

  // Attach intelligence (score, temperature, agingDays) to each lead
  let leads = rawLeads.map(attachLeadIntelligence);

  // Filter aging leads in memory (agingDays >= 5, not Booked/Lost)
  if (aging === "true") {
    leads = leads.filter((l: any) => l.isAging);
  }

  return NextResponse.json({ leads, total, page, limit });
}

// --- POST /api/leads ---
export async function POST(req: NextRequest) {
  await dbConnect();

  const body = await req.json();
  const { initialNote, createdBy, ...leadData } = body;

  const optionalFields = [
    "propertyType", "budget", "possession",
    "email", "whatsapp", "zone", "preferredLocality", "nextFollowUpAt",
    "inBlr", "subPipeline",
  ];
  for (const field of optionalFields) {
    if (leadData[field] === "" || leadData[field] === null) {
      delete leadData[field];
    }
  }

  // Auto-assign zone based on preferredLocality
  if (!leadData.zone && leadData.preferredLocality) {
    const location = leadData.preferredLocality.toLowerCase();
    const zones = await Zone.find({ isActive: true }).lean();
    for (const zone of zones) {
      const matched = ((zone as any).areas || []).some((area: string) =>
        location.includes(area.toLowerCase()) || area.toLowerCase().includes(location)
      );
      if (matched) { leadData.zone = (zone as any).name; break; }
    }
  }

  const activities = [];
  activities.push({
    type: "note",
    note: initialNote || "Lead created",
    performedBy: createdBy || "System",
    createdAt: new Date(),
  });

  if (leadData.zone) {
    activities.push({
      type: "note",
      note: `Auto-assigned to zone: ${leadData.zone}`,
      performedBy: "System",
      createdAt: new Date(),
    });
  }

  const lead = await Lead.create({ ...leadData, activities });
  const enriched = attachLeadIntelligence(lead.toObject());
  return NextResponse.json({ lead: enriched }, { status: 201 });
}