import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, leadName, leadBudget, leadLocation, leadStatus } = body;
    
    // Stub for AI reply suggestion logic
    const suggestions = [
      { label: 'Follow-up', message: `Hi ${leadName}, just wanted to check if you had a chance to look at the properties in ${leadLocation || 'your preferred area'}?` },
      { label: 'Verify Budget', message: `Hello ${leadName}, regarding your budget of ${leadBudget || 'the mentioned range'}, do you have any flexibility or are you firm on this?` },
      { label: 'Book Visit', message: `Hi ${leadName}, would you like to schedule a visit to some properties this weekend?` },
    ];

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
