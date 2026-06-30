import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import JobCard from '@/lib/models/JobCard'
import Appointment from '@/lib/models/Appointment'
import '@/lib/models/Customer'
import '@/lib/models/Vehicle'
import '@/lib/models/User'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const filter = status ? { status } : {}

    const jobs = await JobCard.find(filter)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'regNumber brand model')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .lean()

    return NextResponse.json({ data: jobs })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()

    const body = await req.json()
    const { customerId, vehicleId, appointmentId, serviceType, customerComplaint, odometerIn, estimatedCost, expectedDelivery, assignedTo } = body

    if (!customerId || !vehicleId) {
        return NextResponse.json({ error: 'Customer and vehicle are required' }, { status: 400 })
    }

    // Use the appointment's scheduled date as serviceDate so filtering by date works correctly
    // even if the job card is created days before the actual service
    let serviceDate: Date = new Date()
    if (appointmentId) {
        const appt = await Appointment.findById(appointmentId).select('date').lean()
        if (appt?.date) serviceDate = new Date(appt.date)
    }

    const job = new JobCard({
        customerId, vehicleId, appointmentId, serviceType, customerComplaint,
        odometerIn, estimatedCost, expectedDelivery, assignedTo,
        serviceDate,
        statusHistory: [{ status: 'received', changedBy: session.user?.id, note: 'Job card created' }],
    })
    await job.save()

    // Mark the source appointment as in_progress so it no longer shows "Accept" button
    if (appointmentId) {
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'in_progress' })
    }

    return NextResponse.json({ data: job }, { status: 201 })
}
