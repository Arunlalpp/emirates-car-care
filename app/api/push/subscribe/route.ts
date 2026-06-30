import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import JobCard from '@/lib/models/JobCard'

export async function POST(req: NextRequest) {
    const { jobNumber, subscription } = await req.json()

    if (!jobNumber || !subscription?.endpoint) {
        return NextResponse.json({ error: 'Missing jobNumber or subscription' }, { status: 400 })
    }

    await connectDB()

    const job = await JobCard.findOne({ jobNumber })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    job.pushSubscription = subscription
    await job.save()

    return NextResponse.json({ success: true })
}
