type ApprovalCandidate = {
  actionUrl: string
  title: string
  description: string
  workflowId: string
  requestId: string
  source: string
}

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

export function extractApprovalFromPayload(payload: unknown, workflowId: string, rawText = ''): ApprovalCandidate | null {
  const seen = new Set<unknown>()
  const stack: unknown[] = [payload]

  while (stack.length > 0) {
    const current = stack.pop()
    if (current === null || current === undefined) continue
    if (typeof current === 'string') {
      const trimmed = current.trim()
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return {
          actionUrl: trimmed.replace(/[),.;]+$/, ''),
          title: 'Supervity approval request',
          description: 'Waiting for human decision',
          workflowId,
          requestId: '',
          source: 'Supervity AI',
        }
      }
      continue
    }

    if (typeof current === 'object') {
      if (seen.has(current)) continue
      seen.add(current)
      const record = current as Record<string, unknown>

      const actionUrl = [
        'action_url',
        'actionUrl',
        'approval_url',
        'approvalUrl',
        'actionURL',
        'approvalURL',
        'approvalLink',
        'actionLink',
        'reviewUrl',
        'decisionUrl',
        'redirectUrl',
        'link',
        'url',
      ]
        .map((key) => (typeof record[key] === 'string' ? record[key].trim() : ''))
        .find((value) => value.startsWith('http://') || value.startsWith('https://')) || ''

      if (actionUrl) {
        return {
          actionUrl: actionUrl.replace(/[),.;]+$/, ''),
          title:
            getStringValue(record, ['title', 'name', 'subject', 'summary']) || 'Supervity approval request',
          description:
            getStringValue(record, ['description', 'message', 'summary', 'detail']) || 'Waiting for human decision',
          workflowId,
          requestId:
            getStringValue(record, ['request_id', 'requestId', 'request_id', 'id']) || '',
          source: 'Supervity AI',
        }
      }

      Object.values(record).forEach((value) => stack.push(value))
    }
  }

  if (rawText) {
    const match = rawText.match(/https?:\/\/[^\s"'<>]+/g)
    if (match?.length) {
      const url = match[0].replace(/[),.;]+$/, '')
      return {
        actionUrl: url,
        title: 'Supervity approval request',
        description: 'Waiting for human decision',
        workflowId,
        requestId: '',
        source: 'Supervity AI',
      }
    }
  }

  return null
}
