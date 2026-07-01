import mongoose from 'mongoose'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cached = (global as any).__mongoose ?? ((global as any).__mongoose = {})

export async function connectDB() {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI is not defined')

    if (cached.conn) return cached.conn
    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, {
            bufferCommands: false,
            maxPoolSize: 5,          // serverless: each function has its own pool
            minPoolSize: 0,          // don't hold idle connections
            connectTimeoutMS: 5000,
            serverSelectionTimeoutMS: 5000,
            family: 4,               // force IPv4 — avoids slow DNS on Vercel
        })
    }
    cached.conn = await cached.promise
    return cached.conn
}
