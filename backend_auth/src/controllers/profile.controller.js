const User = require('../models/User.model');

async function getProfile(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('_id email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ id: user._id, email: user.email });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getProfile };
