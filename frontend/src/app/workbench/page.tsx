'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

interface ApprovalItem {
  id: string
  title: string
  description: string
  actionUrl: string
  source: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function WorkbenchPage() {
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    async function loadPending() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/ai/workflow/webhook')
        const text = await response.text()
        let payload: Record<string, unknown> | null = null

        if (text) {
          try {
            payload = JSON.parse(text) as Record<string, unknown>
          } catch {
            payload = null
          }
        }

        if (!response.ok) {
          throw new Error((payload && typeof payload.error === 'string' ? payload.error : text) || 'Failed to load approvals')
        }

        const approvals = Array.isArray((payload && payload.approvals) ? payload.approvals : []) ? ((payload && payload.approvals) as ApprovalItem[]) : []
        if (isMounted) {
          setItems(approvals)
          setDebugInfo(text ? `Webhook returned ${approvals.length} approval item(s)` : 'No body returned from webhook')
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load approvals')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadPending()
    const intervalId = window.setInterval(() => {
      void loadPending()
    }, 5000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const handleDecision = async (approvalId: string, action: 'approve' | 'reject') => {
    setSubmitting((prev) => ({ ...prev, [approvalId]: true }))
    try {
      const response = await fetch('/api/ai/workflow/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_id: approvalId, action }),
      })

      const text = await response.text()
      let payload: Record<string, unknown> | null = null

      if (text) {
        try {
          payload = JSON.parse(text) as Record<string, unknown>
        } catch {
          payload = null
        }
      }

      if (!response.ok || !(payload && payload.ok)) {
        throw new Error((payload && typeof payload.error === 'string' ? payload.error : text) || 'Could not send the decision')
      }

      setItems((prev) => prev.filter((item) => item.id !== approvalId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the decision')
    } finally {
      setSubmitting((prev) => ({ ...prev, [approvalId]: false }))
    }
  }

  return (
    <motion.div
      className='space-y-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <motion.div variants={itemVariants}>
        <h1 className='text-display-3 font-bold tracking-tight text-brand-navy'>
          Workbench
        </h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          Human approvals that arrive from the Supervity workflow webhook.
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.zap className='h-5 w-5 text-brand-cornflower' />
              Supervity Approval Queue
            </CardTitle>
            <CardDescription>
              When Supervity sends a webhook with an action URL, it appears here and you can approve or reject it directly.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {debugInfo ? (
              <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700'>{debugInfo}</div>
            ) : null}
            {loading ? (
              <div className='rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground'>Loading approval requests...</div>
            ) : error ? (
              <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>{error}</div>
            ) : items.length === 0 ? (
              <div className='rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground'>No pending approval requests yet.</div>
            ) : (
              <div className='space-y-4'>
                {items.map((item) => (
                  <div key={item.id} className='rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm'>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div>
                        <p className='text-sm font-semibold text-brand-navy'>{item.title}</p>
                        <p className='mt-1 text-sm text-muted-foreground'>{item.description}</p>
                      </div>
                      <div className='rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700'>
                        Pending
                      </div>
                    </div>

                    <div className='mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
                      <div className='rounded-lg bg-muted/30 p-3 text-sm text-foreground'>
                        <p className='font-medium'>Approval payload</p>
                        <p className='mt-2 whitespace-pre-wrap text-sm text-muted-foreground'>
                          This approval was delivered from {item.source}. When you press a decision below, the app will POST {JSON.stringify({ action: 'approve' })} or {JSON.stringify({ action: 'reject' })} to the action URL supplied by Supervity.
                        </p>
                      </div>

                      <div className='space-y-3'>
                        <div className='flex flex-wrap gap-2'>
                          <Button
                            variant='gradient'
                            size='sm'
                            onClick={() => void handleDecision(item.id, 'approve')}
                            disabled={submitting[item.id]}
                          >
                            {submitting[item.id] ? 'Sending...' : 'Approve'}
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => void handleDecision(item.id, 'reject')}
                            disabled={submitting[item.id]}
                          >
                            {submitting[item.id] ? 'Sending...' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
