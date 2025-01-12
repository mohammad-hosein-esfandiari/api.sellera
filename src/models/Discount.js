const mongoose = require("mongoose");

const DiscountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    maxDiscount: {
        type: Number,
        default: null,
    },
    minOrderAmount: {
        type: Number,
        default: 0,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    },
    website_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        required: true,
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    }],
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    }],
    usageLimit: {
        type: Number,
        default: null,
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isGlobal: {
        type: Boolean,
        default: false,  // تعیین می‌کند که تخفیف عمومی (روی کل سبد) است یا نه
    },
}, {
    timestamps: true,
});

const Discount = mongoose.model('Discount', DiscountSchema);
module.exports = {Discount};
