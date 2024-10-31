const mongoose = require("mongoose");

// Define the schema for the website
const websiteSchema = new mongoose.Schema({
    logo_image: {
        type: String,
        default:""
    },
    domain_name: {
        type: String,
        required: [true, 'Domain name is required.'], // Ensure domain name is provided
        unique: true // Ensure domain name is unique
    },
    seller_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        immutable: true,
        required: [true, 'Seller ID is required.'] // Ensure seller ID is provided
    },
    banners: [{
        image: {
            type: String,
            required: [true, 'Banner image is required.'] // Ensure banner image is provided
        },
        link: {
            type: String,
        }
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    categories: {
        type: [String],
    },
    bio: {
        title: {
            type: String,
            default:""
        },
        description: {
            type: String,
            default:""
        },
        email: {
            type: String,
            default:""
        },
        address: {
            type: [String],
            
        },
        socialMedia: {
            facebook: { type: String ,default:""},
            twitter: { type: String ,default:""},
            instagram: { type: String,default:"" },
            telegram: { type: String,default:"" },
            linkedin: { type: String,default:"" }
        }
    },
    supports_id: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'User ID is required in supports.'] // Ensure user ID is provided
        },
        permissions: {
            type: [{
                type: String,
                enum: ["admin", "product", "order", "comment", "seo"], // Allowed permission levels
                required: [true, 'Permissions are required.'] // Ensure permissions are provided
            }],
            validate: {
                validator: function(permissionsArray) {
                    return permissionsArray.length <= 5; // Ensure the array size does not exceed 5
                },
                message: 'Permissions array cannot exceed 5 items.' // Error message for exceeding array size
            }
        }
    }],
    isOnline : {type:Boolean , default:false},
    
    updateHistory: [{ // New field for update history
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, 'Updated by user ID is required.'] // Ensure updatedBy user ID is provided
        },
        updatedAt: {
            type: Date,
            default: Date.now // Store the timestamp of the update
        },
        changes: {
            type: String, // Store details about the changes
            required: [true, 'Change details are required.']
        }
    }],
    subscription: {
        price: { type: Number, default: 100000 }, // Monthly subscription fee (100,000 IRR)
        isActive: { type: Boolean, default: true }, // Whether the subscription is active
        lastPaymentDate: {
            type: Date,
            default: Date.now
        },
        nextPaymentDate: {
            type: Date,
            default: function() {
                const thirtyDaysInMilliseconds = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
                return new Date(Date.now() + thirtyDaysInMilliseconds); // Set 30 days after current date
            }
        }
    },
     // SEO fields
     seo: {
        meta_title: {
            type: String,
            default: "" // Title for SEO
        },
        meta_description: {
            type: String,
            default: "" // Meta description for SEO
        },
        meta_keywords: {
            type: [String], // Array of keywords for SEO
            default: []
        },
        canonical_url: {
            type: String, // Canonical URL for avoiding duplicate content issues
            default: ""
        },
        robots_meta: {
            type: String, // Meta tag for controlling search engine indexing
            enum: ["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"],
            default: "index, follow"
        },
        schema_markup: {
            type: String, // Optional field for structured data (e.g., JSON-LD)
            default: ""
        }
    },
    createdAt:{type:Date , default: Date.now()}
});

websiteSchema.statics.updateExpiredSubscriptions = async function() {
    const today = new Date();

    // Find all websites where the subscription is active and the nextPaymentDate is in the past
    const expiredWebsites = await this.updateMany(
        { 
            "subscription.isActive": true, 
            "subscription.nextPaymentDate": { $lt: today }
        },
        { 
            $set: { "subscription.isActive": false }
        }
    );
    
    return expiredWebsites;
};

// Create the Website model
const Website = mongoose.model("Website", websiteSchema);

module.exports = { Website };
