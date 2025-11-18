const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios'); // <--- ADDED: Required for Google Login
let User = require('../models/user.model');

const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10;

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ############################################################################
// 1. SIGNUP STEP 1: Initiate (Save User & Send OTP)
// ############################################################################
router.route('/signup').post(async (req, res) => {
  try {
    const { email, password, name, mobile, dob } = req.body;

    // 1. Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ msg: 'Email already registered and verified.' });
      } else {
        // User exists but is NOT verified. We can overwrite them (re-register).
        await User.findByIdAndDelete(user._id);
      }
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 Mins

    // 4. Create User (isVerified: false)
    const newUser = new User({
      email,
      password: hashedPassword,
      name: name || '',
      mobile: mobile || '',
      dob: dob || null,
      isVerified: false,
      otp,
      otpExpires
    });

    await newUser.save();

    // 5. Send OTP Email
    await transporter.sendMail({
        from: '"TripSplit Security" <' + process.env.EMAIL_USER + '>',
        to: email,
        subject: 'Verify Your Account - TripSplit',
        html: `
          <h3>Welcome to TripSplit!</h3>
          <p>To complete your registration, please verify your email.</p>
          <p>Your Verification Code is:</p>
          <h1 style="color: #006b74; letter-spacing: 5px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        `
    });

    res.json({ msg: 'Verification code sent to email', email });

  } catch (err) {
    res.status(500).json({ msg: 'Error registering user: ' + err.message });
  }
});


// ############################################################################
// 2. SIGNUP STEP 2: Verify OTP & Complete Registration
// ############################################################################
router.route('/signup-verify').post(async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    if (user.isVerified) return res.status(400).json({ msg: 'User already verified. Please login.' });

    // Check OTP
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Verify Success!
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Create Token (Auto Login)
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });

    res.json({ message: 'Registration successful!', token, userId: user._id });

  } catch (err) {
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});


// ############################################################################
// 3. LOGIN (Normal Email/Password)
// ############################################################################
router.route('/login').post(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: 'Invalid email or password.' });

    // Check Verification Status
    if (!user.isVerified) {
       return res.status(401).json({ msg: 'Please verify your email first. Sign up again to get a new code.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Invalid email or password.' });

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });

    res.json({ message: 'Login successful!', token, userId: user._id });

  } catch (err) {
    res.status(500).json({ msg: 'Login failed: ' + err.message });
  }
});


// ############################################################################
// 4. GOOGLE LOGIN (New Feature)
// ############################################################################
router.post('/google', async (req, res) => {
  try {
    const { accessToken } = req.body;

    // 1. Verify token by calling Google's UserInfo API
    const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
        }
    });

    const { email, name, picture } = googleRes.data;

    // 2. Check if user exists
    let user = await User.findOne({ email });

    if (user) {
        // User exists -> Generate Token
        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });
        return res.json({ message: 'Login successful!', token, userId: user._id });
    }

    // 3. User doesn't exist -> Register them automatically
    // We generate a random password since they use Google to login
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

    const newUser = new User({
        email,
        password: hashedPassword,
        name: name,
        profilePicture: picture,
        isVerified: true // Auto-verified since Google vetted them
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, jwtSecret, { expiresIn: '1d' });
    res.json({ message: 'Google Signup successful!', token, userId: newUser._id });

  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: 'Google Auth Failed' });
  }
});


// ############################################################################
// 5. FORGOT PASSWORD ROUTES
// ############################################################################
router.post('/forgot-init', async (req, res) => {
  const { email, dob } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.dob && dob) {
        const userDob = new Date(user.dob).toISOString().split('T')[0];
        if (userDob !== dob) return res.status(400).json({ msg: "Date of Birth does not match." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
        from: '"TripSplit Security" <' + process.env.EMAIL_USER + '>', 
        to: email, 
        subject: 'Password Reset OTP',
        html: `<h3>Password Reset</h3><p>Your OTP is:</p><h1>${otp}</h1>`
    });

    res.json({ msg: "OTP sent to your email." });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/forgot-verify', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ msg: "Invalid OTP" });
    }
    res.json({ msg: "OTP Verified" });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/forgot-reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ msg: "Invalid Session" });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = null; user.otpExpires = null;
    await user.save();
    res.json({ msg: "Password reset successful!" });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;