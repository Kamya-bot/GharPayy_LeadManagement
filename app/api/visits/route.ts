import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Visit from "@/models/Visit";
import Lead from "@/models/Lead";

// GET /api/visits
export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};
  if (leadId) query.leadId = leadId;

  const visits = await Visit.find(query).sort({ scheduledAt: 1 }).lean();

  // Shape to match what the UI expects (visits page uses .leads and .properties)
  const shaped = visits.map((v) => ({
    ...v,
    id: v._id.toString(),
    leads:      { name: v.leadName, phone: v.leadPhone },
    properties: { name: v.propertyName },
    agents:     { name: v.agentName },
  }));

  return NextResponse.json(shaped);
}

// POST /api/visits
export async function POST(req: NextRequest) {
  await dbConnect();

  const body = await req.json();
  const {
    leadId, leadName, leadPhone,
    propertyName, propertyAddress,
    agentName, scheduledAt, notes,
  } = body;

  if (!leadId || !leadName || !propertyName || !agentName || !scheduledAt) {
    return NextResponse.json(
      { error: "leadId, leadName, propertyName, agentName and scheduledAt are required" },
      { status: 400 }
    );
  }

  const visit = await Visit.create({
    leadId, leadName, leadPhone: leadPhone || "",
    propertyName, propertyAddress,
    agentName, scheduledAt: new Date(scheduledAt),
    notes,
  });

  // Auto-update lead stage to "Visit Scheduled"
  await Lead.findByIdAndUpdate(leadId, {
    stage: "Visit Scheduled",
    $push: {
      activities: {
        type: "visit_scheduled",
        note: `Visit scheduled at ${propertyName} on ${new Date(scheduledAt).toLocaleDateString("en-IN")}`,
        performedBy: agentName,
        createdAt: new Date(),
      },
    },
  });

  const shaped = {
    ...visit.toObject(),
    id: visit._id.toString(),
    leads:      { name: visit.leadName, phone: visit.leadPhone },
    properties: { name: visit.propertyName },
    agents:     { name: visit.agentName },
  };

  return NextResponse.json(shaped, { status: 201 });
}
