const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const axios = require("axios");
let User = require("../models/user.model");

const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10;

// ------------------ EMAIL CONFIG ------------------
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// ###################################################
// 1. SIGNUP — SEND OTP
// ###################################################
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, mobile, dob } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified)
        return res.status(400).json({ msg: "Email already registered." });

      await User.findByIdAndDelete(user._id);
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
      otpExpires,
    });

    await newUser.save();

    console.log("Attempting to send email to:", email);

    // ---------------- REAL MAIL SEND + REAL ERRORS ----------------
    try {
      const info = await transporter.sendMail({
        from: `"TripSplit Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Account - TripSplit",
        html: `
          <h3>Welcome to TripSplit!</h3>
          <p>Your Verification Code:</p>
          <h1>${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        `,
      });

      console.log("✔ REAL EMAIL SENT:", info.messageId);

    } catch (mailErr) {
      console.error("❌ EMAIL SEND ERROR:", mailErr);
      return res.status(500).json({ msg: "Email not sent", error: mailErr.message });
    }

    return res.json({ msg: "OTP email sent", email });

  } catch (err) {
    return res.status(500).json({ msg: "Error registering user: " + err.message });
  }
});

// ###################################################
// 2. VERIFY OTP
// ###################################################
router.post("/signup-verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now())
      return res.status(400).json({ msg: "Invalid or expired OTP" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "1d" });
    return res.json({ message: "Registration successful!", token, userId: user._id });

  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// ###################################################
// 3. LOGIN
// ###################################################
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "Invalid email or password." });

    if (!user.isVerified)
      return res.status(401).json({ msg: "Please verify your email first." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid email or password." });

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "1d" });
    return res.json({ message: "Login successful!", token, userId: user._id });

  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// ###################################################
// export
// ###################################################
module.exports = router;
