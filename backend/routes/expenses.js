const router = require('express').Router();
const auth = require('../middleware/auth'); 
let Expense = require('../models/expense.model');
let Trip = require('../models/trip.model'); 

// --- GET All Expenses for a specific Trip (Protected) ---
router.route('/:tripId').get(auth, (req, res) => {
  // Everyone in the trip can SEE all expenses
  Expense.find({ tripId: req.params.tripId })
    .then(expenses => res.json(expenses))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Expense (Protected) ---
router.route('/add').post(auth, (req, res) => {
  // We now accept splitType and splitDetails from the frontend
  const { title, amount, category, payer, sharedBy, splitType, splitDetails, tripId } = req.body;
  const userId = req.user.id; 

  if (!title || !amount || !payer || !tripId) {
    return res.status(400).json('Error: Basic fields are required.');
  }

  // --- LOGIC TO HANDLE DIFFERENT SPLIT TYPES ---
  let finalSplitDetails = splitDetails;
  let finalSharedBy = sharedBy;

  // 1. Equal Split (Default / Backward Compatibility)
  // If frontend sends 'EQUAL' and just a list of names, we calculate details here
  if ((!finalSplitDetails || finalSplitDetails.length === 0) && (splitType === 'EQUAL' || !splitType) && sharedBy && sharedBy.length > 0) {
      const share = Number(amount) / sharedBy.length;
      finalSplitDetails = sharedBy.map(name => ({
          name,
          value: 1, // 1 share
          amount: share, // Calculated amount
          item: ''
      }));
      finalSharedBy = sharedBy;
  }
  
  // 2. Uneven Split (Percent/Exact)
  // If frontend sends details, we extract names for the simple sharedBy list
  if (finalSplitDetails && finalSplitDetails.length > 0) {
      if (!finalSharedBy || finalSharedBy.length === 0) {
          finalSharedBy = finalSplitDetails.map(d => d.name);
      }
  }

  if (!finalSharedBy || finalSharedBy.length === 0) {
      return res.status(400).json('Error: Must share with at least one person.');
  }

  const newExpense = new Expense({
    title,
    amount: Number(amount),
    category,
    payer,
    sharedBy: finalSharedBy, // Simple list for quick display
    splitType: splitType || 'EQUAL',
    splitDetails: finalSplitDetails, // Detailed breakdown
    tripId,
    userId, // Save the Creator's ID
  });

  newExpense.save()
    .then(() => res.json('Expense added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- UPDATE an Expense (Protected) ---
router.route('/update/:id').put(auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json('Expense not found');

    const trip = await Trip.findById(expense.tripId);
    if (!trip) return res.status(404).json('Trip not found');

    // PERMISSION CHECK
    const isExpenseCreator = expense.userId.toString() === req.user.id;
    const isTripAdmin = trip.userId.toString() === req.user.id;

    if (!isExpenseCreator && !isTripAdmin) {
        return res.status(401).json('Not authorized. Only the expense creator or trip admin can edit this.');
    }

    // UPDATE FIELDS
    expense.title = req.body.title || expense.title;
    expense.amount = Number(req.body.amount) || expense.amount;
    expense.category = req.body.category || expense.category;
    expense.payer = req.body.payer || expense.payer;
    
    // Handle Split Updates
    if (req.body.splitType) expense.splitType = req.body.splitType;
    
    // Scenario A: Updating with new Detailed Splits (Percent/Exact)
    if (req.body.splitDetails && req.body.splitDetails.length > 0) {
        expense.splitDetails = req.body.splitDetails;
        expense.sharedBy = req.body.splitDetails.map(d => d.name);
    } 
    // Scenario B: Updating back to Equal Split with just names
    else if (req.body.sharedBy && req.body.splitType === 'EQUAL') {
        expense.sharedBy = req.body.sharedBy;
        const share = expense.amount / req.body.sharedBy.length;
        expense.splitDetails = req.body.sharedBy.map(name => ({
            name, value: 1, amount: share, item: ''
        }));
    }

    await expense.save();
    res.json('Expense updated!');

  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// --- DELETE an Expense (Protected) ---
router.route('/delete/:id').delete(auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json('Expense not found');
    const trip = await Trip.findById(expense.tripId);
    
    const isExpenseCreator = expense.userId.toString() === req.user.id;
    const isTripAdmin = trip && trip.userId.toString() === req.user.id;

    if (!isExpenseCreator && !isTripAdmin) {
         return res.status(401).json('Not authorized. Only the expense creator or trip admin can delete this.');
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json('Expense deleted!');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;