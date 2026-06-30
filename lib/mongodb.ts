import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cached = (global as any).__mongoose ?? ((global as any).__mongoose = {})

export async function connectDB() {
    if (cached.conn) return cached.conn
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
    }
    cached.conn = await cached.promise
    return cached.conn
}
