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
  
  // We keep 'sharedBy' as a simple array of strings for backward compatibility 
  // and for quick filtering/display of names.
  sharedBy: {
    type: [String], 
    required: true,
    validate: [val => val.length > 0, 'sharedBy array cannot be empty']
  },

  // --- NEW FIELDS FOR UNEVEN SPLITS ---
  
  // The type of split chosen by the user
  splitType: { 
      type: String, 
      enum: ['EQUAL', 'PERCENT', 'EXACT'], 
      default: 'EQUAL' 
  },

  // Detailed breakdown of who owes what
  // This is required if splitType is PERCENT or EXACT
  splitDetails: [{
      name: { type: String, required: true },
      // 'value' stores the raw input:
      // - For PERCENT: stores the percentage (e.g., 50 for 50%)
      // - For EXACT: stores the amount (e.g., 100 for 100 Rs)
      // - For EQUAL: stores 1 (representing 1 share)
      value: { type: Number, default: 0 }, 
      
      // 'amount' stores the final calculated currency amount this person owes
      amount: { type: Number, required: true }, 
      
      // Optional: For "Split by Amount" item description (e.g., "Chicken Biryani")
      item: { type: String, default: '' } 
  }],

  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
  },
  
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