import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import ServiceItem from '@/lib/models/ServiceItem'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    await connectDB()
    const item = await ServiceItem.findByIdAndUpdate(id, body, { new: true, runValidators: true })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: item })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    // Soft delete: mark inactive
    await ServiceItem.findByIdAndUpdate(id, { isActive: false })
    return NextResponse.json({ ok: true })
}
