import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const users = await User.find({ active: true })
        .select('name role phone')
        .sort({ name: 1 })
        .lean()

    return NextResponse.json({ data: users })
}
