import { NextRequest, NextResponse } from 'next/server'

const WORKFLOW_ENDPOINT = process.env.WORKFLOW_API_URL || 'https://auto-workflow-api.supervity.ai/api/v1/workflow-runs/execute/stream'
const WORKFLOW_ID = process.env.WORKFLOW_ID || '019f7856-f4ce-7000-9a28-d0806318636d'
const AUTH_TOKEN = process.env.WORKFLOW_API_BEARER_TOKEN || ''
const WORKFLOW_SOURCE = process.env.WORKFLOW_API_SOURCE || 'external'
const WORKFLOW_TIMEZONE = process.env.WORKFLOW_API_TIMEZONE || 'Asia/Kuala_Lumpur'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const decision = typeof body?.decision === 'string' ? body.decision : 'approve'
    const noticeId = typeof body?.noticeId === 'string' ? body.noticeId : ''
    const message = typeof body?.message === 'string' ? body.message : ''

    const formData = new FormData()
    formData.append('workflowId', WORKFLOW_ID)
    formData.append('inputs[decision]', decision)
    formData.append('inputs[notice_id]', noticeId)
    formData.append('inputs[human_feedback]', message)
    formData.append('inputs[source]', 'human_workbench')

    const upstreamResponse = await fetch(WORKFLOW_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'x-source': WORKFLOW_SOURCE,
        'x-user-timezone': WORKFLOW_TIMEZONE,
      },
      body: formData,
    })

    const rawText = await upstreamResponse.text()

    return NextResponse.json({
      ok: upstreamResponse.ok,
      decision,
      noticeId,
      status: upstreamResponse.status,
      data: rawText,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
