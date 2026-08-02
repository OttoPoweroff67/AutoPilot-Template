import { NextRequest, NextResponse } from 'next/server'
import { callGemini, parseJsonFromGeminiResponse } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = typeof body?.input === 'string' ? body.input.trim() : ''

    if (!input) {
      return NextResponse.json({ ok: false, error: 'A policy description is required.' }, { status: 400 })
    }

    const prompt = `You are an AI policy analyst for an operations platform.
Analyze the following business rule and return valid JSON only.

User input:
${input}

Return JSON with this exact structure:
{
  "suggested_type": "logical" | "natural_language",
  "confidence": 0.0,
  "reason": "short explanation",
  "suggested_name": "policy name",
  "summary": "one-sentence summary",
  "dsl": {
    "conditions": [{"field":"","operator":"eq","value":""}],
    "actions": [{"type":"approve"}],
    "match_mode": "all"
  },
  "refined_instruction": "clear refined instruction",
  "entity_name": "entity or null",
  "suggested_tags": ["tag1", "tag2"]
}

If the rule is simple and clearly operational, prefer logical. Otherwise prefer natural_language.`

    const text = await callGemini(prompt, { temperature: 0.3, maxOutputTokens: 700 })
    const parsed = parseJsonFromGeminiResponse(text)

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ ok: false, error: 'Gemini returned an invalid policy analysis response.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, ...parsed })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
