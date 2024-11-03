const mongoose = require("mongoose");

// Define the schema for shipping details
const shippingSchema = new mongoose.Schema({
    weight: { type: Number }, // in kilograms
    dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number }
    },
    deliveryTime: { type: String }
},{ _id: false });

// Define the schema for special offers
const specialOfferSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    offerDescription: { type: String },
    offerEndDate: { type: Date },
    offerStartDate: { type: Date },
    discount: { type: Number, default: 0 }
});

// Define the schema for SEO
const seoSchema = new mongoose.Schema({
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [String],
    
},{ _id: false });

// Define the schema for details
const detailsSchema = new mongoose.Schema({
    base_title: {
        type: String,
        required: [true, 'Base title for details is required.']
    },
    items: [{
        title: {
            type: String,
            required: [true, 'Item title in details is required.']
        },
        description: {
            type: String,
            required: [true, 'Item description in details is required.']
        }
    }]
});

const ratingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    }
}, { _id: false });

// Define the main product schema
const productSchema = new mongoose.Schema({
    website_id: { type: mongoose.Schema.Types.ObjectId, ref: "Website" },
    title: {
        type: String,
        required: [true, 'Product title is required.'],
        minlength: [3, 'Product title must be at least 3 characters long.'],
        maxlength: [100, 'Product title must not exceed 100 characters.']
    },
    slug: {
        type: String,
        required: true,
        unique: true, // Ensure slug is unique
        index: true
    },
    category: {
        type: String,
        default:""
    },
    price: {
        amount: {
            type: Number,
            default: 0,
            min: [0, 'Price amount cannot be negative.']
        },
        currency: {
            type: String,
            default: ''
        },
        discount: {
            type: Number,
            default: 0
        }
    },

    images: [{
        // MongoDB automatically generates this ID
        url: {
            type: String,
            required: [true, 'Image URL is required.'],
            validate: {
                // Validate that the URL ends with a valid image file format
                validator: function(value) {
                    return /\.(jpg|jpeg|png|webp|gif)$/i.test(value);
                },
                message: 'Image URL must end with a valid image file format (e.g., jpg, jpeg, png, webp, gif).'
            }
        },
        alt: {
            type: String,
            default: "Product Image",
            maxlength: 100
        }
    }],
    store: {
        type: Number,
        default: 0,
        min: [0, 'Stock quantity cannot be negative.']
    },
    colors: [{ type: String }],
    introduction: {
        type: String,
        default:""
    },
    details: [{ type: detailsSchema }],
    rating: [ratingSchema],
    seo: {type:seoSchema , default:{
        metaTitle: "",
        metaDescription: "",
        keywords: []
    }},
     // Tags schema with validation
     tags: {
        type: [{ type: String }],
        validate: {
            validator: function (tags) {
                // Check that the array has a maximum of 10 tags
                if (tags.length > 10) return false;
                // Check that each tag starts with "#" and is non-empty
                return tags.every(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.startsWith('#'));
            },
            message: 'Each tag must be a non-empty string starting with "#" and the total tags should not exceed 10.'
        }
    },
    specialOffers: {
        type: [specialOfferSchema],
        default: []
    },
    analytics: {
        purchasedCount: { type: Number, default: 0 }
    },
    shipping: {type:shippingSchema , default:{
        weight: 0,
        dimensions: {
            length: 0,
            width: 0,
            height: 0
        },
        deliveryTime: ""  
    }},
    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'  // Assuming you have a User model to track who liked the product
    }],
    isOnline:{type:Boolean , default:false}
}, { timestamps: true });

// Create the Product model
const Product = mongoose.model("Product", productSchema);

module.exports = { Product };
