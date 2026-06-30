import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import JobCard from '@/lib/models/JobCard'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { dataUrl, caption } = body

    if (!dataUrl) return NextResponse.json({ error: 'Image data required' }, { status: 400 })

    // Rough size guard: base64 of 1.5MB raw ≈ 2MB string
    if (dataUrl.length > 2_100_000) {
        return NextResponse.json({ error: 'Image too large — please use a smaller photo' }, { status: 413 })
    }

    await connectDB()
    const job = await JobCard.findById(id)
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    job.inspectionImages.push({ dataUrl, caption: caption ?? '', uploadedAt: new Date() })
    await job.save()

    return NextResponse.json({ data: job.inspectionImages }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { index } = await req.json()

    await connectDB()
    const job = await JobCard.findById(id)
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    job.inspectionImages.splice(index, 1)
    await job.save()

    return NextResponse.json({ data: job.inspectionImages })
}
