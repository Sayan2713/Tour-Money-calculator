const router = require('express').Router();
let Participant = require('../models/participant.model');

// --- GET All Participants for a specific Trip ---
router.route('/:tripId').get((req, res) => {
  Participant.find({ tripId: req.params.tripId })
    .then(participants => res.json(participants))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- ADD a New Participant to a Trip ---
router.route('/add').post((req, res) => {
  const { name, tripId } = req.body;

  if (!name || !tripId) {
    return res.status(400).json('Error: name and tripId are required.');
  }

  const newParticipant = new Participant({
    name,
    tripId,
  });

  newParticipant.save()
    .then(() => res.json('Participant added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- DELETE a Participant ---
router.route('/delete/:id').delete((req, res) => {
  Participant.findByIdAndDelete(req.params.id)
    .then(result => {
      if (!result) {
        return res.status(404).json('Error: Participant not found.');
      }
      // Note: We do not need to delete expenses here, as the calculation logic in the frontend
      // automatically ignores deleted participant names when calculating the share.
      res.json('Participant deleted!');
    })
    .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;
