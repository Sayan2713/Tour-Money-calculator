const router = require('express').Router();
const auth = require('../middleware/auth'); 
let Participant = require('../models/participant.model');

// --- GET All Participants for a specific Trip (Protected) ---
router.route('/:tripId').get(auth, (req, res) => {
  // 🔧 FIX: Removed 'userId: req.user.id'
  // Now we fetch ALL participants for this trip, regardless of who added them.
  Participant.find({ tripId: req.params.tripId })
    .then(participants => res.json(participants))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Participant to a Trip (Protected) ---
router.route('/add').post(auth, (req, res) => {
  const { name, tripId } = req.body;
  const userId = req.user.id; 

  if (!name || !tripId) {
    return res.status(400).json('Error: name and tripId are required.');
  }

  const newParticipant = new Participant({
    name,
    tripId,
    userId, 
  });

  newParticipant.save()
    .then(() => res.json('Participant added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- DELETE a Participant (Protected) ---
// Note: Currently, only the user who ADDED the participant can delete them.
// This is generally safe for collaboration.
router.route('/delete/:id').delete(auth, async (req, res) => {
  try {
    const participant = await Participant.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!participant) {
      return res.status(404).json('Error: Participant not found or you are not authorized to delete it.');
    }

    res.json('Participant deleted!');
  } catch (err) {
    res.status(400).json('Error: ' + err);
  }
});

module.exports = router;