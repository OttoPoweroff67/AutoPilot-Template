import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izwniukfitmmbumiwipj.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6d25pdWtmaXRtbWJ1bWl3aXBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI4Mzk0OSwiZXhwIjoyMDk5ODU5OTQ5fQ.Em4dHAv_zI5Jt2NnkMXiLBHgzH7X7CVaC_XjTqKkaTc'

export async function GET() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/Disruption%20Notices?select=*&case_status=eq.flagged_pending&limit=50`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const payload = await response.text()

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: payload }, { status: response.status })
    }

    return NextResponse.json({ ok: true, data: JSON.parse(payload) })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
