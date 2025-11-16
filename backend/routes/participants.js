const router = require('express').Router();
const auth = require('../middleware/auth'); // <-- NEW: Import the auth middleware
let Participant = require('../models/participant.model');

// --- GET All Participants for a specific Trip (Protected) ---
// We add 'auth' middleware
router.route('/:tripId').get(auth, (req, res) => {
  // We check for both the tripId AND the user's ID
  Participant.find({ tripId: req.params.tripId, userId: req.user.id })
    .then(participants => res.json(participants))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Participant to a Trip (Protected) ---
router.route('/add').post(auth, (req, res) => {
  const { name, tripId } = req.body;
  const userId = req.user.id; // <-- NEW: Get the user's ID

  if (!name || !tripId) {
    return res.status(400).json('Error: name and tripId are required.');
  }

  const newParticipant = new Participant({
    name,
    tripId,
    userId, // <-- NEW: Save the owner's ID
  });

  newParticipant.save()
    .then(() => res.json('Participant added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- DELETE a Participant (Protected) ---
router.route('/delete/:id').delete(auth, async (req, res) => {
  try {
    // We must find the participant by its ID AND the user's ID to ensure they own it
    const participant = await Participant.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!participant) {
      return res.status(404).json('Error: Participant not found or user not authorized.');
    }

    // Note: We will need to update associated expenses in a later step
    // For now, we just delete the participant.
    res.json('Participant deleted!');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;