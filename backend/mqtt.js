const mqtt = require('mqtt');

// Thông tin kết nối
const brokerUrl = 'mqtt://192.168.100.246:1883'; // Địa chỉ IP và cổng của broker
const options = {
    clientId: 'mqtt_backend_client_003', // Client ID duy nhất
    clean: true,                        // Khởi tạo lại session mỗi khi kết nối
};

// Kết nối đến MQTT Broker
const client = mqtt.connect(brokerUrl, options);

// Lắng nghe sự kiện kết nối
client.on('connect', () => {
    console.log('Connected to MQTT Broker');

    // Danh sách các topic cần subscribe
    const topics = ['fan/mode', 'fan/control', 'fan/threshold', 'fan/update'];

    // Subscribe tất cả các topic
    client.subscribe(topics, (err, granted) => {
        if (err) {
            console.error('Subscription error:', err);
        } else {
            console.log(`Subscribed to topics: ${topics.join(', ')}`);
            console.log('Granted QoS:', granted.map(g => g.qos));
        }
    });
});

// Xử lý khi nhận thông điệp từ các topic
client.on('message', (topic, message) => {
    const payload = message.toString();
    console.log(`Received message: ${payload} from topic: ${topic}`);

    // Xử lý logic theo từng topic
    switch (topic) {
        case 'fan/mode':
            console.log(`Fan mode updated: ${payload}`);
            // Thực hiện xử lý chế độ (tự động hoặc thủ công)
            break;

        case 'fan/control':
            console.log(`Fan control command received: ${payload}`);
            // Thực hiện xử lý bật/tắt quạt
            break;

        case 'fan/threshold':
            console.log(`Threshold updated to: ${payload}`);
            // Xử lý ngưỡng nhiệt độ
            break;

        case 'fan/update':
            try {
                const updateData = JSON.parse(payload);
                console.log('Fan status update received:');
                console.log(`- Mode: ${updateData.mode}`);
                console.log(`- State: ${updateData.state}`);
                console.log(`- Threshold: ${updateData.threshold}`);
                console.log(`- Temperature: ${updateData.temperature}°C`);
                console.log(`- Humidity: ${updateData.humidity}%`);
                
                // Thực hiện xử lý logic dựa trên dữ liệu
                // Ví dụ: lưu vào cơ sở dữ liệu hoặc điều chỉnh giao diện
            } catch (err) {
                console.error('Invalid JSON payload received on fan/update:', err);
            }
            break;

        default:
            console.warn(`Unhandled topic: ${topic}`);
    }
});

// Xử lý lỗi kết nối MQTT
client.on('error', (err) => {
    console.error('MQTT connection error:', err);
});

// Export client để sử dụng ở các file khác
module.exports = client;
