import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';

// GET /api/agents/stats
// Returns per-agent performance stats computed from leads
export async function GET() {
  try {
    await dbConnect();

    // Aggregate leads grouped by assignedTo
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$assignedTo',
          totalLeads: { $sum: 1 },
          conversions: {
            $sum: { $cond: [{ $eq: ['$stage', 'Booked'] }, 1, 0] },
          },
          activeLeads: {
            $sum: {
              $cond: [
                { $not: [{ $in: ['$stage', ['Booked', 'Lost']] }] },
                1,
                0,
              ],
            },
          },
          lostLeads: {
            $sum: { $cond: [{ $eq: ['$stage', 'Lost'] }, 1, 0] },
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] },
          },
        },
      },
      { $sort: { totalLeads: -1 } },
    ]);

    const shaped = stats.map((s: any) => ({
      id: s._id,
      name: s._id,
      totalLeads: s.totalLeads,
      conversions: s.conversions,
      activeLeads: s.activeLeads,
      lostLeads: s.lostLeads,
      highPriority: s.highPriority,
      conversionRate: s.totalLeads > 0
        ? Math.round((s.conversions / s.totalLeads) * 100)
        : 0,
      avgResponseTime: Math.floor(Math.random() * 30) + 5, // placeholder
    }));

    return NextResponse.json(shaped);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}