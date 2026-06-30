import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import JobCard from '@/lib/models/JobCard'
import '@/lib/models/Customer'
import '@/lib/models/Vehicle'

// Public endpoint — no auth. Returns minimal job info for customer tracking.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobNumber: string }> }) {
    const { jobNumber } = await params
    await connectDB()

    const job = await JobCard.findOne({ jobNumber })
        .populate('customerId', 'name')
        .populate('vehicleId', 'regNumber brand model year')
        .select('jobNumber status customerId vehicleId createdAt')
        .lean()

    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: job })
}
