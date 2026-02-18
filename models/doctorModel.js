import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    image: {
        type: String,
        required: [true, 'Image is required']
    },
    speciality: {
        type: String,
        required: [true, 'Speciality is required'],
        trim: true
    },
    degree: {
        type: String,
        required: [true, 'Degree is required'],
        trim: true
    },
    experience: {
        type: String,
        required: [true, 'Experience is required'],
        trim: true
    },
    about: {
        type: String,
        required: [true, 'About is required'],
        trim: true,
        maxlength: [1000, 'About cannot exceed 1000 characters']
    },
    available: {
        type: Boolean,
        default: true
    },
    fees: {
        type: Number,
        required: [true, 'Fees is required'],
        min: [0, 'Fees cannot be negative']
    },
    address: {
        type: {
            line1: { type: String, required: true, trim: true },
            line2: { type: String, trim: true }
        },
        required: [true, 'Address is required']
    },
    date: {
        type: Date,
        default: Date.now
    },
    slots_booked: {
        type: Map,
        of: [String], // Array of booked slot times for each date
        default: new Map()
    }
}, {
    minimize: false,
    timestamps: true // Adds createdAt and updatedAt
});

// Indexes for performance
doctorSchema.index({ speciality: 1 });
doctorSchema.index({ available: 1 });

// Virtual for full address
doctorSchema.virtual('fullAddress').get(function() {
    return `${this.address.line1}${this.address.line2 ? ', ' + this.address.line2 : ''}`;
});

// Instance method to check availability for a specific date and time
doctorSchema.methods.isSlotAvailable = function(date, time) {
    // Accepts either Date or string (YYYY-MM-DD)
    let dateStr;
    if (typeof date === 'string') {
        dateStr = date;
    } else if (date instanceof Date) {
        dateStr = date.toISOString().split('T')[0];
    } else {
        throw new Error('Invalid date format');
    }
    const bookedSlots = this.slots_booked.get(dateStr) || [];
    return !bookedSlots.includes(time);
};

const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema);

export default doctorModel;