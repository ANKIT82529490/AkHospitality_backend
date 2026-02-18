import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'User ID is required']
    },
    docId: {
        type: String,
        required: [true, 'Doctor ID is required']
    },
    slotDate: {
        type: String,
        required: [true, 'Slot date is required']
    },
    slotTime: {
        type: String,
        required: [true, 'Slot time is required']
    },
    userData: {
        type: Object,
        required: [true, 'User data is required']
    },
    docData: {
        type: Object,
        required: [true, 'Doctor data is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    date: {
        type: Date,
        default: Date.now
    },
    cancelled: {
        type: Boolean,
        default: false
    },
    payment: {
        type: Boolean,
        default: false
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for performance
appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ docId: 1 });
appointmentSchema.index({ date: -1 });
appointmentSchema.index({ cancelled: 1 });
appointmentSchema.index({ isCompleted: 1 });

// Virtual for status
appointmentSchema.virtual('status').get(function() {
    if (this.cancelled) return 'cancelled';
    if (this.isCompleted) return 'completed';
    if (this.payment) return 'confirmed';
    return 'pending';
});

// Static method to get appointments by status
appointmentSchema.statics.getByStatus = function(status) {
    const statusMap = {
        cancelled: { cancelled: true },
        completed: { isCompleted: true },
        confirmed: { payment: true, cancelled: false },
        pending: { payment: false, cancelled: false, isCompleted: false }
    };
    return this.find(statusMap[status] || {});
};

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema);

export default appointmentModel;
