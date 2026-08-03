import { NextRequest, NextResponse } from 'next/server'

const SUPERVITY_BASE_URL = process.env.SUPERVITY_BASE_URL || 'https://auto.supervity.ai'
const SUPERVITY_API_TOKEN = process.env.WORKFLOW_API_BEARER_TOKEN || process.env.SUPERVITY_API_TOKEN || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const formId = typeof body?.form_id === 'string' ? body.form_id : ''
    const action = typeof body?.action === 'string' && ['approved', 'rejected'].includes(body.action) ? body.action : 'approved'

    if (!formId) {
      return NextResponse.json({ ok: false, error: 'Missing form_id' }, { status: 400 })
    }

    const response = await fetch(`${SUPERVITY_BASE_URL}/api/v1/user-forms/${formId}/${action}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPERVITY_API_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ action }),
      cache: 'no-store',
    })

    const text = await response.text()
    return NextResponse.json({ ok: response.ok, status: response.status, data: text })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
