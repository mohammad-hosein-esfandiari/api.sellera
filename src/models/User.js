const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  country: { type: String },
  state: { type: String },
  city: { type: String },
  street: { type: String },
  postalCode: { type: String },
  additionalInfo: { type: String },
});

const paymentMethodSchema = new mongoose.Schema({
  card_number: { type: String },
  acc_number: { type: String },
  sheba_number: { type: String },
});

const baseUserSchema = new mongoose.Schema(
  {
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, required: true, unique: true },
    phone_number: { type: String, required: true },
    password: { type: String, required: true },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date, 
    },
    profile_image: { type: String },
    birthdate: { type: Date },
    address: [{ type: addressSchema }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    shopping_cart: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number },
        addedAt: { type: Date },
      },
    ],
    isVerified: { type: Boolean, default: false },
    roles: [{ type: String, enum: ["buyer", "support", "admin", "seller"], required: true }],
    
    // Optional seller-specific fields
    national_code: { type: Number, unique: true, sparse: true },  
    payment_method: [{ type: paymentMethodSchema }],
    website_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "Website" }],
    isAuthorized: { type: Boolean, default: false },

    
    following: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Website",
        default: [],
    }
 
  },
  { timestamps: true }
);

const User = mongoose.model("User", baseUserSchema);
module.exports = { User };
