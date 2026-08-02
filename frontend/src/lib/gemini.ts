const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim()
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface GeminiCallOptions {
  temperature?: number
  maxOutputTokens?: number
}

export async function callGemini(prompt: string, options: GeminiCallOptions = {}) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Add GEMINI_API_KEY to your environment and restart the app.')
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        topP: 0.9,
        maxOutputTokens: options.maxOutputTokens ?? 400,
      },
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Gemini request failed.')
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

  if (!text) {
    throw new Error('Gemini returned an empty response.')
  }

  return text
}

export function parseJsonFromGeminiResponse(text: string) {
  const cleaned = text.trim()

  if (!cleaned) return null

  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const payload = fenced ? fenced[1] : cleaned

  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}
