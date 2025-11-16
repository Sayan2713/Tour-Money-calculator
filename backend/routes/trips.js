const router = require('express').Router();
const auth = require('../middleware/auth'); // <-- NEW: Import the auth middleware
let Trip = require('../models/trip.model');
let Participant = require('../models/participant.model');
let Expense = require('../models/expense.model');

// --- GET All Trips (Protected) ---
// We add 'auth' middleware. This route will now require a valid token.
router.route('/').get(auth, (req, res) => {
  // We only find trips where the userId matches the user's ID from the token
  Trip.find({ userId: req.user.id })
    .then(trips => res.json(trips))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Trip (Protected) ---
router.route('/add').post(auth, (req, res) => {
  const name = req.body.name;
  const userId = req.user.id; // <-- NEW: Get the user's ID from the middleware

  const newTrip = new Trip({
    name,
    userId, // <-- NEW: Save the owner's ID
  });

  newTrip.save()
    .then(() => res.json('Trip added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- DELETE a Trip (Protected) ---
router.route('/delete/:id').delete(auth, async (req, res) => {
  const tripId = req.params.id;
  const userId = req.user.id;

  try {
    // First, verify the user owns this trip
    const trip = await Trip.findOne({ _id: tripId, userId: userId });
    if (!trip) {
      return res.status(401).json('Error: Trip not found or user not authorized.');
    }

    // 1. Delete all associated Expenses (that match tripId AND userId)
    await Expense.deleteMany({ tripId: tripId, userId: userId });

    // 2. Delete all associated Participants (that match tripId AND userId)
    await Participant.deleteMany({ tripId: tripId, userId: userId });

    // 3. Delete the Trip itself
    await Trip.findByIdAndDelete(tripId);

    res.json('Trip and associated data deleted!');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;