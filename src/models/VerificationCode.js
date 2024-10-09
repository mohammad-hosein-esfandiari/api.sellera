const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const verificationCodeSchema = new Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isVerified :{type :Boolean , default :false},
  type:{type:String , required:true}
});

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);
module.exports = VerificationCode;
