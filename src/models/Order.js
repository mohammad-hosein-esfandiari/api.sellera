const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required for the order.']
    },
    products: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, 'Product ID is required.']
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required.'],
            min: [1, 'Quantity cannot be less than 1.']
        },
        price: {
            type: Number,
            required: [true, 'Price is required.']
        }
    }],
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required.'],
        min: [0, 'Total amount cannot be negative.']
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    deliveryAddress: {
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        street: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'PayPal', 'Bank Transfer'],
        required: [true, 'Payment method is required.']
    },
    discountCode: {
        type: String
    },
    trackingCode: {
        type: String
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 20*60*1000, // 20 دقیقه بعد
    }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order };
