import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null
                try {
                    await connectDB()
                    const user = await User.findOne({
                        email: (credentials.email as string).toLowerCase(),
                        provider: 'credentials',
                        active: true,
                    }).select('+password')
                    if (!user?.password) return null
                    const valid = await bcrypt.compare(credentials.password as string, user.password)
                    if (!valid) return null
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: user.role,
                    }
                } catch {
                    return null
                }
            },
        }),
    ],

    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },

    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                try {
                    await connectDB()
                    const existing = await User.findOne({ email: user.email ?? '' })
                    if (!existing) {
                        const created = await User.create({
                            name: user.name ?? '',
                            email: user.email ?? '',
                            image: user.image ?? '',
                            provider: 'google',
                            role: 'staff',
                        })
                        user.id = (created._id as { toString(): string }).toString()
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ;(user as any).role = created.role
                    } else {
                        user.id = (existing._id as { toString(): string }).toString()
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ;(user as any).role = existing.role
                    }
                } catch {
                    return false
                }
            }
            return true
        },

        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.role = (user as any).role ?? 'staff'
            }
            return token
        },

        async session({ session, token }) {
            if (token.id) session.user.id = token.id as string
            if (token.role) session.user.role = token.role as string
            return session
        },
    },

    pages: { signIn: '/login' },
})
