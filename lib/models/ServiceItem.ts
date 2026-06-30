import mongoose, { Schema } from 'mongoose'

const ServiceItemSchema = new Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true },
    type: { type: String, enum: ['part', 'labor', 'service'], default: 'service' },
    defaultPrice: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.models.ServiceItem || mongoose.model('ServiceItem', ServiceItemSchema)
