const router = require('express').Router();
const auth = require('../middleware/auth'); 
let Expense = require('../models/expense.model');
let Trip = require('../models/trip.model'); // <-- We need this to find the Trip Owner

// --- GET All Expenses for a specific Trip (Protected) ---
router.route('/:tripId').get(auth, (req, res) => {
  // Everyone in the trip can SEE all expenses
  Expense.find({ tripId: req.params.tripId })
    .then(expenses => res.json(expenses))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Expense (Protected) ---
router.route('/add').post(auth, (req, res) => {
  const { title, amount, category, payer, sharedBy, tripId } = req.body;
  const userId = req.user.id; 

  if (!title || !amount || !payer || !sharedBy || !tripId) {
    return res.status(400).json('Error: All fields are required.');
  }

  const newExpense = new Expense({
    title,
    amount: Number(amount),
    category,
    payer,
    sharedBy,
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
    // 1. Find the expense
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json('Expense not found');

    // 2. Find the Trip to see who the Admin is
    const trip = await Trip.findById(expense.tripId);
    if (!trip) return res.status(404).json('Trip not found');

    // 3. PERMISSION CHECK:
    // Allow if: User created this expense OR User created the trip
    const isExpenseCreator = expense.userId.toString() === req.user.id;
    const isTripAdmin = trip.userId.toString() === req.user.id;

    if (!isExpenseCreator && !isTripAdmin) {
        return res.status(401).json('Not authorized. Only the expense creator or trip admin can edit this.');
    }

    // 4. Proceed with Update
    expense.title = req.body.title || expense.title;
    expense.amount = Number(req.body.amount) || expense.amount;
    expense.category = req.body.category || expense.category;
    expense.payer = req.body.payer || expense.payer;
    expense.sharedBy = req.body.sharedBy || expense.sharedBy;

    await expense.save();
    res.json('Expense updated!');

  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// --- DELETE an Expense (Protected) ---
router.route('/delete/:id').delete(auth, async (req, res) => {
  try {
    // 1. Find the expense
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json('Expense not found');

    // 2. Find the Trip
    const trip = await Trip.findById(expense.tripId);
    
    // 3. PERMISSION CHECK:
    // Allow if: User created this expense OR User created the trip
    const isExpenseCreator = expense.userId.toString() === req.user.id;
    const isTripAdmin = trip && trip.userId.toString() === req.user.id;

    if (!isExpenseCreator && !isTripAdmin) {
         return res.status(401).json('Not authorized. Only the expense creator or trip admin can delete this.');
    }

    // 4. Delete
    await Expense.findByIdAndDelete(req.params.id);
    res.json('Expense deleted!');

  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;