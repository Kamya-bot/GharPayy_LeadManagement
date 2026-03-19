import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { attachLeadIntelligence } from "@/lib/leadScoring";

// PATCH /api/leads/[id]/transfer
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  const { toZone, performedBy, reason } = await req.json();

  if (!toZone) {
    return NextResponse.json({ error: "toZone is required" }, { status: 400 });
  }

  const lead = await Lead.findById(params.id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const fromZone = lead.zone || "Unassigned";

  if (fromZone === toZone) {
    return NextResponse.json({ error: "Lead is already in this zone" }, { status: 400 });
  }

  // Log zone transfer activity
  lead.activities.push({
    type: "zone_transfer",
    note: reason || `Transferred from ${fromZone} to ${toZone}`,
    fromZone,
    toZone,
    performedBy: performedBy || "Admin",
    createdAt: new Date(),
  } as any);

  lead.zone = toZone;
  lead.lastContactedAt = new Date();
  await lead.save();

  const enriched = attachLeadIntelligence(lead.toObject());
  return NextResponse.json({ lead: enriched });
}