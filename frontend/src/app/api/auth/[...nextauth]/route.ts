// frontend/src/app/api/auth/[...nextauth]/route.ts
// AutoPilot Template — hardcoded dev sign-in for the command center.

import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const DEV_EMAIL = 'joshuang.supervity@hotmail.com'
const DEV_PASSWORD = '676767'

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'AutoPilot Dev',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase() ?? ''
        const password = credentials?.password ?? ''

        if (email === DEV_EMAIL.toLowerCase() && password === DEV_PASSWORD) {
          return {
            id: 'dev-user-001',
            name: 'Dev User',
            email: DEV_EMAIL,
          }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name ?? 'Dev User'
        token.email = user.email ?? DEV_EMAIL
      }

      token.roles = ['admin', 'user']
      return token
    },
    async session({ session, token }) {
      session.roles = (token.roles as string[]) || ['admin', 'user']
      session.user = {
        ...session.user,
        name: (token.name as string) || 'Dev User',
        email: (token.email as string) || DEV_EMAIL,
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-me',
  debug: false,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
