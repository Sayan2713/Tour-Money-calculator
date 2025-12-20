const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/user.model');

// Razorpay instance (TEST MODE)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Plan pricing (amount in paise)
const PLANS = {
  basic: { name: 'Basic Plan', amount: 50100 },     // ₹501
  advance: { name: 'Advance Plan', amount: 100100 }, // ₹1001
  premium: { name: 'Premium Plan', amount: 210100 }  // ₹2101
};

const PLAN_DURATION_DAYS = 30;

// ---------------- CREATE ORDER ----------------
router.post('/create-order', auth, async (req, res) => {
  const { planId } = req.body;
  const plan = PLANS[planId];

  if (!plan) {
    return res.status(400).json({ msg: 'Invalid plan selected' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user.id,
        planId
      }
    });

    res.json(order);
  } catch (err) {
    console.error('Razorpay Order Error:', err);
    res.status(500).json({ msg: 'Order creation failed' });
  }
});

// ---------------- VERIFY PAYMENT + EXPIRY ----------------
router.post('/verify-payment', auth, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId
  } = req.body;

  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ msg: 'Payment verification failed' });
    }

    // ✅ Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + PLAN_DURATION_DAYS);

    const user = await User.findById(req.user.id);
    user.subscriptionPlan = planId;
    user.subscriptionExpiresAt = expiryDate;
    await user.save();

    res.json({
      success: true,
      plan: planId,
      expiresAt: expiryDate
    });
  } catch (err) {
    console.error('Verification Error:', err);
    res.status(500).json({ msg: 'Verification failed' });
  }
});

module.exports = router;
