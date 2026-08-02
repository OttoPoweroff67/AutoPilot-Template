import { NextRequest, NextResponse } from 'next/server'
import { getApproval, removeApproval } from '../approval-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const approvalId = typeof body?.approval_id === 'string' ? body.approval_id : ''
    const action = typeof body?.action === 'string' ? body.action : 'approve'

    const item = approvalId ? getApproval(approvalId) : null
    if (!item) {
      return NextResponse.json({ ok: false, error: 'Approval request not found' }, { status: 404 })
    }

    const upstreamResponse = await fetch(item.actionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    const rawText = await upstreamResponse.text()

    if (upstreamResponse.ok) {
      removeApproval(approvalId)
    }

    return NextResponse.json({
      ok: upstreamResponse.ok,
      approvalId,
      action,
      status: upstreamResponse.status,
      data: rawText,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
