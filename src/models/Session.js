const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({ session:{type:mongoose.Schema.Types.Mixed} });

module.exports = mongoose.model("Session", sessionSchema);
