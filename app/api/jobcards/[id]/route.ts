import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import JobCard from '@/lib/models/JobCard'
import Appointment from '@/lib/models/Appointment'
import '@/lib/models/Customer'
import '@/lib/models/Vehicle'
import '@/lib/models/User'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const job = await JobCard.findById(id)
        .populate('customerId', 'name phone email')
        .populate('vehicleId', 'regNumber brand model year fuelType color')
        .populate('assignedTo', 'name')
        .lean()

    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: job })
}

const STATUS_ORDER = ['received', 'inspection', 'in_service', 'quality_check', 'ready', 'delivered']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const body = await req.json()
    const { status, technicianNotes, finalCost, note } = body

    const job = await JobCard.findById(id)
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (status) {
        if (!STATUS_ORDER.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        job.status = status
        job.statusHistory.push({
            status,
            changedAt: new Date(),
            changedBy: session.user?.id,
            note: note ?? '',
        })

        // Sync appointment status when job card reaches terminal states
        if (job.appointmentId) {
            const apptStatus = status === 'delivered' ? 'completed' : 'in_progress'
            await Appointment.findByIdAndUpdate(job.appointmentId, { status: apptStatus })
        }
    }

    if (technicianNotes !== undefined) job.technicianNotes = technicianNotes
    if (finalCost !== undefined) job.finalCost = finalCost

    await job.save()
    return NextResponse.json({ data: job })
}
