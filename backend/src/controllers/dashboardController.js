const User = require('../models/User');
const Company = require('../models/Company');
const EmailLog = require('../models/EmailLog');

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const emailsSent = await EmailLog.countDocuments({ status: 'Success' });

    res.status(200).json({
      totalUsers,
      totalCompanies,
      emailsSent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
