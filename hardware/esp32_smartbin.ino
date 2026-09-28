/*
  ==============================================================
  EcoPulse SmartBin OS - ESP32 Firmware
  Real-Life Dual Waste Monitoring System (Compostable & Decomposable)
  Author: EcoPulse Systems
  ==============================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server API Endpoint
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/bins/update";
const char* binId = "BIN-104";

// Bin Total Depth Specification (cm)
const float BIN_TOTAL_HEIGHT_CM = 100.0;
const int ALERT_THRESHOLD_PERCENT = 80;

// Sensor 1: Compostable Bin Ultrasonic Pins
const int TRIG_PIN_COMP = 5;
const int ECHO_PIN_COMP = 18;

// Sensor 2: Decomposable Bin Ultrasonic Pins
const int TRIG_PIN_DECOMP = 19;
const int ECHO_PIN_DECOMP = 21;

// LED Warning Indicators
const int LED_ALERT_PIN = 2; // Onboard LED or external buzzer

// Helper: Measure distance in centimeters using HC-SR04
float measureDistanceCm(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout (~5m max range)
  if (duration == 0) {
    return BIN_TOTAL_HEIGHT_CM; // Default empty on timeout
  }

  // Speed of sound = 343 m/s => 0.0343 cm/microsecond
  float distance = (duration * 0.0343) / 2.0;
  return distance;
}

// Helper: Convert distance to fill percentage
int calculateFillPercentage(float distanceCm) {
  if (distanceCm >= BIN_TOTAL_HEIGHT_CM) return 0;
  if (distanceCm <= 5.0) return 100; // 5cm safe margin near lid

  float filledDepth = BIN_TOTAL_HEIGHT_CM - distanceCm;
  int percent = round((filledDepth / BIN_TOTAL_HEIGHT_CM) * 100.0);
  return constrain(percent, 0, 100);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- EcoPulse Dual SmartBin Initializing ---");

  // Configure Sensor GPIO Pins
  pinMode(TRIG_PIN_COMP, OUTPUT);
  pinMode(ECHO_PIN_COMP, INPUT);
  pinMode(TRIG_PIN_DECOMP, OUTPUT);
  pinMode(ECHO_PIN_DECOMP, INPUT);
  pinMode(LED_ALERT_PIN, OUTPUT);

  // Connect to WiFi Network
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection failed. Running in offline telemetry mode.");
  }
}

void loop() {
  // 1. Read Distance for Compostable Bin
  float distComp = measureDistanceCm(TRIG_PIN_COMP, ECHO_PIN_COMP);
  int fillComp = calculateFillPercentage(distComp);

  // 2. Read Distance for Decomposable Bin
  float distDecomp = measureDistanceCm(TRIG_PIN_DECOMP, ECHO_PIN_DECOMP);
  int fillDecomp = calculateFillPercentage(distDecomp);

  // Output to Serial Monitor
  Serial.printf("\n[TELEMETRY] Compostable: Dist=%.1f cm (Fill=%d%%) | Decomposable: Dist=%.1f cm (Fill=%d%%)\n",
                distComp, fillComp, distDecomp, fillDecomp);

  // 3. Physical Alert LED Check
  if (fillComp >= ALERT_THRESHOLD_PERCENT || fillDecomp >= ALERT_THRESHOLD_PERCENT) {
    digitalWrite(LED_ALERT_PIN, HIGH);
    Serial.println(">>> WARNING: Bin capacity critical! Dispatch triggered.");
  } else {
    digitalWrite(LED_ALERT_PIN, LOW);
  }

  // 4. Send JSON Payload via HTTP POST if connected
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{";
    jsonPayload += "\"binId\":\"" + String(binId) + "\",";
    jsonPayload += "\"compostable\":{\"fillPercent\":" + String(fillComp) + ",\"distanceCm\":" + String(distComp, 1) + "},";
    jsonPayload += "\"decomposable\":{\"fillPercent\":" + String(fillDecomp) + ",\"distanceCm\":" + String(distDecomp, 1) + "}";
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);
    Serial.printf("HTTP Response Code: %d\n", httpResponseCode);
    http.end();
  }

  // Poll sensors every 3 seconds
  delay(3000);
}
