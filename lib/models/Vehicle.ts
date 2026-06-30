import mongoose, { Schema, Types } from 'mongoose'

export interface IVehicle {
    _id: Types.ObjectId
    customerId: Types.ObjectId
    regNumber: string
    brand: string
    model: string
    year: number
    color?: string
    fuelType?: 'petrol' | 'diesel' | 'electric' | 'cng' | 'hybrid'
    vin?: string
    odometer?: number
    notes?: string
    createdAt: Date
    updatedAt: Date
}

const VehicleSchema = new Schema<IVehicle>({
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    regNumber: { type: String, required: true, uppercase: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    color: { type: String },
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'cng', 'hybrid'] },
    vin: { type: String, uppercase: true },
    odometer: { type: Number },
    notes: { type: String },
}, { timestamps: true })

VehicleSchema.index({ regNumber: 1 })

export default mongoose.models.Vehicle as mongoose.Model<IVehicle> || mongoose.model<IVehicle>('Vehicle', VehicleSchema)
