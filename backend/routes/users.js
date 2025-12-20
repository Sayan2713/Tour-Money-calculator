const router = require('express').Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/user.model'); 
const Trip = require('../models/trip.model');
const Invitation = require('../models/Invitation'); 
const Participant = require('../models/participant.model');
const Expense = require('../models/expense.model');

// --- GET: Get User Profile Data ---
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- PUT: Update User Profile ---
router.put('/update', auth, async (req, res) => {
  const { name, gender, dob, mobile, profilePicture } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Update fields if they are provided
    if (name !== undefined) user.name = name;
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob;
    if (mobile !== undefined) user.mobile = mobile;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();
    // Return the updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/subscription', auth, async (req, res) => {
    const { plan } = req.body; 

    // Validate plan
    if (!['free', 'basic', 'advance', 'premium'].includes(plan)) {
        return res.status(400).json({ msg: 'Invalid plan type' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update the plan
        user.subscriptionPlan = plan;
        await user.save();
        
        console.log(`User ${user.email} upgraded to ${plan}`); // Add logging for debug
        res.json({ msg: `Subscription updated to ${plan}`, plan: user.subscriptionPlan });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- DELETE: Delete Account ---
router.delete('/delete', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Remove User from Trips they are MEMBERS of (but not owners)
    await Trip.updateMany(
        { members: userId },
        { $pull: { members: userId } }
    );

    // 2. Delete Trips owned by User (and their data)
    // Note: In a real app, this is complex. For now, we leave the data 
    // orphaned or you can write a complex script to delete all associated expenses.
    // Ideally, you'd iterate through trips and delete them one by one to trigger cleanups.
    
    // 3. Delete the User
    await User.findByIdAndDelete(userId);

    res.json({ msg: 'Account deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- POST: Change Password ---
router.post('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect old password' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;