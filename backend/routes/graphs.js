const router = require('express').Router();
const auth = require('../middleware/auth');
const Expense = require('../models/expense.model');

router.get('/expenses/:tripId', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({
      tripId: req.params.tripId   
    });

    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to load graph data' });
  }
});

module.exports = router;
