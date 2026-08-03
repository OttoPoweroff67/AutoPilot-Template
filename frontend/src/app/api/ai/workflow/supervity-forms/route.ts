import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SUPERVITY_BASE_URL = process.env.SUPERVITY_BASE_URL || 'https://auto.supervity.ai'
const SUPERVITY_FORM_ID = process.env.SUPERVITY_FORM_ID || '019f7856-f4ce-7000-9a28-d0806318636d'
const SUPERVITY_API_TOKEN = process.env.WORKFLOW_API_BEARER_TOKEN || process.env.SUPERVITY_API_TOKEN || ''
const FALLBACK_FORMS = [
  {
    id: 'fallback-form-1',
    formId: SUPERVITY_FORM_ID,
    status: 'pending',
    title: 'Pending Supervity approval',
    description: 'A pending approval is available in Supervity. The upstream API rejected the request, so this item is shown as a fallback placeholder.',
    submittedAt: new Date().toISOString(),
    operatorName: 'pending',
    source: 'Supervity AI',
    formUrl: `${SUPERVITY_BASE_URL}/u/user-forms/${SUPERVITY_FORM_ID}`,
  },
]

function normalizeFormItem(item: Record<string, unknown>) {
  const id = typeof item.id === 'string' ? item.id : ''
  const formId = typeof item.form_id === 'string' ? item.form_id : id
  const activityRunId = typeof item.activity_run_id === 'string' ? item.activity_run_id : formId
  const status = typeof item.status === 'string' ? item.status : 'pending'
  const title = typeof item.title === 'string' ? item.title : 'Supervity approval request'
  const description = typeof item.description === 'string' ? item.description : ''
  const submittedAt = typeof item.submitted_at === 'string' ? item.submitted_at : ''
  const operatorName = typeof item.operator_name === 'string' ? item.operator_name : ''

  return {
    id: activityRunId || id,
    formId: formId || id,
    status,
    title,
    description,
    submittedAt,
    operatorName,
    source: 'Supervity AI',
    formUrl: `${SUPERVITY_BASE_URL}/u/user-forms/${formId || SUPERVITY_FORM_ID}?status=${encodeURIComponent(status)}&operatorName=${encodeURIComponent(operatorName || 'pending')}`,
  }
}

export async function GET() {
  try {
    const url = `${SUPERVITY_BASE_URL}/api/v1/user-forms`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(SUPERVITY_API_TOKEN ? { Authorization: `Bearer ${SUPERVITY_API_TOKEN}` } : {}),
      },
      cache: 'no-store',
    })

    const payloadText = await response.text()

    if (!response.ok) {
      return NextResponse.json({
        ok: true,
        data: FALLBACK_FORMS,
        warning: payloadText || 'Supervity forms endpoint did not return a valid response',
      })
    }

    let data: unknown = []
    try {
      data = JSON.parse(payloadText)
    } catch {
      data = []
    }

    if (Array.isArray(data)) {
      return NextResponse.json({ ok: true, data: data.map((item) => normalizeFormItem(item as Record<string, unknown>)) })
    }

    if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).items)) {
      return NextResponse.json({ ok: true, data: ((data as Record<string, unknown>).items as unknown[]).map((item) => normalizeFormItem(item as Record<string, unknown>)) })
    }

    return NextResponse.json({ ok: true, data: [normalizeFormItem(data as Record<string, unknown>)] })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
