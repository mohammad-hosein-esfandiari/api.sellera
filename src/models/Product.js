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
    offerEndDate: { type: Date }
},{ _id: false });

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
    website_name: { type: String, ref: "Website" },
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
        }
    },

    images: [{ 
        type: String,
        validate: {
            validator: function(imagesArray) {
                return imagesArray.length > 0;
            },
            message: 'Product must have at least one image.'
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
    tags: [{ type: String }],
    specialOffer: {type:specialOfferSchema , default:{
        active: false,
        offerDescription: "",
        offerEndDate: ""
    }},
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
