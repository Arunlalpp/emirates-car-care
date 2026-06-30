import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Appointment from '@/lib/models/Appointment'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const date = req.nextUrl.searchParams.get('date')
    const query: Record<string, unknown> = {}

    if (date) {
        const start = new Date(date)
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        query.date = { $gte: start, $lt: end }
    }

    const appointments = await Appointment.find(query)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'regNumber brand model')
        .sort({ date: 1, timeSlot: 1 })
        .lean()

    return NextResponse.json({ data: appointments })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { customerId, vehicleId, date, timeSlot, serviceType } = body

    if (!customerId || !vehicleId || !date || !timeSlot || !serviceType) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await connectDB()
    const appointment = await Appointment.create({
        ...body,
        date: new Date(date),
        status: 'pending',
    })

    return NextResponse.json({ data: appointment }, { status: 201 })
}
