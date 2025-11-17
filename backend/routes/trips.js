const router = require('express').Router();
const auth = require('../middleware/auth');
let Trip = require('../models/trip.model'); // Make sure this matches your file name (Trip.js or trip.model.js)
let Participant = require('../models/participant.model'); // Adjust if your file is named differently
let Expense = require('../models/expense.model');         // Adjust if your file is named differently

// --- GET All Trips (Protected) ---
router.route('/').get(auth, (req, res) => {
  // UPDATED QUERY:
  // Find trips where the user is the Owner OR the user is a Member
  Trip.find({ 
    $or: [
        { userId: req.user.id },       // You are the owner
        { members: req.user.id }       // You are a member
    ]
  })
    .then(trips => res.json(trips))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Trip (Protected) ---
router.route('/add').post(auth, (req, res) => {
  const name = req.body.name;
  const userId = req.user.id;

  const newTrip = new Trip({
    name,
    userId,
    members: [] // Initialize with empty members list
  });

  newTrip.save()
    .then(() => res.json('Trip added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- DELETE a Trip (Protected) ---
// NOTE: We keep this strictly for the OWNER. 
// Members should not be able to delete the whole trip for everyone.
router.route('/delete/:id').delete(auth, async (req, res) => {
  const tripId = req.params.id;
  const userId = req.user.id;

  try {
    // Verify the user OWNS this trip
    const trip = await Trip.findOne({ _id: tripId, userId: userId });
    if (!trip) {
      return res.status(401).json('Error: Trip not found or you are not the owner.');
    }

    // 1. Delete associated Expenses
    // Note: We remove 'userId: userId' check here because the owner should be able
    // to delete ALL expenses in the trip, even if a friend added them.
    await Expense.deleteMany({ tripId: tripId });

    // 2. Delete associated Participants
    await Participant.deleteMany({ tripId: tripId });

    // 3. Delete the Trip itself
    await Trip.findByIdAndDelete(tripId);

    res.json('Trip and associated data deleted!');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;