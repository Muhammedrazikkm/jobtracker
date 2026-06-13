const EmailLog = require('../models/EmailLog');

exports.getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { companyName: { $regex: search, $options: 'i' } },
          { companyEmail: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const totalLogs = await EmailLog.countDocuments(query);
    const logs = await EmailLog.find(query).sort({ sentAt: -1 }).skip(skip).limit(limit);

    res.status(200).json({
      logs,
      currentPage: page,
      totalPages: Math.ceil(totalLogs / limit),
      totalLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearLogs = async (req, res) => {
  try {
    await EmailLog.deleteMany({});
    res.status(200).json({ message: 'All email logs cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
