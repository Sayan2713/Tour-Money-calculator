const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Define the schema for a new user
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Ensures no two users can have the same email
    trim: true,
    lowercase: true,
    // Simple regex validation for basic email format
    match: [/.+@.+\..+/, "Please enter a valid email address"]
  },
  password: {
    type: String,
    required: true,
  },
  // We can add roles, names, etc., here later if needed
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);

module.exports = User;