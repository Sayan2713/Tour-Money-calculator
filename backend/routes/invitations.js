const router = require("express").Router();
const auth = require("../middleware/auth");
const crypto = require("crypto");
const Trip = require("../models/trip.model");
const User = require("../models/user.model");
const Invitation = require("../models/Invitation");

// Determine the URL based on where the code is running
// If SENDGRID_API_KEY exists (Production), use Render URL.
// Otherwise, use localhost.
const isProduction = process.env.NODE_ENV === 'production' || process.env.SENDGRID_API_KEY;
const FRONTEND_URL = isProduction 
  ? 'https://tour-money-calculator-hcq4.onrender.com' 
  : 'http://localhost:5173';

const DEFAULT_FROM_NAME = "TripSplit App";

// --- EMAIL SENDER: Try SendGrid, fallback to Nodemailer (Gmail) ---
let sendEmail;
try {
  const sgMail = require("@sendgrid/mail");
  if (!process.env.SENDGRID_API_KEY) throw new Error("Missing SENDGRID_API_KEY");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || `no-reply@tripsplit.local`;

  sendEmail = async (to, subject, htmlContent) => {
    const msg = { to, from: `${DEFAULT_FROM_NAME} <${FROM_EMAIL}>`, subject, html: htmlContent };
    const res = await sgMail.send(msg);
    console.log("SendGrid response:", Array.isArray(res) ? res[0].statusCode : res.statusCode);
    return res;
  };

  console.log("Using SendGrid for sending emails.");
} catch (sgErr) {
  // Fallback to Nodemailer (Gmail SMTP)
  const nodemailer = require("nodemailer");
  
  // Use the SAME transporter config that worked for auth.js
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  sendEmail = async (to, subject, htmlContent) => {
    const mailOptions = {
      from: `${DEFAULT_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Nodemailer sent:", info.messageId || info.response);
    return info;
  };

  console.log("SendGrid not configured — using Nodemailer fallback.");
}

/* -------------------------------------------------------------------------- */
/* ROUTE: Send an Invitation                                                  */
/* -------------------------------------------------------------------------- */
router.post("/send", auth, async (req, res) => {
  const { email, tripId } = req.body;
  if (!email || !tripId) return res.status(400).json({ msg: "Missing email or tripId" });

  const invitedEmail = email.toLowerCase();

  try {
    // 1. Verify the Trip exists and User is the owner
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ msg: "Trip not found" });

    if (trip.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Only the trip owner can invite members." });
    }

    // 2. Check if user is already a member
    const existingUser = await User.findOne({ email: invitedEmail });
    if (existingUser && trip.members.includes(existingUser._id)) {
      return res.status(400).json({ msg: "User is already a member of this trip." });
    }

    // 3. Check if an invitation is already pending
    const existingInvite = await Invitation.findOne({ email: invitedEmail, tripId: tripId });
    if (existingInvite) {
      return res.status(400).json({ msg: "An invitation is already pending for this user." });
    }

    // 4. Generate a secure token
    const token = crypto.randomBytes(20).toString("hex");

    // 5. Create the Invitation Record
    const newInvitation = new Invitation({
      email: invitedEmail,
      tripId: tripId,
      invitedBy: req.user.id,
      token: token,
      createdAt: Date.now()
    });

    await newInvitation.save();

    // 6. Build invite links
    // IMPORTANT: This uses the FRONTEND_URL calculated at the top
    const inviteLink = `${FRONTEND_URL}/accept-invite?token=${token}`;
    
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;color:#111">
        <h3>TripSplit Invitation</h3>
        <p>Your friend has invited you to join the trip <strong>${trip.name}</strong> on TripSplit.</p>
        <p>
          <a href="${inviteLink}" style="display:inline-block;padding:10px 16px;background:#006b74;color:#fff;text-decoration:none;border-radius:6px;">
            Accept Invitation
          </a>
        </p>
        <p style="font-size:0.9em;color:#555">Or copy this link:</p>
        <p style="font-size:0.9em;color:#006b74;word-break:break-all"><a href="${inviteLink}">${inviteLink}</a></p>
      </div>
    `;

    try {
      await sendEmail(invitedEmail, `You're invited to join the trip: ${trip.name}`, html);
      return res.json({ msg: "Invitation sent successfully!" });
    } catch (emailErr) {
      console.error("Invitation Email Error:", emailErr);
      // Clean up if email fails
      await Invitation.findByIdAndDelete(newInvitation._id).catch(() => {});
      return res.status(500).json({ msg: "Error sending invitation email." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/* ROUTE: Accept an Invitation                                                */
/* -------------------------------------------------------------------------- */
router.post("/accept", auth, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ msg: "Missing token" });

  try {
    // 1. Find the invitation
    const invite = await Invitation.findOne({ token });
    if (!invite) return res.status(400).json({ msg: "Invalid or expired invitation link." });

    // 2. Find the trip
    const trip = await Trip.findById(invite.tripId);
    if (!trip) return res.status(404).json({ msg: "Trip no longer exists." });

    // 3. Add user to members (avoid duplicates)
    if (!trip.members.includes(req.user.id) && trip.userId.toString() !== req.user.id) {
      trip.members.push(req.user.id);
      await trip.save();
    }

    // 4. Delete the invitation
    await Invitation.findByIdAndDelete(invite._id);

    return res.json({ msg: "You have successfully joined the trip!", tripId: trip._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;