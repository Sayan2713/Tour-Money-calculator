const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invitationSchema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true, // The unique secure code in the link
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Optional: Document automatically deletes after 7 days (604800 seconds)
  }
});

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;