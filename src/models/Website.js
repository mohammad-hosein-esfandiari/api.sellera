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
                enum: ["admin", "product", "order", "comment"], // Allowed permission levels
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
    createdAt:{type:Date , default: Date.now()}
});

// Create the Website model
const Website = mongoose.model("Website", websiteSchema);

module.exports = { Website };
