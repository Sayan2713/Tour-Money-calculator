const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Removed minlength: 3 validation rule
const tripSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // --- NEW ---
  // Add a reference to the User who owns this trip
  userId: {
    type: mongoose.Schema.Types.ObjectId, // This is a special data type for MongoDB IDs
    ref: 'User', // This tells Mongoose it refers to our 'User' model
    required: true
  }
}, {
  timestamps: true,
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;