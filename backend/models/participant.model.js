const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// This is the schema for our Participant
const participantSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // This is the link back to the Trip
  // It stores the unique MongoDB _id of the trip
  tripId: {
    type: mongoose.Schema.Types.ObjectId, // This is a special data type for MongoDB IDs
    ref: 'Trip', // This tells Mongoose it refers to our 'Trip' model
    required: true,
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const Participant = mongoose.model('Participant', participantSchema);

module.exports = Participant;