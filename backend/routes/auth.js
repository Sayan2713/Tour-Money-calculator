const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios'); // Required for Google Login
const nodemailer = require('nodemailer'); // Standard Nodemailer
let User = require('../models/user.model');

const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10;

// --- EMAIL CONFIGURATION (Gmail SMTP) ---
// This connects directly to Gmail servers.
// Ensure your .env file has:
// EMAIL_USER=your_gmail_address
// EMAIL_PASS=your_16_char_app_password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to send email
async function sendEmail(to, subject, htmlContent) {
  try {
    const info = await transporter.sendMail({
      from: '"TripSplit Security" <' + process.env.EMAIL_USER + '>',
      to: to,
      subject: subject,
      html: htmlContent
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Email Error:", error);
    throw new Error("Email sending failed"); 
  }
}

/* -------------------------------------------------------------------------- */
/* SIGNUP STEP 1                                 */
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

    // Send OTP via Gmail SMTP
    await sendEmail(
      email,
      'Verify Your Account - TripSplit',
      `
        <h3>Welcome to TripSplit!</h3>
        <p>Your Verification Code is:</p>
        <h1 style="color:#006b74;letter-spacing:5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      `
    );

    res.json({ msg: 'Verification code sent to email', email });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ msg: 'Error registering user: ' + err.message });
  }
});

/* -------------------------------------------------------------------------- */
/* SIGNUP STEP 2 (Verify OTP)                          */
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
/* LOGIN                                    */
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
/* GOOGLE LOGIN (Restored)                            */
/* -------------------------------------------------------------------------- */
router.post('/google', async (req, res) => {
  try {
    const { accessToken } = req.body;

    const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
        }
    });

    const { email, name, picture } = googleRes.data;
    let user = await User.findOne({ email });

    if (user) {
        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });
        return res.json({ message: 'Login successful!', token, userId: user._id });
    }

    // Google users are auto-verified
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

    const newUser = new User({
        email,
        password: hashedPassword,
        name,
        profilePicture: picture,
        isVerified: true 
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, jwtSecret, { expiresIn: '1d' });
    res.json({ message: 'Google Signup successful!', token, userId: newUser._id });

  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: 'Google Auth Failed' });
  }
});

/* -------------------------------------------------------------------------- */
/* FORGOT PASSWORD                                */
/* -------------------------------------------------------------------------- */
router.post('/forgot-init', async (req, res) => {
  const { email, dob } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Handle string/date comparison carefully
    if (user.dob && dob) {
        // Convert stored date to YYYY-MM-DD
        const userDob = new Date(user.dob).toISOString().split('T')[0];
        if (userDob !== dob) {
            return res.status(400).json({ msg: "Date of Birth does not match." });
        }
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