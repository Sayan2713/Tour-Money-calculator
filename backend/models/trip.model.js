const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tripSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // The Creator/Admin (We keep this to know who created it)
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  // --- NEW: List of Users who have access (Collaboration) ---
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;