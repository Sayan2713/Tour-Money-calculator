const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// This is the schema for our Trip
// It defines the data structure for a "Trip" document
const tripSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  // We will add participants and expenses here later
}, {
  timestamps: true, // This automatically adds "createdAt" and "updatedAt" fields
});

// We compile the schema into a "Model"
const Trip = mongoose.model('Trip', tripSchema);

// And export it so we can use it in other files
module.exports = Trip;