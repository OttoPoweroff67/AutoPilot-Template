import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SUPERVITY_BASE_URL = process.env.SUPERVITY_BASE_URL || 'https://auto.supervity.ai'
const SUPERVITY_FORM_ID = process.env.SUPERVITY_FORM_ID || '019fc0a4-388c-7000-b953-8ca021852ade'
const SUPERVITY_API_TOKEN = process.env.SUPERVITY_API_TOKEN || ''

function normalizeFormItem(item: Record<string, unknown>) {
  const id = typeof item.id === 'string' ? item.id : ''
  const status = typeof item.status === 'string' ? item.status : 'pending'
  const title = typeof item.title === 'string' ? item.title : 'Supervity approval request'
  const description = typeof item.description === 'string' ? item.description : ''
  const submittedAt = typeof item.submitted_at === 'string' ? item.submitted_at : ''
  const operatorName = typeof item.operator_name === 'string' ? item.operator_name : ''

  return {
    id,
    status,
    title,
    description,
    submittedAt,
    operatorName,
    source: 'Supervity AI',
    url: `${SUPERVITY_BASE_URL}/u/user-forms/${SUPERVITY_FORM_ID}?status=${encodeURIComponent(status)}&operatorName=${encodeURIComponent(operatorName || 'pending')}`,
  }
}

export async function GET() {
  try {
    const url = `${SUPERVITY_BASE_URL}/api/user-forms/${SUPERVITY_FORM_ID}?status=pending`

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
      return NextResponse.json({ ok: false, error: payloadText || 'Failed to load Supervity form queue' }, { status: response.status })
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
