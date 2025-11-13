const router = require('express').Router();
let Expense = require('../models/expense.model');

// --- GET All Expenses for a specific Trip ---
router.route('/:tripId').get((req, res) => {
  Expense.find({ tripId: req.params.tripId })
    .then(expenses => res.json(expenses))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Expense to a Trip ---
router.route('/add').post((req, res) => {
  const { title, amount, category, payer, sharedBy, tripId } = req.body;

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
  });

  newExpense.save()
    .then(() => res.json('Expense added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- UPDATE an Expense by ID ---
router.route('/update/:id').put((req, res) => {
  Expense.findById(req.params.id)
    .then(expense => {
      if (!expense) return res.status(404).json('Error: Expense not found.');

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

// --- DELETE an Expense by ID ---
router.route('/delete/:id').delete((req, res) => {
  Expense.findByIdAndDelete(req.params.id)
    .then(result => {
      if (!result) return res.status(404).json('Error: Expense not found.');
      res.json('Expense deleted!');
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
