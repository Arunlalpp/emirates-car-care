import mongoose, { Schema } from 'mongoose'

const StatusHistorySchema = new Schema({
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: String,
}, { _id: false })

const InspectionImageSchema = new Schema({
    dataUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false })

const LineItemSchema = new Schema({
    description: { type: String, required: true },
    type: { type: String, enum: ['part', 'labor', 'service'], default: 'service' },
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0 },
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

    inspectionImages: [InspectionImageSchema],

    lineItems: [LineItemSchema],
    laborCharge: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    vatPercent: { type: Number, default: 5 },
    totalAmount: { type: Number, default: 0 },
}, { timestamps: true })

JobCardSchema.pre('save', async function () {
    if (!this.jobNumber) {
        const year = new Date().getFullYear()
        const count = await mongoose.model('JobCard').countDocuments()
        this.jobNumber = `JC-${year}-${String(count + 1).padStart(4, '0')}`
    }
})

export default mongoose.models.JobCard || mongoose.model('JobCard', JobCardSchema)
