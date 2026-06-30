import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import JobCard from '@/lib/models/JobCard'
import Customer from '@/lib/models/Customer'

// Sends WhatsApp notification to customer when vehicle is ready.
// Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in env.
// If Twilio is not configured, returns a wa.me link for manual send.

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const job = await JobCard.findById(id)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'regNumber brand model')

    if (!job) return NextResponse.json({ error: 'Job card not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customer = job.customerId as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vehicle = job.vehicleId as any

    if (!customer?.phone) {
        return NextResponse.json({ error: 'Customer has no phone number on file' }, { status: 400 })
    }

    const rawPhone = customer.phone.replace(/\D/g, '')
    const phone = rawPhone.startsWith('0') ? `971${rawPhone.slice(1)}` : rawPhone

    const message =
        `Hello ${customer.name},\n\nGreat news! Your vehicle *${vehicle?.brand} ${vehicle?.model}* (${vehicle?.regNumber}) is ready for pickup at Emirates Car Care.\n\nJob No: *${job.jobNumber}*\n\nWe look forward to seeing you. Please visit us during business hours.\n\nThank you 🚗`

    // Try Twilio if configured
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_WHATSAPP_FROM // e.g. whatsapp:+14155238886

    if (sid && token && from) {
        try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
            const params = new URLSearchParams({
                From: from,
                To: `whatsapp:+${phone}`,
                Body: message,
            })
            const res = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message ?? 'Twilio error')
            }

            job.notificationSent = true
            job.notifiedAt = new Date()
            await job.save()

            return NextResponse.json({ success: true, method: 'whatsapp', phone: `+${phone}` })
        } catch (e) {
            return NextResponse.json({ error: String(e) }, { status: 500 })
        }
    }

    // Fallback: return a wa.me link the admin can share/open
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

    job.notificationSent = true
    job.notifiedAt = new Date()
    await job.save()

    return NextResponse.json({ success: true, method: 'link', link: waLink, phone: `+${phone}` })
}
