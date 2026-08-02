import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ ok: false, error: 'A message is required.' }, { status: 400 })
    }

    const prompt = `You are a helpful assistant for the AutoPilot command center.
Answer the user's request clearly and concisely.

User: ${message}
Assistant:`

    const text = await callGemini(prompt, { temperature: 0.7, maxOutputTokens: 400 })

    return NextResponse.json({ ok: true, text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
