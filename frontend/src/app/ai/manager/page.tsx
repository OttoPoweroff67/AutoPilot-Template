'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'

interface WorkflowResult {
  ok: boolean
  workflowId: string
  status: number
  data?: string | Record<string, unknown>
  raw?: string
  error?: string
}

interface WorkflowFormValues {
  workflowId: string
  cfoEmail: string
  slackChannel: string
  onedriveFolderPath: string
  emailSearchQuery: string
}

const defaultValues: WorkflowFormValues = {
  workflowId: '019f7856-f4ce-7000-9a28-d0806318636d',
  cfoEmail: 'joshuaboss1111@gmail.com',
  slackChannel: 'all-tehtariktech',
  onedriveFolderPath: 'https://onedrive.live.com/personal/1ef4fc011579d9f9/Documents/Company%20Ledgers',
  emailSearchQuery: 'joshuang.supervity@hotmail.com',
}

export default function AIManagerPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<WorkflowResult | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<WorkflowFormValues>(defaultValues)

  const updateField = (field: keyof WorkflowFormValues, value: string) => {
    setFormValues((previous) => ({ ...previous, [field]: value }))
  }

  const runWorkflow = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: formValues.workflowId,
          inputs: {
            cfo_email: formValues.cfoEmail,
            slack_channel: formValues.slackChannel,
            onedrive_folder_path: formValues.onedriveFolderPath,
            email_search_query: formValues.emailSearchQuery,
          },
        }),
      })

      const payload = await response.json()
      setResult(payload)
      setLastUpdated(new Date().toLocaleString())
    } catch (error) {
      setResult({ ok: false, workflowId: formValues.workflowId, status: 500, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <motion.div className='space-y-6' initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h1 className='text-display-3 font-bold tracking-tight text-brand-navy'>AI Manager</h1>
          <p className='mt-2 text-lg text-muted-foreground'>Orchestration hub for the live Supervity workflow and agent handoff experience.</p>
        </div>
        <Button variant='gradient' onClick={() => void runWorkflow()} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Agent Workflow'}
        </Button>
      </div>

      <div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.sparkles className='h-5 w-5 text-brand-cornflower' />
              Live Agent Workflow
            </CardTitle>
            <CardDescription>Adjust the workflow inputs before you launch the agent route.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='workflow-id'>Workflow ID</Label>
                <Input id='workflow-id' value={formValues.workflowId} onChange={(event) => updateField('workflowId', event.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='cfo-email'>CFO Email</Label>
                <Input id='cfo-email' value={formValues.cfoEmail} onChange={(event) => updateField('cfoEmail', event.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='slack-channel'>Slack Channel</Label>
                <Input id='slack-channel' value={formValues.slackChannel} onChange={(event) => updateField('slackChannel', event.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='onedrive-folder'>OneDrive Folder</Label>
                <Input id='onedrive-folder' value={formValues.onedriveFolderPath} onChange={(event) => updateField('onedriveFolderPath', event.target.value)} />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email-query'>Email Search Query</Label>
              <Input id='email-query' value={formValues.emailSearchQuery} onChange={(event) => updateField('emailSearchQuery', event.target.value)} />
            </div>

            {result && (
              <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800'>
                <p className='font-semibold'>Last run</p>
                <p className='mt-1'>Status: {result.ok ? 'success' : 'error'} • {result.status}</p>
                {lastUpdated && <p className='mt-1 text-xs'>Updated: {lastUpdated}</p>}
                <pre className='mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs'>{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.brain className='h-5 w-5 text-brand-cornflower' />
              Agent Capabilities
            </CardTitle>
            <CardDescription>Core specialist functions available to the orchestration layer.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {[
              { name: 'Workflow Orchestrator', role: 'Routes and coordinates the live agent workflow' },
              { name: 'Human Review Hand-off', role: 'Escalates flagged decisions to the Workbench' },
              { name: 'Supabase Context Layer', role: 'Reads and stores live operational context' },
              { name: 'Decision Feedback Loop', role: 'Captures approvals and rejections for learning' },
            ].map((capability) => (
              <div key={capability.name} className='rounded-lg border border-border/70 p-3'>
                <p className='font-medium text-foreground'>{capability.name}</p>
                <p className='mt-1 text-sm text-muted-foreground'>{capability.role}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
