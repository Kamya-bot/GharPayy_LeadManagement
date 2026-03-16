import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";

type Params = { params: { id: string } };

// ─── GET /api/leads/[id] ───────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  await dbConnect();
  const lead = await Lead.findById(params.id).lean();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

// ─── PATCH /api/leads/[id] ─────────────────────────────────────────────────
// Supports:
//   - General field updates
//   - Stage change  → body: { stage, performedBy, note? }
//   - Add activity  → body: { addActivity: { type, note, performedBy } }
export async function PATCH(req: NextRequest, { params }: Params) {
  await dbConnect();

  const body = await req.json();
  const lead = await Lead.findById(params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Stage change ──────────────────────────────────────────────────────────
  if (body.stage && body.stage !== lead.stage) {
    const activity = {
      type: "stage_change" as const,
      note: body.note || `Stage changed from ${lead.stage} to ${body.stage}`,
      fromStage: lead.stage,
      toStage: body.stage,
      performedBy: body.performedBy || "System",
      createdAt: new Date(),
    };
    lead.activities.push(activity);
    lead.stage = body.stage;
  }

  // ── Add standalone activity ───────────────────────────────────────────────
  if (body.addActivity) {
    lead.activities.push({
      ...body.addActivity,
      createdAt: new Date(),
    });
    if (body.addActivity.type === "call") {
      lead.lastContactedAt = new Date();
    }
  }

  // ── General updates ───────────────────────────────────────────────────────
  const allowedFields = [
    "name",
    "phone",
    "email",
    "whatsapp",
    "source",
    "assignedTo",
    "zone",
    "priority",
    "tags",
    "propertyType",
    "budget",
    "preferredLocality",
    "possession",
    "notes",
    "nextFollowUpAt",
    "lastContactedAt",
  ];

  for (const key of allowedFields) {
    if (key in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (lead as any)[key] = body[key];
    }
  }

  await lead.save();
  return NextResponse.json({ lead });
}

// ─── DELETE /api/leads/[id] ────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  await dbConnect();
  await Lead.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
