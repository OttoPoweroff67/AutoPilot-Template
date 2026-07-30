'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'

interface DisruptionNotice {
  notice_id: string
  received_at: string
  channel: string
  supplier_id: number
  item_number: string
  notice_type: string
  message_body: string
  case_status: string
}

export default function LiveDatabasePage() {
  const [rows, setRows] = useState<DisruptionNotice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRows() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/supabase/disruption-notices')
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load Supabase records')
        }

        setRows(payload.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Supabase records')
      } finally {
        setLoading(false)
      }
    }

    void loadRows()
  }, [])

  return (
    <motion.div className='space-y-6' initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h1 className='text-display-3 font-bold tracking-tight text-brand-navy'>Live Database</h1>
          <p className='mt-2 text-lg text-muted-foreground'>Viewing Supabase table records for Disruption Notices.</p>
        </div>
        <Button variant='gradient' onClick={() => window.location.reload()}>
          <Icons.refresh className='mr-2 h-4 w-4' />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.database className='h-5 w-5 text-brand-cornflower' />
            Disruption Notices
          </CardTitle>
          <CardDescription>Live data from your Supabase project.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground'>Loading rows...</div>
          ) : error ? (
            <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>{error}</div>
          ) : rows.length === 0 ? (
            <div className='rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground'>No rows found in the table.</div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-border text-sm'>
                <thead>
                  <tr className='text-left text-muted-foreground'>
                    <th className='px-3 py-2'>Notice ID</th>
                    <th className='px-3 py-2'>Received At</th>
                    <th className='px-3 py-2'>Channel</th>
                    <th className='px-3 py-2'>Supplier</th>
                    <th className='px-3 py-2'>Item</th>
                    <th className='px-3 py-2'>Type</th>
                    <th className='px-3 py-2'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {rows.map((row) => (
                    <tr key={row.notice_id} className='align-top'>
                      <td className='px-3 py-2 font-medium text-brand-navy'>{row.notice_id}</td>
                      <td className='px-3 py-2'>{row.received_at}</td>
                      <td className='px-3 py-2'>{row.channel}</td>
                      <td className='px-3 py-2'>{row.supplier_id}</td>
                      <td className='px-3 py-2'>{row.item_number}</td>
                      <td className='px-3 py-2'>{row.notice_type}</td>
                      <td className='px-3 py-2'>{row.case_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
