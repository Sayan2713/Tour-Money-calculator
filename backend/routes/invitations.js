const router = require("express").Router();
const auth = require("../middleware/auth");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Trip = require("../models/trip.model");
const User = require("../models/user.model");
const Invitation = require("../models/Invitation");

// --- EMAIL CONFIGURATION (Brevo) ---
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 15000 
});

// --- ROUTE: Send an Invitation ---
router.post("/send", auth, async (req, res) => {
  const { email, tripId } = req.body;
  const invitedEmail = email.toLowerCase();

  try {
    // 1. Verify the Trip exists and User is the owner
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ msg: "Trip not found" });

    if (trip.userId.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "Only the trip owner can invite members." });
    }

    // 2. Check if user is already a member
    // We need to find the User ID of the invited email (if they exist)
    const existingUser = await User.findOne({ email: invitedEmail });
    if (existingUser && trip.members.includes(existingUser._id)) {
      return res
        .status(400)
        .json({ msg: "User is already a member of this trip." });
    }

    // 3. Check if an invitation is already pending
    const existingInvite = await Invitation.findOne({
      email: invitedEmail,
      tripId: tripId,
    });
    if (existingInvite) {
      return res
        .status(400)
        .json({ msg: "An invitation is already pending for this user." });
    }

    // 4. Generate a secure token
    const token = crypto.randomBytes(20).toString("hex");

    // 5. Create the Invitation Record
    const newInvitation = new Invitation({
      email: invitedEmail,
      tripId: tripId,
      invitedBy: req.user.id,
      token: token,
    });

    await newInvitation.save();

    // 6. Send the Email
    // This link points to your FRONTEND accept page
    const inviteLink = `https://tour-money-calculator-hcq4.onrender.com/accept-invite?token=${token}`;

    const mailOptions = {
      from: '"TripSplit Security" <9be925001@smtp-brevo.com>',

      to: invitedEmail,
      subject: `You're invited to join the trip: ${trip.name}`,
      html: `
        <h3>TripSplit Invitation</h3>
        <p>Your friend has invited you to join the trip <strong>${trip.name}</strong> on TripSplit.</p>
        <p>Click the link below to accept:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        <p>If you don't have an account, you'll be asked to sign up first.</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ msg: "Error sending email." });
      } else {
        console.log("Email sent: " + info.response);
        res.json({ msg: "Invitation sent successfully!" });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ... (Your existing /send route is above here) ...

// --- ROUTE: Accept an Invitation ---
router.post("/accept", auth, async (req, res) => {
  const { token } = req.body;

  try {
    // 1. Find the invitation
    const invite = await Invitation.findOne({ token });
    if (!invite)
      return res
        .status(400)
        .json({ msg: "Invalid or expired invitation link." });

    // 2. Find the trip
    const trip = await Trip.findById(invite.tripId);
    if (!trip) return res.status(404).json({ msg: "Trip no longer exists." });

    // 3. Add the current user to the trip members
    // (Check if already a member first to avoid duplicates)
    if (
      !trip.members.includes(req.user.id) &&
      trip.userId.toString() !== req.user.id
    ) {
      trip.members.push(req.user.id);
      await trip.save();
    }

    // 4. Delete the invitation (it's used now)
    await Invitation.findByIdAndDelete(invite._id);

    res.json({
      msg: "You have successfully joined the trip!",
      tripId: trip._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// module.exports = router;  <-- This should be the last line of your file

module.exports = router;

