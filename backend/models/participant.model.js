const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const participantSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
  },
  // --- NEW ---
  // Add a reference to the User who owns this participant data
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
});

const Participant = mongoose.model('Participant', participantSchema);

module.exports = Participant;