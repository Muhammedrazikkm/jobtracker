const EmailLog = require('../models/EmailLog');

exports.trackEmailOpen = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await EmailLog.findById(logId);
    if (log && !log.opened) {
      log.opened = true;
      log.openedAt = new Date();
      await log.save();
    }
  } catch (error) {
    console.error('Tracking error:', error.message);
  }

  // Return a 1x1 transparent GIF pixel
  const buf = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': buf.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(buf);
};
