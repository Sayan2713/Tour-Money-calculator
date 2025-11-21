const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
let User = require('../models/user.model');

const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10;

/* -------------------------------------------------------------------------- */
/*                      BREVO EMAIL API (Render Compatible)                   */
/* -------------------------------------------------------------------------- */
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// API Key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Email Sender
const brevoEmail = new SibApiV3Sdk.TransactionalEmailsApi();

// Reusable Email Function
async function sendEmail(to, subject, htmlContent) {
  try {
    await brevoEmail.sendTransacEmail({
      sender: { name: "TripSplit Security", email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      htmlContent
    });
  } catch (error) {
    console.error("Brevo API Email Error:", error);
    throw new Error("Email sending failed");
  }
}

/* -------------------------------------------------------------------------- */
/*                               SIGNUP STEP 1                                */
/* -------------------------------------------------------------------------- */
router.route('/signup').post(async (req, res) => {
  try {
    const { email, password, name, mobile, dob } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ msg: 'Email already registered and verified.' });
      } else {
        await User.findByIdAndDelete(user._id);
      }
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      mobile,
      dob,
      isVerified: false,
      otp,
      otpExpires
    });

    await newUser.save();

    // Send OTP via Brevo API
    await sendEmail(
      email,
      'Verify Your Account - TripSplit',
      `
        <h3>Welcome to TripSplit!</h3>
        <p>Your Verification Code is:</p>
        <h1 style="color:#006b74;letter-spacing:5px;">${otp}</h1>
      `
    );

    res.json({ msg: 'Verification code sent to email', email });

  } catch (err) {
    res.status(500).json({ msg: 'Error registering user: ' + err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                        SIGNUP STEP 2 (Verify OTP)                          */
/* -------------------------------------------------------------------------- */
router.route('/signup-verify').post(async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ msg: 'User already verified. Please login.' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });

    res.json({ message: 'Registration successful!', token, userId: user._id });

  } catch (err) {
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                                   LOGIN                                    */
/* -------------------------------------------------------------------------- */
router.route('/login').post(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: 'Invalid email or password.' });

    if (!user.isVerified) {
      return res.status(401).json({ msg: 'Please verify your email first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Invalid email or password.' });

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });

    res.json({ message: 'Login successful!', token, userId: user._id });

  } catch (err) {
    res.status(500).json({ msg: 'Login failed: ' + err.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                          FORGOT PASSWORD                                    */
/* -------------------------------------------------------------------------- */
router.post('/forgot-init', async (req, res) => {
  const { email, dob } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const userDob = new Date(user.dob).toISOString().split('T')[0];
    if (dob && userDob !== dob) {
      return res.status(400).json({ msg: "Date of Birth does not match." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(
      email,
      'Password Reset OTP',
      `
        <h3>Password Reset</h3>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
      `
    );

    res.json({ msg: "OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
