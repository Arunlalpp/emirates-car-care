import mongoose, { Schema, Document } from 'mongoose'

export type UserRole = 'owner' | 'staff' | 'technician'

export interface IUser extends Document {
    name: string
    email: string
    password?: string
    role: UserRole
    phone?: string
    image?: string
    provider: 'credentials' | 'google'
    active: boolean
    createdAt: Date
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['owner', 'staff', 'technician'], default: 'staff' },
    phone: { type: String },
    image: { type: String },
    provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    active: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.models.User as mongoose.Model<IUser> || mongoose.model<IUser>('User', UserSchema)
