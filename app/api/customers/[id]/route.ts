import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()
    const customer = await Customer.findById(id).lean()
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: customer })
}
