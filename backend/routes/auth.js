const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
let User = require('../models/user.model');

// Get the secret key from the .env file
const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10; // Standard hashing complexity

// --- 1. User SIGNUP (Registration) ---
router.route('/signup').post(async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json('Error: Email already registered.');
    }

    // 1. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Create the new user object
    const newUser = new User({
      email,
      password: hashedPassword, // Save the HASHED password
    });

    // 3. Save the user to the database
    await newUser.save();

    // 4. Create JWT token (Payload includes the new user's ID)
    const token = jwt.sign({ id: newUser._id }, jwtSecret, { expiresIn: '1d' });

    // Send the token and user ID back to the frontend
    res.json({ message: 'User registered successfully!', token, userId: newUser._id });

  } catch (err) {
    // Handle validation errors or database errors
    res.status(500).json('Error: Failed to register user. ' + err.message);
  }
});


// --- 2. User LOGIN (Authentication) ---
router.route('/login').post(async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json('Error: Invalid email or password.');
    }

    // 2. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json('Error: Invalid email or password.');
    }

    // 3. Create a new JWT token
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });

    // Send the token and user ID back to the frontend
    res.json({ message: 'Login successful!', token, userId: user._id });

  } catch (err) {
    res.status(500).json('Error: Login failed. ' + err.message);
  }
});

module.exports = router;