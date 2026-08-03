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

interface FormItem {
  id: string
  formId: string
  title: string
  description: string
  status: string
  submittedAt: string
  operatorName: string
  source: string
  formUrl: string
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
  const [items, setItems] = useState<FormItem[]>([])
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
        const response = await fetch('/api/ai/workflow/supervity-forms')
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
          throw new Error((payload && typeof payload.error === 'string' ? payload.error : text) || 'Failed to load forms')
        }

        const forms = Array.isArray(payload?.data) ? (payload.data as FormItem[]) : []
        if (isMounted) {
          setItems(forms)
          setDebugInfo(text ? `Loaded ${forms.length} pending form(s)` : 'No forms returned')
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load forms')
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

  const handleDecision = async (formId: string, action: 'approve' | 'reject') => {
    setSubmitting((prev) => ({ ...prev, [formId]: true }))
    try {
      const response = await fetch('/api/ai/workflow/submit-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: formId, action }),
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

      setItems((prev) => prev.filter((item) => item.id !== formId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the decision')
    } finally {
      setSubmitting((prev) => ({ ...prev, [formId]: false }))
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
          Pending Supervity forms waiting for human review.
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.zap className='h-5 w-5 text-brand-cornflower' />
              Supervity Form Queue
            </CardTitle>
            <CardDescription>
              Pending forms from Supervity appear here and can be approved or rejected directly.
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
              <div className='rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground'>No pending forms yet.</div>
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
                        {item.status}
                      </div>
                    </div>

                    <div className='mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
                      <div className='rounded-lg bg-muted/30 p-3 text-sm text-foreground'>
                        <p className='font-medium'>Form details</p>
                        <p className='mt-2 text-sm text-muted-foreground'>
                          Form ID: {item.formId || item.id}
                        </p>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          Submitted: {item.submittedAt || 'n/a'}
                        </p>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          Operator: {item.operatorName || 'pending'}
                        </p>
                        <a className='mt-3 inline-flex text-sm font-medium text-brand-cornflower underline' href={item.formUrl} target='_blank' rel='noreferrer'>
                          Open form in Supervity
                        </a>
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
