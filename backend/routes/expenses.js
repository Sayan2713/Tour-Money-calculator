const router = require('express').Router();
const auth = require('../middleware/auth'); // <-- NEW: Import the auth middleware
let Expense = require('../models/expense.model');

// --- GET All Expenses for a specific Trip (Protected) ---
router.route('/:tripId').get(auth, (req, res) => {
  // We check for both the tripId AND the user's ID
  Expense.find({ tripId: req.params.tripId, userId: req.user.id })
    .then(expenses => res.json(expenses))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Expense to a Trip (Protected) ---
router.route('/add').post(auth, (req, res) => {
  const { title, amount, category, payer, sharedBy, tripId } = req.body;
  const userId = req.user.id; // <-- NEW: Get the user's ID

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
    userId, // <-- NEW: Save the owner's ID
  });

  newExpense.save()
    .then(() => res.json('Expense added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- UPDATE an Expense by ID (Protected) ---
router.route('/update/:id').put(auth, (req, res) => {
  // We must find the expense by its ID AND the user's ID
  Expense.findOne({ _id: req.params.id, userId: req.user.id })
    .then(expense => {
      if (!expense) return res.status(404).json('Error: Expense not found or user not authorized.');

      // Update fields
      expense.title = req.body.title || expense.title;
      expense.amount = Number(req.body.amount) || expense.amount;
      expense.category = req.body.category || expense.category;
      expense.payer = req.body.payer || expense.payer;
      expense.sharedBy = req.body.sharedBy || expense.sharedBy;

      expense.save()
        .then(() => res.json('Expense updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- DELETE an Expense by ID (Protected) ---
router.route('/delete/:id').delete(auth, async (req, res) => {
  try {
    // We must find the expense by its ID AND the user's ID to ensure they own it
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!expense) {
      return res.status(404).json('Error: Expense not found or user not authorized.');
    }
    res.json('Expense deleted!');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;