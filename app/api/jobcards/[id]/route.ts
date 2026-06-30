import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import JobCard from '@/lib/models/JobCard'
import Appointment from '@/lib/models/Appointment'
import '@/lib/models/Customer'
import '@/lib/models/Vehicle'
import '@/lib/models/User'
import webPush from 'web-push'

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

const STATUS_ORDER = ['booked', 'received', 'inspection', 'in_service', 'quality_check', 'ready', 'delivered']

const PUSH_LABELS: Record<string, { title: string; body: string }> = {
    booked:        { title: 'Appointment Confirmed ✅', body: 'Your appointment is confirmed at Emirates Car Care.' },
    received:      { title: 'Vehicle Checked In 🚗',   body: 'Your vehicle has arrived and is checked in.' },
    inspection:    { title: 'Inspection Started 🔍',   body: "We're inspecting your vehicle now. Updates coming soon." },
    in_service:    { title: 'Work In Progress 🔧',     body: 'Our technicians are working on your vehicle.' },
    quality_check: { title: 'Quality Check ✅',        body: 'Your vehicle is undergoing final quality checks.' },
    ready:         { title: 'Vehicle Ready! 🎉',       body: 'Your vehicle is ready for pickup. Visit us at your convenience.' },
    delivered:     { title: 'Job Complete 🏁',         body: 'Thank you for choosing Emirates Car Care!' },
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const body = await req.json()
    const { status, technicianNotes, finalCost, note, lineItems, laborCharge, discountAmount, vatPercent, totalAmount } = body

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

        if (job.appointmentId) {
            const apptStatus = status === 'delivered' ? 'completed' : 'in_progress'
            await Appointment.findByIdAndUpdate(job.appointmentId, { status: apptStatus })
        }
    }

    if (technicianNotes !== undefined) job.technicianNotes = technicianNotes
    if (finalCost !== undefined) job.finalCost = finalCost

    // Billing fields
    if (lineItems !== undefined) job.lineItems = lineItems
    if (laborCharge !== undefined) job.laborCharge = laborCharge
    if (discountAmount !== undefined) job.discountAmount = discountAmount
    if (vatPercent !== undefined) job.vatPercent = vatPercent
    if (totalAmount !== undefined) {
        job.totalAmount = totalAmount
        job.finalCost = totalAmount // keep finalCost in sync
    }

    await job.save()

    // Send push notification if customer subscribed and status changed
    if (status && job.pushSubscription) {
        try {
            const label = PUSH_LABELS[status]
            if (label && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
                webPush.setVapidDetails(
                    process.env.VAPID_EMAIL ?? 'mailto:admin@example.com',
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                    process.env.VAPID_PRIVATE_KEY,
                )
                await webPush.sendNotification(
                    job.pushSubscription,
                    JSON.stringify({ title: label.title, body: label.body, url: `/track/${job.jobNumber}` })
                )
            }
        } catch {
            // Subscription expired or invalid — clear it silently
            job.pushSubscription = null
            await job.save()
        }
    }

    return NextResponse.json({ data: job })
}
