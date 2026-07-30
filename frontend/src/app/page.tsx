'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import apiClient from '@/lib/api-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardWatermark } from '@/components/ui/card-watermark'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

// Animated number component
function AnimatedNumber({
  value,
  suffix = '',
  duration = 1000,
}: {
  value: number
  suffix?: string
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  useEffect(() => {
    if (!isInView) return

    setDisplayValue(0)

    const startTime = performance.now()
    let frameId = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(2, -10 * progress)

      setDisplayValue(Math.round(eased * value))

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [value, duration, isInView])

  const formatValue = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <span ref={ref}>
      {formatValue(displayValue)}
      {suffix}
    </span>
  )
}

// Stats Card Component with Bento styling
interface StatCardProps {
  title: string
  value: number | string
  suffix?: string
  icon: React.ElementType
  trend?: { value: string; positive: boolean }
  colorClass: string
  delay?: number
  subtitle?: string
}

function StatCard({
  title,
  value,
  suffix = '',
  icon: Icon,
  trend,
  colorClass,
  delay = 0,
  subtitle,
}: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      initial='hidden'
      animate='visible'
      transition={{ delay }}
      whileHover={{ y: -4 }}
    >
      <Card className='group relative h-full cursor-default overflow-hidden'>
        {/* Branded watermark texture */}
        <CardWatermark opacity={3} scale={0.9} />
        <CardContent className='relative z-10 p-5'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              {/* Micro label */}
              <p className='text-micro uppercase text-brand-muted transition-colors duration-200 group-hover:text-brand-cornflower'>
                {title}
              </p>
              {/* Display number */}
              <p className='font-display text-[2.25rem] font-bold leading-none tracking-tight text-brand-navy'>
                {typeof value === 'number' ? <AnimatedNumber value={value} suffix={suffix} /> : value}
              </p>
              {subtitle && (
                <p className='text-xs text-muted-foreground'>{subtitle}</p>
              )}
              {/* Trend */}
              {trend && (
                <motion.p
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    trend.positive ? 'text-emerald-600' : 'text-red-500'
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3 }}
                >
                  {trend.positive ? (
                    <Icons.trendingUp className='h-3 w-3' strokeWidth={2} />
                  ) : (
                    <Icons.trendingUp
                      className='h-3 w-3 rotate-180'
                      strokeWidth={2}
                    />
                  )}
                  {trend.value}
                </motion.p>
              )}
            </div>
            {/* Icon */}
            <motion.div
              className={cn(
                'rounded-xl p-2.5 text-white',
                'shadow-lg',
                colorClass
              )}
              whileHover={{ scale: 1.15, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Icon className='h-5 w-5' strokeWidth={1.5} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Hero Section
function HeroSection({ userName }: { userName?: string }) {
  const firstName = userName?.split(' ')[0] || 'there'

  return (
    <motion.div
      className='col-span-12 py-2'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <h1 className='text-display-3 font-bold tracking-tight text-brand-navy lg:text-display-2'>
        Where Intelligence <br className='hidden sm:block' />
        <span className='text-gradient'>Meets Human.</span>
      </h1>
      <p className='mt-4 text-lg font-light text-muted-foreground'>
        Welcome back, {firstName}. Your AI Command Center is ready.
      </p>
    </motion.div>
  )
}

function AutonomousOperatorsCard() {
  const operators = [
    {
      name: 'Orchestrator (BOSS)',
      status: 'Scheduled',
      description: 'Runs Impact Assessment Operator (IAO) to evaluate supply chain disruptions & generate markdown impact.',
      badge: 'Operator #0',
    },
    {
      name: 'Overwatch Operator (OO)',
      status: 'Ready',
      description: 'Scans Microsoft Outlook for unread disruption notices and uses AI to extract supplier ID, item number, and description.',
      badge: 'Operator #1',
    },
    {
      name: 'Impact Assessment Operator (IAO)',
      status: 'Ready',
      description: 'Continuously monitors disruption_notices Supabase table for unhandled items. Isolates critical issues.',
      badge: 'Operator #2',
    },
    {
      name: 'Alternative Sourcing Operator (ASO)',
      status: 'Ready',
      description: 'Parses issue reports, checks contract terms, evaluates stock buffers, and finds backup suppliers.',
      badge: 'Operator #3',
    },
    {
      name: 'Communications Operator (CO)',
      status: 'Ready',
      description: 'Reads uploaded Markdown file, checks if manual approval needed, and routes to human approver via Slack.',
      badge: 'Operator #4',
    },
    {
      name: 'Financial Operator (FO)',
      status: 'Ready',
      description: 'Processes Markdown detailing supplier changes, uses AI to extract details, generates insights and PDFs.',
      badge: 'Operator #5',
    },
  ]

  return (
    <Card className='relative col-span-12 overflow-hidden'>
      <CardWatermark opacity={3} scale={1.05} />
      <CardHeader className='relative z-10'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Icons.users className='h-5 w-5 text-brand-cornflower' strokeWidth={1.5} />
              My Autonomous Operators (6 Total)
            </CardTitle>
            <p className='mt-2 text-sm text-muted-foreground'>
              6 / 6 Ready • Manage AI operators, adjust workgraphs, and view their real-time execution status.
            </p>
          </div>
          <Link href='/ai/manager'>
            <Button variant='gradient' size='sm'>
              Open AI Manager
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className='relative z-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {operators.map((operator) => (
          <div
            key={operator.name}
            className='rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm'
          >
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-sm font-semibold text-foreground'>{operator.name}</p>
                <p className='mt-1 text-xs font-medium uppercase tracking-wide text-emerald-600'>
                  {operator.status}
                </p>
              </div>
              <span className='rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
                {operator.badge}
              </span>
            </div>
            <p className='mt-3 text-sm leading-6 text-muted-foreground'>
              {operator.description}
            </p>
            <div className='mt-4 flex items-center justify-between text-sm'>
              <span className='font-medium text-brand-navy'>Automated Workgraph</span>
              <Icons.arrowRight className='h-4 w-4 text-brand-cornflower' strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Main Dashboard — no auth required, renders directly
export default function HomePage() {
  const [liveStats, setLiveStats] = useState<{
    accomplishedCases: number
    solvedPercentage: number
    totalNotices: number
    autonomousOperators: string[]
  } | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  const fetchLiveStats = useCallback(async () => {
    try {
      const response = await fetch('/api/supabase/dashboard-stats')
      const payload = await response.json()

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Unable to load live dashboard metrics')
      }

      setLiveStats(payload.data)
      setStatsError(null)
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : 'Unable to load live dashboard metrics')
    }
  }, [])

  useEffect(() => {
    void fetchLiveStats()
    const interval = window.setInterval(() => {
      void fetchLiveStats()
    }, 30000)

    return () => window.clearInterval(interval)
  }, [fetchLiveStats])

  const stats = liveStats ?? {
    accomplishedCases: 0,
    solvedPercentage: 0,
    totalNotices: 0,
    autonomousOperators: ['BOSS', 'OO', 'IAO', 'ASO', 'CO', 'FO'],
  }

  return (
    <motion.div
      className='space-y-6'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Hero Section */}
      <HeroSection userName='Developer' />

      {/* Stats Grid - Bento style */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard
          title='Accomplished Cases'
          value={stats.accomplishedCases}
          icon={Icons.checkCircle}
          trend={{ value: 'Live Supabase', positive: true }}
          colorClass='bg-brand-navy'
          delay={0.1}
        />
        <StatCard
          title='Percentage of Disruption Solved'
          value={stats.solvedPercentage}
          suffix='%'
          icon={Icons.activity}
          trend={{ value: 'Live data', positive: true }}
          colorClass='bg-brand-cornflower'
          delay={0.2}
        />
        <StatCard
          title='Autonomous Operators'
          value={stats.autonomousOperators.join(' • ')}
          icon={Icons.users}
          trend={{ value: '6 operators', positive: true }}
          colorClass='bg-brand-purple'
          delay={0.3}
          subtitle='BOSS • OO • IAO • ASO • CO • FO'
        />
        <StatCard
          title='Total Notices'
          value={stats.totalNotices}
          icon={Icons.sparkles}
          trend={{ value: 'Live notices', positive: true }}
          colorClass='bg-gradient-to-br from-brand-navy to-brand-purple'
          delay={0.4}
        />
      </div>

      {statsError && (
        <p className='text-sm text-red-500'>{statsError}</p>
      )}

      <motion.div variants={itemVariants}>
        <AutonomousOperatorsCard />
      </motion.div>
    </motion.div>
  )
}
