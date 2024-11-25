#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Keypad.h>

// Cấu hình WiFi
const char* ssid = "Home";
const char* password = "20032003";

// Cấu hình MQTT Broker
const char* mqtt_server = "192.168.100.246"; // Địa chỉ IP của máy chạy Mosquitto
const int mqtt_port = 1883;

// Cấu hình MQTT Topics
const char* mode_topic = "fan/mode";
const char* control_topic = "fan/control";
const char* threshold_topic = "fan/threshold";
const char* update_topic = "fan/update";

// MQTT Client
WiFiClient espClient; // Sử dụng WiFiClient cho kết nối không SSL
PubSubClient client(espClient);

// Cấu hình DHT11
#define DHTPIN 5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Cấu hình relay
#define RELAY_PIN 4
bool fanState = false; // Trạng thái bật/tắt quạt

// Cấu hình LCD
LiquidCrystal_I2C lcd(0x27, 20, 4);

// Cấu hình keypad
const byte ROW_NUM = 1;
const byte COL_NUM = 4;
char keys[ROW_NUM][COL_NUM] = {
  {'1', '2', '3', '4'}
};
byte pin_rows[ROW_NUM] = {12};
byte pin_column[COL_NUM] = {15, 13, 14, 27};
Keypad keypad = Keypad(makeKeymap(keys), pin_rows, pin_column, ROW_NUM, COL_NUM);

// Biến điều khiển
float temperature = 0.0;
float humidity = 0.0;
int threshold = 31;  // Ngưỡng nhiệt độ mặc định
bool manualMode = false;
String sendhumi(float x){
  return String(x, 1);
}
// Kết nối WiFi
void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.println(WiFi.localIP());
}

// Gửi dữ liệu cập nhật lên MQTT Broker
void sendUpdate() {
  String update = String("{\"mode\":\"") + (manualMode ? "manual" : "auto") +
                  "\",\"state\":\"" + (fanState ? "on" : "off") +
                  "\",\"threshold\":" + threshold +
                  ",\"temperature\":" + temperature + 
                  ",\"humidity\":" + sendhumi(humidity) + "}";
  client.publish(update_topic, update.c_str());
}

// Callback khi nhận dữ liệu từ MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.printf("Message received on topic %s: %s\n", topic, message.c_str());

  if (String(topic) == mode_topic) {
    if (message == "manual") {
      manualMode = true;
      fanState = false;
      digitalWrite(RELAY_PIN, HIGH);
    } else if (message == "auto") {
      manualMode = false;
    }
    sendUpdate();
  } else if (String(topic) == control_topic) {
    if (manualMode) {
      if (message == "on") {
        fanState = true;
        digitalWrite(RELAY_PIN, LOW);
      } else if (message == "off") {
        fanState = false;
        digitalWrite(RELAY_PIN, HIGH);
      }
      sendUpdate();
    }
  } else if (String(topic) == threshold_topic) {
    threshold = message.toInt();
    sendUpdate();
  }
}

// Kết nối MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.println("Connecting to MQTT...");
    if (client.connect("ESP32_client")) {
      Serial.println("MQTT connected");
      client.subscribe(mode_topic);
      client.subscribe(control_topic);
      client.subscribe(threshold_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.println(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  // Khởi động LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Khoi dong...");

  // Khởi động WiFi và MQTT
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  // Khởi động DHT và relay
  dht.begin();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  lcd.clear();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Đọc nhiệt độ từ DHT11
  float newTemp = dht.readTemperature();
  if (!isnan(newTemp) && abs(newTemp - temperature) > 0.1) {
    temperature = newTemp;
    sendUpdate();
  }
float newHumi = dht.readHumidity();
  if (!isnan(newHumi) && abs(newHumi - humidity) > 0.01) {
    humidity = newHumi;
    sendUpdate();
  }
  // Hiển thị thông tin trên LCD
  lcd.setCursor(0, 0);
  lcd.print("Nhiet do: ");
  lcd.print(temperature, 1);
  lcd.print(" *C");

  lcd.setCursor(0, 1);
  lcd.print("Mode: ");
  lcd.print(manualMode ? "Thu cong" : "Tu dong");

  if (!manualMode) {
    if (temperature >= threshold && !fanState) {
      fanState = true;
      digitalWrite(RELAY_PIN, LOW);
      sendUpdate();
    } else if (temperature < threshold && fanState) {
      fanState = false;
      digitalWrite(RELAY_PIN, HIGH);
      sendUpdate();
    }
  } else{
        // fanState = false;
        // digitalWrite(RELAY_PIN, HIGH);
        sendUpdate();
    
  }

  lcd.setCursor(0, 2);
  lcd.print("Quat: ");
  lcd.print(fanState ? "Bat " : "Tat ");

  // Kiểm tra nút bấm trên keypad
  char key = keypad.getKey();
  if (key) {
    if (key == '1') {
      manualMode = true;
      fanState = false;
      digitalWrite(RELAY_PIN, HIGH);
      sendUpdate();
    } else if (key == '2') {
      manualMode = false;
      sendUpdate();
    } else if(key=='3'&& manualMode){
      fanState = true;
      digitalWrite(RELAY_PIN, LOW);
      sendUpdate();
    }else if(key=='4'&& manualMode){
      fanState = false;
      digitalWrite(RELAY_PIN, HIGH);
      sendUpdate();
    }
  }

  delay(200);
}
