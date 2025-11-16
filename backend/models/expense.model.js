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
  payer: {
    type: String,
    required: true,
    trim: true
  },
  sharedBy: {
    type: [String], // Defines an Array of Strings
    required: true,
    validate: [val => val.length > 0, 'sharedBy array cannot be empty']
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
  },
  // --- NEW ---
  // Add a reference to the User who owns this expense
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;