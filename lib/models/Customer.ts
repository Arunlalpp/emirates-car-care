import mongoose, { Schema, Document } from 'mongoose'

export interface ICustomer extends Document {
    name: string
    phone: string
    email?: string
    address?: string
    notes?: string
    createdAt: Date
    updatedAt: Date
}

const CustomerSchema = new Schema<ICustomer>({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    notes: { type: String },
}, { timestamps: true })

CustomerSchema.index({ phone: 1 })
CustomerSchema.index({ name: 'text', phone: 'text', email: 'text' })

export default mongoose.models.Customer as mongoose.Model<ICustomer> || mongoose.model<ICustomer>('Customer', CustomerSchema)
