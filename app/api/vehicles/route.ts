import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Vehicle from '@/lib/models/Vehicle'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const customerId = req.nextUrl.searchParams.get('customerId')
    const query = customerId ? { customerId } : {}
    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ data: vehicles })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { customerId, regNumber, brand, model, year } = body
    if (!customerId || !regNumber || !brand || !model || !year) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await connectDB()
    const vehicle = await Vehicle.create(body)
    return NextResponse.json({ data: vehicle }, { status: 201 })
}
