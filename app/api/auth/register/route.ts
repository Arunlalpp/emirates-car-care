import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import type { UserRole } from '@/lib/models/User'

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, role = 'staff' } = await req.json()

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }
        const validRoles: UserRole[] = ['owner', 'staff', 'technician']
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        await connectDB()
        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
        }

        const hash = await bcrypt.hash(password, 12)
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hash,
            role,
            provider: 'credentials',
        })

        return NextResponse.json({ message: 'Account created', id: user._id }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
