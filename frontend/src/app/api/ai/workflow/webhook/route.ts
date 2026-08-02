import { NextRequest, NextResponse } from 'next/server'
import { listApprovals, upsertApproval } from '../approval-store'

function getStringValue(value: unknown, keys: string[]): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of keys) {
      const candidate = record[key]
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate
      }
    }

    for (const key of keys) {
      const nested = record[key]
      if (nested && typeof nested === 'object') {
        const nestedString = getStringValue(nested, keys)
        if (nestedString) {
          return nestedString
        }
      }
    }
  }
  return ''
}

export async function GET() {
  return NextResponse.json({ ok: true, approvals: listApprovals() })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const actionUrl = getStringValue(body, ['action_url', 'actionUrl', 'approval_url', 'approvalUrl', 'url'])
    const title = getStringValue(body, ['title', 'name']) || 'Supervity approval request'
    const description = getStringValue(body, ['description', 'message', 'summary']) || 'Waiting for human decision'
    const workflowId = getStringValue(body, ['workflow_id', 'workflowId', 'workflow'])
    const requestId = getStringValue(body, ['request_id', 'requestId', 'id'])

    if (!actionUrl) {
      return NextResponse.json({ ok: false, error: 'Missing action_url in webhook payload' }, { status: 400 })
    }

    const item = upsertApproval({
      actionUrl,
      title,
      description,
      workflowId,
      requestId,
    })

    return NextResponse.json({ ok: true, item, approvals: listApprovals() })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
