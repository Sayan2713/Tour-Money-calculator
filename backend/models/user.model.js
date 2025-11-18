const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, "Please enter a valid email address"]
  },
  password: {
    type: String,
    required: true,
  },
  name: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  dob: { type: Date },
  mobile: { type: String, trim: true, default: '' },
  profilePicture: { type: String, default: '' },

  // --- NEW AUTH FIELDS ---
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  otp: { 
    type: String, // We will store the 6-digit code here
    default: null 
  },
  otpExpires: { 
    type: Date, 
    default: null 
  }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
module.exports = User;