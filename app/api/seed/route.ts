import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ServiceItem from '@/lib/models/ServiceItem'

const SEED_ITEMS = [
    // ── Oil Change ──
    { name: 'Engine Oil 5W-30 (4L)', category: 'Oil Change', type: 'part',    defaultPrice: 850,  description: 'Fully synthetic engine oil' },
    { name: 'Engine Oil 10W-40 (4L)', category: 'Oil Change', type: 'part',   defaultPrice: 650,  description: 'Semi-synthetic engine oil' },
    { name: 'Oil Filter',             category: 'Oil Change', type: 'part',   defaultPrice: 180,  description: 'OEM-compatible oil filter' },
    // ── Filters ──
    { name: 'Air Filter',             category: 'Filters',    type: 'part',   defaultPrice: 280,  description: 'Engine air filter' },
    { name: 'Cabin Air Filter',       category: 'Filters',    type: 'part',   defaultPrice: 220,  description: 'AC cabin pollen filter' },
    { name: 'Fuel Filter',            category: 'Filters',    type: 'part',   defaultPrice: 350,  description: 'Inline fuel filter' },
    // ── Brakes ──
    { name: 'Brake Pads – Front Set', category: 'Brakes',     type: 'part',   defaultPrice: 1200, description: 'Ceramic front brake pads' },
    { name: 'Brake Pads – Rear Set',  category: 'Brakes',     type: 'part',   defaultPrice: 950,  description: 'Ceramic rear brake pads' },
    { name: 'Brake Disc – Front',     category: 'Brakes',     type: 'part',   defaultPrice: 2500, description: 'Vented front brake disc (pair)' },
    { name: 'Brake Fluid (DOT 4)',    category: 'Brakes',     type: 'part',   defaultPrice: 220,  description: '500 ml brake fluid' },
    // ── Electrical ──
    { name: 'Battery 60Ah',           category: 'Electrical', type: 'part',   defaultPrice: 3500, description: 'Maintenance-free car battery' },
    { name: 'Battery 75Ah',           category: 'Electrical', type: 'part',   defaultPrice: 4200, description: 'Heavy-duty maintenance-free battery' },
    // ── Engine ──
    { name: 'Coolant / Antifreeze',   category: 'Engine',     type: 'part',   defaultPrice: 280,  description: 'Pre-mixed engine coolant 1L' },
    { name: 'Spark Plug (per unit)',   category: 'Engine',     type: 'part',   defaultPrice: 350,  description: 'Iridium spark plug' },
    { name: 'Timing Belt Kit',        category: 'Engine',     type: 'part',   defaultPrice: 3200, description: 'Belt + tensioner + idler' },
    // ── Tyres & Alignment ──
    { name: 'Wheel Alignment',        category: 'Tyres',      type: 'service', defaultPrice: 350,  description: '4-wheel computerised alignment' },
    { name: 'Tyre Rotation',          category: 'Tyres',      type: 'service', defaultPrice: 200,  description: 'Rotate all 4 tyres' },
    { name: 'Wheel Balancing',        category: 'Tyres',      type: 'service', defaultPrice: 400,  description: 'Balance all 4 wheels' },
    // ── AC ──
    { name: 'AC Regas / Recharge',    category: 'AC',         type: 'service', defaultPrice: 900,  description: 'Refrigerant top-up and pressure check' },
    { name: 'AC Filter & Clean',      category: 'AC',         type: 'service', defaultPrice: 550,  description: 'Cabin filter replacement + evaporator clean' },
    // ── Diagnostics ──
    { name: 'Engine Diagnosis',       category: 'Diagnostics', type: 'service', defaultPrice: 450,  description: 'OBD-II scan + report' },
    { name: 'Electrical Diagnosis',   category: 'Diagnostics', type: 'service', defaultPrice: 500,  description: 'Full electrical system check' },
    // ── Labour ──
    { name: 'Labour – General (1hr)', category: 'Labour',     type: 'labor',  defaultPrice: 500,  description: 'Standard workshop labour per hour' },
    { name: 'Labour – Engine Work',   category: 'Labour',     type: 'labor',  defaultPrice: 1200, description: 'Complex engine work (per job)' },
    { name: 'Labour – Electrical',    category: 'Labour',     type: 'labor',  defaultPrice: 700,  description: 'Electrical fault repair (per job)' },
    // ── Packages ──
    { name: 'Full Service Package',   category: 'Packages',   type: 'service', defaultPrice: 2999, description: 'Oil + filters + inspection + fluid top-ups' },
    { name: 'Brake Service Package',  category: 'Packages',   type: 'service', defaultPrice: 3800, description: 'Pads + discs + fluid + labour' },
]

export async function POST() {
    try {
        await connectDB()

        const existing = await ServiceItem.countDocuments()
        if (existing > 0) {
            return NextResponse.json({ message: `Skipped — ${existing} items already exist. DELETE all first to re-seed.` }, { status: 200 })
        }

        await ServiceItem.insertMany(SEED_ITEMS)
        return NextResponse.json({ message: `Seeded ${SEED_ITEMS.length} service items successfully.` }, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        await connectDB()
        const result = await ServiceItem.deleteMany({})
        return NextResponse.json({ message: `Deleted ${result.deletedCount} items.` })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
