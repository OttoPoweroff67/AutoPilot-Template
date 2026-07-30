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

interface PendingNotice {
  notice_id: string
  received_at: string
  channel: string
  supplier_id: number
  item_number: string
  notice_type: string
  message_body: string
  case_status: string
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
  const [items, setItems] = useState<PendingNotice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadPending() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/supabase/disruption-notices/pending')
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load pending items')
        }
        setItems(payload.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pending items')
      } finally {
        setLoading(false)
      }
    }

    void loadPending()
  }, [])

  const submitDecision = async (noticeId: string, decision: 'approve' | 'reject') => {
    setSubmitting((prev) => ({ ...prev, [noticeId]: true }))
    try {
      const response = await fetch('/api/ai/workflow/human-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noticeId,
          decision,
          message: feedback[noticeId] || `Human ${decision}d the workbench item`,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Could not send the decision')
      }

      setItems((prev) => prev.filter((item) => item.notice_id !== noticeId))
      setFeedback((prev) => {
        const next = { ...prev }
        delete next[noticeId]
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the decision')
    } finally {
      setSubmitting((prev) => ({ ...prev, [noticeId]: false }))
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
          Human review queue for flagged AI recommendations and workflow interventions.
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.zap className='h-5 w-5 text-brand-cornflower' />
              Pending Human Decisions
            </CardTitle>
            <CardDescription>
              Review the full context, then approve or reject the recommendation for the Supervity agent.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {loading ? (
              <div className='rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground'>Loading pending items...</div>
            ) : error ? (
              <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>{error}</div>
            ) : items.length === 0 ? (
              <div className='rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground'>No flagged items are waiting for review.</div>
            ) : (
              <div className='space-y-4'>
                {items.map((item) => (
                  <div key={item.notice_id} className='rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm'>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div>
                        <p className='text-sm font-semibold text-brand-navy'>{item.notice_id}</p>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {item.item_number} • {item.notice_type} • {item.channel}
                        </p>
                      </div>
                      <div className='rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700'>
                        {item.case_status}
                      </div>
                    </div>

                    <div className='mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
                      <div className='rounded-lg bg-muted/30 p-3 text-sm text-foreground'>
                        <p className='font-medium'>Context</p>
                        <p className='mt-2 whitespace-pre-wrap text-sm text-muted-foreground'>{item.message_body}</p>
                        <div className='mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3'>
                          <div><span className='font-medium text-foreground'>Received:</span> {item.received_at}</div>
                          <div><span className='font-medium text-foreground'>Supplier:</span> {item.supplier_id}</div>
                          <div><span className='font-medium text-foreground'>Status:</span> {item.case_status}</div>
                        </div>
                      </div>

                      <div className='space-y-3'>
                        <label className='text-sm font-medium text-foreground'>Operator feedback</label>
                        <textarea
                          className='min-h-24 w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-brand-cornflower'
                          value={feedback[item.notice_id] || ''}
                          onChange={(event) => setFeedback((prev) => ({ ...prev, [item.notice_id]: event.target.value }))}
                          placeholder='Add notes for the agent or explain the decision...'
                        />
                        <div className='flex flex-wrap gap-2'>
                          <Button
                            variant='gradient'
                            size='sm'
                            onClick={() => void submitDecision(item.notice_id, 'approve')}
                            disabled={submitting[item.notice_id]}
                          >
                            {submitting[item.notice_id] ? 'Sending...' : 'Approve'}
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => void submitDecision(item.notice_id, 'reject')}
                            disabled={submitting[item.notice_id]}
                          >
                            {submitting[item.notice_id] ? 'Sending...' : 'Reject'}
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
