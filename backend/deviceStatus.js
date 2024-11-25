// backend/routes/deviceStatus.js

const express = require('express');
const router = express.Router();
const db = require('../db'); // Kết nối cơ sở dữ liệu

// API lấy trạng thái thiết bị (nhiệt độ, độ ẩm, trạng thái quạt, chế độ)
router.get('/device-status', (req, res) => {
  db.query('SELECT * FROM device_status_history ORDER BY timestamp DESC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Error fetching device status:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results[0]);
  });
});

// API lấy ngưỡng nhiệt độ bật/tắt quạt
router.get('/fan-threshold', (req, res) => {
  db.query('SELECT threshold FROM device_status_history ORDER BY timestamp DESC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Error fetching fan threshold:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results[0]);
  });
});

// API gửi lệnh (Có thể dùng để điều khiển quạt, điều chỉnh nhiệt độ, ...)
router.post('/send', (req, res) => {
  const { topic, message } = req.body;
  // Logic gửi lệnh tới MQTT hoặc thiết bị điều khiển
  console.log(`Sending message to topic ${topic}: ${message}`);
  res.json({ message: 'Command sent successfully' });
});

module.exports = router;
