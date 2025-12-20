const User = require('../models/user.model');

module.exports = (requiredPlans = []) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json('User not found');
      }

      // ⏳ Auto-expire subscription
      if (
        user.subscriptionPlan !== 'free' &&
        user.subscriptionExpiresAt &&
        new Date() > user.subscriptionExpiresAt
      ) {
        user.subscriptionPlan = 'free';
        user.subscriptionExpiresAt = null;
        await user.save();
      }

      // 🔒 Check allowed plans
      if (
        requiredPlans.length &&
        !requiredPlans.includes(user.subscriptionPlan)
      ) {
        return res.status(403).json('Subscription expired or insufficient plan');
      }

      // Attach updated user
      req.userDoc = user;
      next();
    } catch (err) {
      console.error('checkSubscription error:', err);
      res.status(500).json('Subscription check failed');
    }
  };
};
