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
  // --- NEW PROFILE FIELDS ---
  name: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  dob: { type: Date },
  mobile: { type: String, trim: true, default: '' },
  // We will store the image as a Base64 string for simplicity
  profilePicture: { type: String, default: '' } 
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
module.exports = User;