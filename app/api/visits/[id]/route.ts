import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Visit from "@/models/Visit";
import Lead from "@/models/Lead";

type Params = { params: { id: string } };

// PATCH /api/visits/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  await dbConnect();

  const body = await req.json();
  const visit = await Visit.findById(params.id);
  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Confirm visit
  if (body.confirmed !== undefined) {
    visit.confirmed = body.confirmed;
  }

  // Record outcome
  if (body.outcome) {
    visit.outcome = body.outcome;

    // Auto-update lead stage based on outcome
    const stageMap: Record<string, string> = {
      booked:          "Booked",
      considering:     "Negotiation",
      not_interested:  "Lost",
    };
    const newStage = stageMap[body.outcome];

    if (newStage) {
      await Lead.findByIdAndUpdate(visit.leadId, {
        stage: newStage,
        $push: {
          activities: {
            type: "visit_done",
            note: `Visit completed at ${visit.propertyName}. Outcome: ${body.outcome.replace("_", " ")}`,
            toStage: newStage,
            performedBy: visit.agentName,
            createdAt: new Date(),
          },
        },
      });
    }
  }

  if (body.notes !== undefined) visit.notes = body.notes;

  await visit.save();

  const shaped = {
    ...visit.toObject(),
    id: visit._id.toString(),
    leads:      { name: visit.leadName, phone: visit.leadPhone },
    properties: { name: visit.propertyName },
    agents:     { name: visit.agentName },
  };

  return NextResponse.json(shaped);
}

// GET /api/visits/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  await dbConnect();
  const visit = await Visit.findById(params.id).lean();
  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...visit, id: visit._id.toString() });
}
