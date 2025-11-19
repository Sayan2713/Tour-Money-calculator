const router = require('express').Router();
const bcrypt = require('bcryptjs'); // Changed to bcryptjs to match installation
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Native Node module for generating OTPs
const nodemailer = require('nodemailer'); // For sending emails
let User = require('../models/user.model');

// Get the secret key from the .env file
const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10;

// --- EMAIL CONFIGURATION (Nodemailer) ---
// You must fill this in for OTPs to work
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS       
  }
});

// ############################################################################
// 1. User SIGNUP (Registration)
// ############################################################################
router.route('/signup').post(async (req, res) => {
  try {
    // We now accept name, mobile, and dob from the new UI
    const { email, password, name, mobile, dob } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json('Error: Email already registered.');
    }

    // 1. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Create the new user object with ALL profile fields
    const newUser = new User({
      email,
      password: hashedPassword,
      name: name || '',
      mobile: mobile || '',
      dob: dob || null
    });

    // 3. Save the user to the database
    await newUser.save();

    // 4. Create JWT token
    const token = jwt.sign({ id: newUser._id }, jwtSecret, { expiresIn: '1d' });

    // Send response
    res.json({ message: 'User registered successfully!', token, userId: newUser._id });

  } catch (err) {
    res.status(500).json('Error: Failed to register user. ' + err.message);
  }
});


// ############################################################################
// 2. User LOGIN (Authentication)
// ############################################################################
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

    res.json({ message: 'Login successful!', token, userId: user._id });

  } catch (err) {
    res.status(500).json('Error: Login failed. ' + err.message);
  }
});


// ############################################################################
// 3. FORGOT PASSWORD ROUTES (Phase 1 - New Features)
// ############################################################################

// --- Step A: Initiate (Check User & Send OTP) ---
router.post('/forgot-init', async (req, res) => {
  const { email, dob } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Verify DOB if it exists in DB
    if (user.dob && dob) {
        const userDob = new Date(user.dob).toISOString().split('T')[0];
        if (userDob !== dob) {
            return res.status(400).json({ msg: "Date of Birth does not match our records." });
        }
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 Minutes
    await user.save();

    // Send Email
    await transporter.sendMail({
        from: 'TripSplit App',
        to: email,
        subject: 'Password Reset OTP',
        html: `
          <h3>Password Reset Request</h3>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="color: #006b74; letter-spacing: 5px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        `
    });

    res.json({ msg: "OTP sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Step B: Verify OTP ---
router.post('/forgot-verify', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    res.json({ msg: "OTP Verified" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Step C: Reset Password ---
router.post('/forgot-reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Double check OTP security
    if (user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ msg: "Invalid session. Please try again." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear OTP fields so it can't be reused
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ msg: "Password reset successful! Please login." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;