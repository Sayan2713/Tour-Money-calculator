const router = require("express").Router();
const auth = require("../middleware/auth");
const crypto = require("crypto");
const Trip = require("../models/trip.model");
const User = require("../models/user.model");
const Invitation = require("../models/Invitation");

// ------------------ BREVO EMAIL API ------------------
const Brevo = require("@getbrevo/brevo");
const brevoClient = new Brevo.TransactionalEmailsApi();
brevoClient.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// ------------------ SEND INVITATION ------------------
router.post("/send", auth, async (req, res) => {
  const { email, tripId } = req.body;
  const invitedEmail = email.toLowerCase();

  try {
    // 1. Trip exists + user is owner
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ msg: "Trip not found" });

    if (trip.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Only the trip owner can invite members." });
    }

    // 2. Already a member
    const existingUser = await User.findOne({ email: invitedEmail });
    if (existingUser && trip.members.includes(existingUser._id)) {
      return res.status(400).json({ msg: "User is already a member of this trip." });
    }

    // 3. Already invited
    const existingInvite = await Invitation.findOne({
      email: invitedEmail,
      tripId: tripId
    });

    if (existingInvite) {
      return res.status(400).json({ msg: "Invitation already sent." });
    }

    // 4. Generate token
    const token = crypto.randomBytes(20).toString("hex");

    // 5. Store invitation
    const newInvitation = new Invitation({
      email: invitedEmail,
      tripId,
      invitedBy: req.user.id,
      token
    });

    await newInvitation.save();

    // 6. Build invite link
    const inviteLink = `https://tour-money-calculator-hcq4.onrender.com/accept-invite?token=${token}`;

    // 7. Send Email using Brevo API
    try {
      await brevoClient.sendTransacEmail({
        sender: { name: "TripSplit Security", email: "noreply@tripsplit.in" },
        to: [{ email: invitedEmail }],
        subject: `You're invited to join: ${trip.name}`,
        htmlContent: `
          <h3>TripSplit Invitation</h3>
          <p>You have been invited to join the trip <strong>${trip.name}</strong>.</p>
          <p>Click the link below to accept:</p>
          <a href="${inviteLink}" target="_blank">${inviteLink}</a>
          <p>If you don't have an account, you'll be asked to sign up first.</p>
        `
      });

      console.log("Invitation email sent to:", invitedEmail);
    } catch (error) {
      console.error("❌ BREVO INVITE ERROR:", error.message || error);
      return res.status(500).json({ msg: "Invitation email failed" });
    }

    return res.json({ msg: "Invitation sent successfully!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: err.message });
  }
});

// ------------------ ACCEPT INVITE ------------------
router.post("/accept", auth, async (req, res) => {
  const { token } = req.body;

  try {
    const invite = await Invitation.findOne({ token });
    if (!invite) {
      return res.status(400).json({ msg: "Invalid or expired invitation link." });
    }

    const trip = await Trip.findById(invite.tripId);
    if (!trip) return res.status(404).json({ msg: "Trip no longer exists." });

    // Add user to members list if they're not already included
    if (!trip.members.includes(req.user.id)) {
      trip.members.push(req.user.id);
      await trip.save();
    }

    // Delete used invitation
    await Invitation.findByIdAndDelete(invite._id);

    return res.json({
      msg: "You have successfully joined the trip!",
      tripId: trip._id
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
