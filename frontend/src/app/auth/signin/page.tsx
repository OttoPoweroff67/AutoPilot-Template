'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardWatermark } from '@/components/ui/card-watermark'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Logomark } from '@/components/brand'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [email, setEmail] = useState('joshuang.supervity@hotmail.com')
  const [password, setPassword] = useState('676767')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      return
    }

    router.push(callbackUrl || '/')
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className='w-full max-w-md'
    >
      <Card className='relative overflow-hidden bg-white shadow-float-lg'>
        <CardWatermark opacity={4} scale={1} />
        <CardHeader className='relative z-10 space-y-4 pb-8 text-center'>
          <motion.div
            className='mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-navy shadow-xl'
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
          >
            <Logomark variant='light' size={48} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <CardTitle className='text-display-5 font-bold text-brand-navy'>
              AutoPilot
            </CardTitle>
            <p className='mt-2 text-muted-foreground'>
              Sign in as the dev account to unlock the full workspace.
            </p>
          </motion.div>
        </CardHeader>
        <CardContent className='relative z-10 space-y-4 px-8 pb-8'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-brand-navy' htmlFor='email'>
                Email
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0 focus:border-brand-navy'
                required
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-brand-navy' htmlFor='password'>
                Password
              </label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0 focus:border-brand-navy'
                required
              />
            </div>

            {error && (
              <p className='text-sm text-red-600'>{error}</p>
            )}

            <Button
              type='submit'
              variant='gradient'
              size='lg'
              className='group w-full py-6 text-base'
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Enter Command Center'}
              <Icons.arrowRight className='ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1' />
            </Button>
          </form>

          <motion.p
            className='text-center text-xs text-muted-foreground'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            Dev account: joshuang.supervity@hotmail.com / 676767
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-background'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-brand-navy border-t-transparent' />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
