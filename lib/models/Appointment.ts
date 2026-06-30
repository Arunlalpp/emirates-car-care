import mongoose, { Schema, Document, Types } from 'mongoose'

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export interface IAppointment extends Document {
    customerId: Types.ObjectId
    vehicleId: Types.ObjectId
    assignedTo?: Types.ObjectId
    serviceType: string
    date: Date
    timeSlot: string
    status: AppointmentStatus
    notes?: string
    estimatedDuration?: number
    createdAt: Date
    updatedAt: Date
}

const AppointmentSchema = new Schema<IAppointment>({
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    serviceType: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    timeSlot: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
        default: 'pending',
    },
    notes: { type: String },
    estimatedDuration: { type: Number, default: 60 },
}, { timestamps: true })

export default mongoose.models.Appointment as mongoose.Model<IAppointment> || mongoose.model<IAppointment>('Appointment', AppointmentSchema)
