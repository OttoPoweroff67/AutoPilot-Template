import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izwniukfitmmbumiwipj.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6d25pdWtmaXRtbWJ1bWl3aXBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI4Mzk0OSwiZXhwIjoyMDk5ODU5OTQ5fQ.Em4dHAv_zI5Jt2NnkMXiLBHgzH7X7CVaC_XjTqKkaTc'

function normalizePendingItem(item: Record<string, unknown>) {
  const noticeId = typeof item.notice_id === 'string' ? item.notice_id : ''
  const requestId = typeof item.request_id === 'string' ? item.request_id : noticeId
  const messageBody = typeof item.message_body === 'string' ? item.message_body : ''
  const summary = typeof item.summary === 'string' && item.summary.trim() ? item.summary : messageBody

  return {
    notice_id: noticeId,
    request_id: requestId,
    received_at: typeof item.received_at === 'string' ? item.received_at : new Date().toISOString(),
    channel: typeof item.channel === 'string' ? item.channel : 'supervity-ai',
    supplier_id: typeof item.supplier_id === 'number' ? item.supplier_id : 0,
    item_number: typeof item.item_number === 'string' ? item.item_number : 'N/A',
    notice_type: typeof item.notice_type === 'string' ? item.notice_type : 'human_approval',
    message_body: messageBody,
    case_status: typeof item.case_status === 'string' ? item.case_status : 'flagged_pending',
    summary,
    source: 'Supervity AI',
  }
}

export async function GET() {
  try {
    const query = new URLSearchParams({
      select: '*',
      case_status: 'eq.flagged_pending',
      order: 'received_at.desc',
    })

    const response = await fetch(`${SUPABASE_URL}/rest/v1/Disruption%20Notices?${query.toString()}`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const payload = await response.text()

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: payload }, { status: response.status })
    }

    let data: Record<string, unknown>[] = []

    try {
      data = JSON.parse(payload) as Record<string, unknown>[]
    } catch {
      data = []
    }

    return NextResponse.json({
      ok: true,
      data: data.map((item) => normalizePendingItem(item)),
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
