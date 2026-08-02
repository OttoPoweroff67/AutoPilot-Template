import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim()

function buildPrompt(message: string, history: Array<{ role: string; content: string }>, context?: { page?: string }) {
  const recentHistory = history.slice(-6).map((entry) => `${entry.role}: ${entry.content}`).join('\n')
  const pageContext = context?.page ? `\nCurrent page: ${context.page}` : ''

  return `You are Assistant, a helpful AI copilot for an operations dashboard.\nRespond concisely and use the current page context when relevant.\n${pageContext}\n\nConversation:\n${recentHistory}\n\nUser: ${message}\nAssistant:`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body?.message === 'string' ? body.message : ''
    const history = Array.isArray(body?.history) ? body.history : []
    const context = body?.context && typeof body.context === 'object' ? body.context : {}

    if (!message.trim()) {
      return NextResponse.json({ ok: false, error: 'A message is required.' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Gemini API key is not configured. Add GEMINI_API_KEY to your environment and restart the app.' },
        { status: 500 }
      )
    }

    const prompt = buildPrompt(message, history, context)

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 400,
        },
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = payload?.error?.message || 'Gemini request failed.'
      return NextResponse.json({ ok: false, error: message }, { status: response.status })
    }

    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.'

    return NextResponse.json({ ok: true, response: text })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
