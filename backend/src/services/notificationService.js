const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Creates an in-app notification for a citizen
 */
async function createNotification({ userId, title, message, type = 'general', relatedComplaintId = null }) {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      relatedComplaint: relatedComplaintId,
    });
    return notification;
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error.message);
    return null;
  }
}

/**
 * Awards reward points to a citizen and sends them a notification
 */
async function awardRewardPoints(userId, points, reason, relatedComplaintId = null) {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { rewardPoints: points } },
      { new: true }
    );

    if (user) {
      await createNotification({
        userId,
        title: `+${points} Civic Reward Points!`,
        message: `You earned ${points} reward points for: ${reason}. Your total score is now ${user.rewardPoints} pts!`,
        type: 'reward_earned',
        relatedComplaintId,
      });
    }

    return user;
  } catch (error) {
    console.error('[Notification Service] Error awarding points:', error.message);
    return null;
  }
}

module.exports = {
  createNotification,
  awardRewardPoints,
};
