import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import ServiceItem from '@/lib/models/ServiceItem'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const q = req.nextUrl.searchParams.get('q') ?? ''
    const type = req.nextUrl.searchParams.get('type') ?? ''

    const filter: Record<string, unknown> = { isActive: true }
    if (type) filter.type = type
    if (q) filter.name = { $regex: q, $options: 'i' }

    const items = await ServiceItem.find(filter).sort({ category: 1, name: 1 }).lean()
    return NextResponse.json({ data: items })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, category, type, defaultPrice, description } = body

    if (!name || defaultPrice === undefined) {
        return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    await connectDB()
    const item = await ServiceItem.create({ name, category, type, defaultPrice, description })
    return NextResponse.json({ data: item }, { status: 201 })
}
