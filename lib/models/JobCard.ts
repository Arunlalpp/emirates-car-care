import mongoose, { Schema } from 'mongoose'

const StatusHistorySchema = new Schema({
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: String,
}, { _id: false })

const JobCardSchema = new Schema({
    jobNumber: { type: String, unique: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['received', 'inspection', 'in_service', 'quality_check', 'ready', 'delivered'],
        default: 'received',
    },
    serviceType: String,
    customerComplaint: String,
    technicianNotes: String,
    odometerIn: Number,
    estimatedCost: Number,
    finalCost: Number,
    expectedDelivery: Date,
    notificationSent: { type: Boolean, default: false },
    notifiedAt: Date,
    statusHistory: [StatusHistorySchema],
}, { timestamps: true })

// Auto-generate job number before save
JobCardSchema.pre('save', async function () {
    if (!this.jobNumber) {
        const year = new Date().getFullYear()
        const count = await mongoose.model('JobCard').countDocuments()
        this.jobNumber = `JC-${year}-${String(count + 1).padStart(4, '0')}`
    }
})

export default mongoose.models.JobCard || mongoose.model('JobCard', JobCardSchema)
