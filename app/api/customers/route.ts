import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const q = req.nextUrl.searchParams.get('q')

    const query = q
        ? { $or: [
            { name: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
        ]}
        : {}

    const limit = req.nextUrl.searchParams.get('limit')
    const customers = await Customer.find(query).limit(limit ? parseInt(limit) : 20).sort({ name: 1 }).lean()
    return NextResponse.json({ data: customers })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, phone, email, address, notes } = await req.json()
    if (!name || !phone) return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })

    await connectDB()
    const customer = await Customer.create({ name, phone, email, address, notes })
    return NextResponse.json({ data: customer }, { status: 201 })
}
