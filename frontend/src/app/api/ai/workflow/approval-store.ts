import { randomUUID } from 'crypto'

export interface PendingApprovalItem {
  id: string
  title: string
  description: string
  actionUrl: string
  workflowId?: string
  requestId?: string
  source: string
  createdAt: string
  status: 'pending'
}

const approvals = new Map<string, PendingApprovalItem>()

function createItem(input: Partial<PendingApprovalItem> & Pick<PendingApprovalItem, 'actionUrl'>) {
  const id = input.id || randomUUID()
  const createdAt = new Date().toISOString()
  const item: PendingApprovalItem = {
    id,
    title: input.title || 'Supervity approval request',
    description: input.description || 'Waiting for human decision',
    actionUrl: input.actionUrl,
    workflowId: input.workflowId,
    requestId: input.requestId,
    source: input.source || 'Supervity AI',
    createdAt,
    status: 'pending',
  }

  approvals.set(id, item)
  return item
}

export function upsertApproval(input: Partial<PendingApprovalItem> & Pick<PendingApprovalItem, 'actionUrl'>) {
  return createItem(input)
}

export function listApprovals() {
  return Array.from(approvals.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getApproval(id: string) {
  return approvals.get(id)
}

export function removeApproval(id: string) {
  approvals.delete(id)
}
