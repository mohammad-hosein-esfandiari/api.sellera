const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    websiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        product_info: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    discount_code:{
        type:String,
        trim:true

    },
    totalQuantity: {
        type: Number,
        
    },
    totalAmount: {
        type: Number,
       
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'processing'
    },
    shippingAddress: {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        }
    },
    billingAddress: {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        }
    },
    trackingInfo: {
        carrier: {
            type: String,
            trim: true
        },
        trackingNumber: {
            type: String,
            trim: true
        },
        estimatedDelivery: {
            type: Date
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = {Order};
