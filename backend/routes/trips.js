const router = require('express').Router();
let Trip = require('../models/trip.model');
let Participant = require('../models/participant.model');
let Expense = require('../models/expense.model');

// --- GET All Trips ---
router.route('/').get((req, res) => {
  Trip.find()
    .then(trips => res.json(trips))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Trip ---
router.route('/add').post((req, res) => {
  const name = req.body.name;
  const newTrip = new Trip({ name });

  newTrip.save()
    .then(() => res.json('Trip added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- UPDATE a Trip ---
router.route('/update/:id').put(async (req, res) => {
  try {
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true } // return updated document
    );

    if (!updatedTrip) {
      return res.status(404).json('Trip not found');
    }

    res.json(updatedTrip);
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

// --- DELETE a Trip (and all related data) ---
router.route('/delete/:id').delete(async (req, res) => {
  const tripId = req.params.id;

  try {
    // 1. Delete all associated Expenses
    await Expense.deleteMany({ tripId: tripId });

    // 2. Delete all associated Participants
    await Participant.deleteMany({ tripId: tripId });

    // 3. Delete the Trip itself
    const result = await Trip.findByIdAndDelete(tripId);

    if (!result) {
      return res.status(404).json('Error: Trip not found.');
    }

    res.json('Trip and associated data deleted!');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;
