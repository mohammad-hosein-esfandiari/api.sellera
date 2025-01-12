const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User", index: true },
    refreshToken: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true, unique: true },
    maxAge: { type: Date, required: true },
    systemType: { type: String, required: true},
    createdAt: { type: Date, required: true, default: Date.now },
    userBasket: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], default: [] },
    isLoggedIn: { type: Boolean, required: true, default: false },
    user_preferences: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Session", sessionSchema);