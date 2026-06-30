import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import Vehicle from '@/lib/models/Vehicle'
import Appointment from '@/lib/models/Appointment'
import JobCard from '@/lib/models/JobCard'
import User from '@/lib/models/User'

// Demo staff — emails are predictable so we can safely remove & re-seed them
// Default login password for all staff: Staff@2024
const DEMO_STAFF = [
    { name: 'Ravi Chandran',    email: 'ravi.chandran@ecc.demo',   phone: '+971 50 111 2233', role: 'technician' as const },
    { name: 'Abdul Kareem',     email: 'abdul.kareem@ecc.demo',    phone: '+971 55 222 3344', role: 'technician' as const },
    { name: 'Suresh Pillai',    email: 'suresh.pillai@ecc.demo',   phone: '+971 52 333 4455', role: 'technician' as const },
    { name: 'Bilal Ahmed',      email: 'bilal.ahmed@ecc.demo',     phone: '+971 54 444 5566', role: 'technician' as const },
    { name: 'Jithin Thomas',    email: 'jithin.thomas@ecc.demo',   phone: '+971 56 555 6677', role: 'staff' as const },
    { name: 'Nasir Al Khatib',  email: 'nasir.khatib@ecc.demo',    phone: '+971 50 666 7788', role: 'technician' as const },
]

const DEMO_CUSTOMERS = [
    {
        name: 'Mohammed Al Rashid',
        phone: '+971 50 123 4567',
        email: 'mohammed.rashid@gmail.com',
        address: 'Villa 14, Al Barsha 1, Dubai',
        vehicle: { regNumber: 'DXB-A-11234', brand: 'Toyota', model: 'Land Cruiser', year: 2021, color: 'White', fuelType: 'petrol' as const, odometer: 42000 },
    },
    {
        name: 'Ahmed Hassan Abdullah',
        phone: '+971 55 234 5678',
        email: 'ahmed.hassan@hotmail.com',
        address: 'Apt 302, Al Nahda, Dubai',
        vehicle: { regNumber: 'DXB-B-28817', brand: 'Nissan', model: 'Patrol', year: 2020, color: 'Silver', fuelType: 'petrol' as const, odometer: 67000 },
    },
    {
        name: 'Rajesh Kumar',
        phone: '+971 52 345 6789',
        email: 'rajesh.kumar@yahoo.com',
        address: 'Flat 112, International City, Dubai',
        vehicle: { regNumber: 'DXB-E-34521', brand: 'Toyota', model: 'Camry', year: 2022, color: 'Black', fuelType: 'petrol' as const, odometer: 28500 },
    },
    {
        name: 'Priya Nair',
        phone: '+971 54 456 7890',
        email: 'priya.nair@gmail.com',
        address: 'JLT Cluster N, Jumeirah Lake Towers, Dubai',
        vehicle: { regNumber: 'DXB-C-47832', brand: 'Honda', model: 'Accord', year: 2021, color: 'Pearl White', fuelType: 'petrol' as const, odometer: 33000 },
    },
    {
        name: 'Omar Al Marzouqi',
        phone: '+971 56 567 8901',
        email: 'omar.marzouqi@outlook.com',
        address: 'Palm Jumeirah, Frond G, Dubai',
        vehicle: { regNumber: 'DXB-A-55678', brand: 'Lexus', model: 'LX 600', year: 2023, color: 'Dark Grey', fuelType: 'petrol' as const, odometer: 12000 },
    },
    {
        name: 'Sanjay Sharma',
        phone: '+971 50 678 9012',
        email: 'sanjay.sharma@gmail.com',
        address: 'Flat 208, Deira, Dubai',
        vehicle: { regNumber: 'DXB-D-61145', brand: 'Mitsubishi', model: 'Pajero', year: 2019, color: 'Red', fuelType: 'petrol' as const, odometer: 89000 },
    },
    {
        name: 'Faisal Al Hamadi',
        phone: '+971 55 789 0123',
        email: 'faisal.hamadi@gmail.com',
        address: 'Emirates Hills, Sector 3, Dubai',
        vehicle: { regNumber: 'DXB-F-72290', brand: 'BMW', model: 'X5', year: 2022, color: 'Alpine White', fuelType: 'petrol' as const, odometer: 18500 },
    },
    {
        name: 'Anoop George',
        phone: '+971 52 890 1234',
        email: 'anoop.george@gmail.com',
        address: 'Flat 507, Al Quoz 4, Dubai',
        vehicle: { regNumber: 'DXB-G-83401', brand: 'Hyundai', model: 'Tucson', year: 2021, color: 'Blue', fuelType: 'petrol' as const, odometer: 41000 },
    },
    {
        name: 'Khalid Al Suwaidi',
        phone: '+971 56 901 2345',
        email: 'khalid.suwaidi@hotmail.com',
        address: 'Jumeirah 3, Street 12, Dubai',
        vehicle: { regNumber: 'DXB-H-94567', brand: 'Chevrolet', model: 'Tahoe', year: 2020, color: 'Beige', fuelType: 'petrol' as const, odometer: 55000 },
    },
    {
        name: 'Deepak Menon',
        phone: '+971 54 012 3456',
        email: 'deepak.menon@gmail.com',
        address: 'Flat 310, Karama, Dubai',
        vehicle: { regNumber: 'DXB-J-10234', brand: 'Toyota', model: 'Corolla', year: 2023, color: 'Silver', fuelType: 'petrol' as const, odometer: 8000 },
    },
]

export async function POST() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if ((session.user as { role?: string })?.role !== 'owner') {
        return NextResponse.json({ error: 'Forbidden — owner only' }, { status: 403 })
    }

    await connectDB()

    // Clear transactional data — keep Users and ServiceItems
    await Promise.all([
        JobCard.deleteMany({}),
        Appointment.deleteMany({}),
        Customer.deleteMany({}),
        Vehicle.deleteMany({}),
    ])

    // Remove previously seeded demo staff (identified by @ecc.demo email suffix)
    await User.deleteMany({ email: /@ecc\.demo$/ })

    // Seed demo staff with hashed password
    const passwordHash = await bcrypt.hash('Staff@2024', 10)
    await User.insertMany(
        DEMO_STAFF.map(s => ({
            ...s,
            password: passwordHash,
            provider: 'credentials',
            active: true,
        }))
    )

    // Seed demo customers + vehicles
    const customerNames: string[] = []
    for (const entry of DEMO_CUSTOMERS) {
        const { vehicle, ...customerData } = entry
        const customer = await Customer.create(customerData)
        await Vehicle.create({ ...vehicle, customerId: customer._id })
        customerNames.push(customer.name)
    }

    return NextResponse.json({
        message: `Reset complete. ${DEMO_STAFF.length} staff + ${customerNames.length} customers seeded.`,
        staff: DEMO_STAFF.map(s => ({ name: s.name, email: s.email, role: s.role })),
        customers: customerNames,
        staffPassword: 'Staff@2024',
    })
}
