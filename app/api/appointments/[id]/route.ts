import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Appointment from '@/lib/models/Appointment'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const appointment = await Appointment.findById(id)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'regNumber brand model')
        .lean()

    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: appointment })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const body = await req.json()
    const appointment = await Appointment.findByIdAndUpdate(id, body, { new: true })
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: appointment })
}
