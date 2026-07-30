import { NextRequest, NextResponse } from 'next/server'

const WORKFLOW_ENDPOINT = process.env.WORKFLOW_API_URL || 'https://auto-workflow-api.supervity.ai/api/v1/workflow-runs/execute/stream'
const WORKFLOW_ID = process.env.WORKFLOW_ID || '019f7856-f4ce-7000-9a28-d0806318636d'
const AUTH_TOKEN = process.env.WORKFLOW_API_BEARER_TOKEN || ''
const WORKFLOW_SOURCE = process.env.WORKFLOW_API_SOURCE || 'external'
const WORKFLOW_TIMEZONE = process.env.WORKFLOW_API_TIMEZONE || 'Asia/Kuala_Lumpur'

function normalizeWorkflowPayload(body: unknown) {
  const source = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const workflowId = typeof source.workflowId === 'string' ? source.workflowId : WORKFLOW_ID
  const inputs = typeof source.inputs === 'object' && source.inputs !== null ? source.inputs as Record<string, unknown> : {}

  return {
    workflowId,
    inputs: {
      cfo_email: inputs.cfo_email ?? inputs.cfoEmail ?? '',
      slack_channel: inputs.slack_channel ?? inputs.slackChannel ?? '',
      onedrive_folder_path: inputs.onedrive_folder_path ?? inputs.onedriveFolderPath ?? '',
      email_search_query: inputs.email_search_query ?? inputs.emailSearchQuery ?? '',
    },
  }
}

async function extractWorkflowRequestPayload(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null)
    return normalizeWorkflowPayload(body)
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData().catch(() => null)
    if (!formData) return { workflowId: WORKFLOW_ID, inputs: {} }

    const workflowId = formData.get('workflowId')?.toString() || WORKFLOW_ID
    const inputs: Record<string, string> = {}

    formData.forEach((value, key) => {
      if (key.startsWith('inputs[') && key.endsWith(']')) {
        const inputKey = key.slice('inputs['.length, -1)
        if (typeof value === 'string') {
          inputs[inputKey] = value
        }
      }
    })

    return {
      workflowId,
      inputs: {
        cfo_email: inputs.cfo_email || '',
        slack_channel: inputs.slack_channel || '',
        onedrive_folder_path: inputs.onedrive_folder_path || '',
        email_search_query: inputs.email_search_query || '',
      },
    }
  }

  return { workflowId: WORKFLOW_ID, inputs: {} }
}

function parseWorkflowResponse(raw: string, contentType: string | null) {
  if (!raw) return null

  if (contentType?.includes('application/json')) {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }

  if (contentType?.includes('text/event-stream') || raw.includes('event:') || raw.includes('data:')) {
    const lines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const dataLines = lines.filter((line) => line.startsWith('data:'))
    if (dataLines.length) {
      return dataLines[dataLines.length - 1].replace(/^data:\s*/, '')
    }
  }

  return raw
}

export async function POST(request: NextRequest) {
  try {
    const { workflowId, inputs } = await extractWorkflowRequestPayload(request)

    const formData = new FormData()
    formData.append('workflowId', workflowId)

    Object.entries(inputs).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(`inputs[${key}]`, String(value))
      }
    })

    const upstreamResponse = await fetch(WORKFLOW_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'x-source': WORKFLOW_SOURCE,
        'x-user-timezone': WORKFLOW_TIMEZONE,
      },
      body: formData,
    })

    const contentType = upstreamResponse.headers.get('content-type')
    const rawText = await upstreamResponse.text()
    const parsedPayload = parseWorkflowResponse(rawText, contentType)

    let supabaseResult: unknown = null
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabaseResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/agent_runs`,
          {
            method: 'POST',
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({
              workflow_id: workflowId,
              payload: inputs,
              status: upstreamResponse.ok ? 'success' : 'error',
              result: parsedPayload,
              created_at: new Date().toISOString(),
            }),
          }
        )

        if (!supabaseResponse.ok) {
          const supabaseText = await supabaseResponse.text().catch(() => '')
          supabaseResult = { ok: false, message: supabaseText.slice(0, 500) }
        } else {
          supabaseResult = { ok: true }
        }
      } catch (error) {
        supabaseResult = { ok: false, message: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    return NextResponse.json({
      ok: upstreamResponse.ok,
      workflowId,
      inputs,
      status: upstreamResponse.status,
      data: parsedPayload,
      raw: rawText.slice(0, 4000),
      supabase: supabaseResult,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
