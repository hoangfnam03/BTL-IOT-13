const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mqttClient = require('./mqtt'); // Import mqttClient từ mqtt.js
const db = require('./database'); // Sử dụng kết nối từ file database.js
const bcrypt = require('bcryptjs'); // Cài đặt bcryptjs để mã hóa mật khẩu
const jwt = require('jsonwebtoken'); // Cài đặt jsonwebtoken để tạo token
const app = express();
const PORT = 3002;  // Đổi cổng thành 3002 cho toàn bộ API
app.use(cors());

// Biến lưu trữ trạng thái từ các topic MQTT
const fanData = {
    mode: 'auto',        // Chế độ hiện tại
    control: 'off',      // Trạng thái quạt (on/off)
    threshold: 25,       // Ngưỡng nhiệt độ
    temperature: 0,      // Nhiệt độ hiện tại
    humidity: 0,         // Độ ẩm hiện tại
};

// API POST: Đăng nhập
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Truy vấn cơ sở dữ liệu để lấy thông tin người dùng
    const query = 'SELECT * FROM user WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        // Kiểm tra nếu người dùng không tồn tại
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = results[0];

        // Kiểm tra mật khẩu
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            // Tạo token JWT nếu mật khẩu hợp lệ
            const token = jwt.sign({ id: user.id, username: user.username }, 'your_secret_key', { expiresIn: '1h' });

            // Trả về token JWT
            res.status(200).json({
                message: 'Login successful',
                token: token,
            });
        });
    });
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Lắng nghe thông điệp từ MQTT broker
mqttClient.on('message', (topic, message) => {
    const payload = message.toString();
    let isChanged = false;  // Biến kiểm tra xem có thay đổi hay không

    switch (topic) {
        case 'fan/mode':
            if (fanData.mode !== payload) {
                fanData.mode = payload;
                console.log(`Fan mode updated: ${payload}`);
                isChanged = true;  // Đánh dấu đã thay đổi
            }
            break;

        case 'fan/control':
            if (fanData.control !== payload) {
                fanData.control = payload;
                console.log(`Fan control updated: ${payload}`);
                isChanged = true;  // Đánh dấu đã thay đổi
            }
            break;

        case 'fan/threshold':
            const thresholdValue = parseFloat(payload);
            if (fanData.threshold !== thresholdValue) {
                fanData.threshold = thresholdValue;
                console.log(`Threshold updated: ${payload}`);
                isChanged = true;  // Đánh dấu đã thay đổi
            }
            break;

        case 'fan/update':
            try {
                const updateData = JSON.parse(payload);
                if (updateData.mode && updateData.mode !== fanData.mode) {
                    fanData.mode = updateData.mode;
                    isChanged = true;  // Đánh dấu đã thay đổi
                }
                if (updateData.state && updateData.state !== fanData.control) {
                    fanData.control = updateData.state;
                    isChanged = true;  // Đánh dấu đã thay đổi
                }
                if (updateData.threshold && updateData.threshold !== fanData.threshold) {
                    fanData.threshold = updateData.threshold;
                    isChanged = true;  // Đánh dấu đã thay đổi
                }
                if (updateData.temperature !== undefined && updateData.temperature !== fanData.temperature) {
                    fanData.temperature = updateData.temperature;
                }
                if (updateData.humidity !== undefined && updateData.humidity !== fanData.humidity) {
                    fanData.humidity = updateData.humidity;
                }

                console.log('Fan status updated:', fanData);
            } catch (err) {
                console.error('Invalid JSON in fan/update:', err);
            }
            break;

        default:
            console.warn(`Unhandled topic: ${topic}`);
    }

    // Chỉ lưu nếu có sự thay đổi
    if (isChanged) {
        saveDeviceStatusHistory();  // Lưu trạng thái vào lịch sử
    }
});

function saveDeviceStatusHistory() {
    let { control, mode, threshold, temperature, humidity } = fanData;
    const deviceId = 'esp32'; // ID thiết bị của bạn

    const query = `INSERT INTO device_status_history (device_id, status, mode, threshold, temperature, humidity) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [deviceId, control, mode, threshold, temperature, humidity];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error inserting device status into history:', err);
        } else {
            console.log('Device status history saved successfully');
        }
    });
}

// API GET: Lấy toàn bộ dữ liệu fanData
app.get('/api/fanData', (req, res) => {
    res.json(fanData);
});

// API POST: Thay đổi chế độ quạt qua MQTT
app.post('/api/fanData', (req, res) => {
    const { mode } = req.body;

    if (!mode || (mode !== 'auto' && mode !== 'manual')) {
        return res.status(400).json({ message: 'Invalid mode' });
    }

    mqttClient.publish('fan/mode', mode, (err) => {
        if (err) {
            console.error('Failed to publish mode:', err);
            return res.status(500).json({ message: 'Failed to update mode' });
        }

        fanData.mode = mode; // Cập nhật mode local
        res.status(200).json({ message: 'Mode updated successfully', mode });
    });
});

// API POST: Thay đổi ngưỡng nhiệt độ qua MQTT
app.post('/api/changeThreshold', (req, res) => {
  const { threshold } = req.body;

  // Kiểm tra xem ngưỡng nhiệt độ có hợp lệ hay không (kiểu số, không phải NaN)
  if (threshold === undefined || isNaN(threshold)) {
      return res.status(400).json({ message: 'Invalid threshold value' });
  }

  // Đảm bảo giá trị threshold là số thực
  const thresholdValue = parseFloat(threshold);
  
  if (isNaN(thresholdValue)) {
      return res.status(400).json({ message: 'Threshold must be a valid number' });
  }

  // Gửi ngưỡng nhiệt độ mới về MQTT broker
  mqttClient.publish('fan/threshold', thresholdValue.toString(), (err) => {
      if (err) {
          console.error('Failed to publish threshold:', err);
          return res.status(500).json({ message: 'Failed to update threshold' });
      }

      // Cập nhật ngưỡng nhiệt độ tại backend (local)
      fanData.threshold = thresholdValue;
      
      // Trả về thông báo thành công
      res.status(200).json({ message: 'Threshold updated successfully', threshold: thresholdValue });
  });
});

// API POST: Thay đổi trạng thái quạt qua MQTT (bật/tắt quạt)
app.post('/api/toggleFan', (req, res) => {
    const { control } = req.body;

    if (!control || (control !== 'on' && control !== 'off')) {
        return res.status(400).json({ message: 'Invalid control state' });
    }

    mqttClient.publish('fan/control', control, (err) => {
        if (err) {
            console.error('Failed to publish fan control:', err);
            return res.status(500).json({ message: 'Failed to update fan control' });
        }

        fanData.control = control; // Cập nhật control local
        res.status(200).json({ message: 'Fan control updated successfully', control });
    });
});

// API GET: Lấy lịch sử trạng thái quạt từ cơ sở dữ liệu
app.get('/api/statusHistory', (req, res) => {
  const query = 'SELECT * FROM device_status_history ORDER BY timestamp DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving status history:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    res.status(200).json(results);
  });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
