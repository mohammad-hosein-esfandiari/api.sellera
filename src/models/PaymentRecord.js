const mongoose = require('mongoose');

const PaymentReportSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    websiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'IR',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'wallet', 'bank_transfer', 'other'],
        required: true,
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
    failureReason: {
        type: String,
        trim: true,
    },
    refundDate: {
        type: Date,
    },
    refundAmount: {
        type: Number,
        default: 0,
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    comments: [{
        content: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
    }],
    reservationExpiresAt: {  // زمان انقضای رزرو محصول
        type: Date,
        default: () => Date.now() + 20 * 60 * 1000, // 20 دقیقه پس از ایجاد رکورد
        required: true,
        immutable: true, 
    },
}, {
    timestamps: true,
});

const PaymentReport = mongoose.model('PaymentReport', PaymentReportSchema);
module.exports = PaymentReport;
