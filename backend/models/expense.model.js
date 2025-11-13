const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// This is the schema for our Expense
const expenseSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01 // Amount must be positive
  },
  category: {
    type: String,
    trim: true,
    default: 'Misc' // Default category if none provided
  },
  
  // We will store the *name* of the participant who paid
  // We *could* store the participant's _id, but storing the name
  // is simpler for this project and avoids extra lookups.
  payer: {
    type: String,
    required: true,
    trim: true
  },

  // An array of participant *names* who are splitting this bill
  sharedBy: {
    type: [String], // Defines an Array of Strings
    required: true,
    // Add validation to ensure the array is not empty
    validate: [val => val.length > 0, 'sharedBy array cannot be empty']
  },
  
  // Link back to the Trip
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;