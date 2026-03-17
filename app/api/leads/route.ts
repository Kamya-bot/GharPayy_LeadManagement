import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Zone from "@/models/Zone";

// ─── GET /api/leads ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const assignedTo = searchParams.get("assignedTo");
  const zone = searchParams.get("zone");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const query: Record<string, unknown> = {};
  if (stage) query.stage = stage;
  if (assignedTo) query.assignedTo = assignedTo;
  if (zone) query.zone = zone;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Lead.countDocuments(query),
  ]);

  return NextResponse.json({ leads, total, page, limit });
}

// ─── POST /api/leads ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  await dbConnect();

  const body = await req.json();
  const { initialNote, createdBy, ...leadData } = body;

  // Strip empty strings from optional enum fields
  const optionalFields = [
    "propertyType", "budget", "possession",
    "email", "whatsapp", "zone", "preferredLocality", "nextFollowUpAt",
  ];
  for (const field of optionalFields) {
    if (leadData[field] === "" || leadData[field] === null) {
      delete leadData[field];
    }
  }

  // ─── Auto-assign zone based on preferredLocality ──────────────────────────
  if (!leadData.zone && leadData.preferredLocality) {
    const location = leadData.preferredLocality.toLowerCase();
    const zones = await Zone.find({ isActive: true }).lean();

    for (const zone of zones) {
      const matched = (zone.areas || []).some((area: string) =>
        location.includes(area.toLowerCase()) ||
        area.toLowerCase().includes(location)
      );
      if (matched) {
        leadData.zone = zone.name;
        break;
      }
    }
  }

  const activities = [];
  activities.push({
    type: "note",
    note: initialNote || "Lead created",
    performedBy: createdBy || "System",
    createdAt: new Date(),
  });

  // Log zone assignment if it happened
  if (leadData.zone) {
    activities.push({
      type: "note",
      note: `Auto-assigned to zone: ${leadData.zone}`,
      performedBy: "System",
      createdAt: new Date(),
    });
  }

  const lead = await Lead.create({ ...leadData, activities });

  return NextResponse.json({ lead }, { status: 201 });
}