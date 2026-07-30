import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izwniukfitmmbumiwipj.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6d25pdWtmaXRtbWJ1bWl3aXBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI4Mzk0OSwiZXhwIjoyMDk5ODU5OTQ5fQ.Em4dHAv_zI5Jt2NnkMXiLBHgzH7X7CVaC_XjTqKkaTc'

function normalizeCaseStatus(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

export async function GET() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/Disruption%20Notices?select=*&limit=1000`, {
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

    const records = JSON.parse(payload) as Record<string, unknown>[]
    const normalizedCaseStatuses = records
      .map((record) => normalizeCaseStatus(record.case_status))
      .filter((status): status is string => Boolean(status))

    const accomplishedCases = normalizedCaseStatuses.filter((status) => status === 'accomplished').length
    const flaggedPendingCases = normalizedCaseStatuses.filter((status) => status === 'flagged_pending').length
    const totalNotices = flaggedPendingCases
    const denominator = accomplishedCases + flaggedPendingCases
    const solvedPercentage = denominator > 0 ? Math.round((accomplishedCases / denominator) * 100) : 0

    return NextResponse.json({
      ok: true,
      data: {
        accomplishedCases,
        solvedPercentage,
        totalNotices,
        autonomousOperators: ['BOSS', 'OO', 'IAO', 'ASO', 'CO', 'FO'],
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
