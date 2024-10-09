const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  resetToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
});

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;
