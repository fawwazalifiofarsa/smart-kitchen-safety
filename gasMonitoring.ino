#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 20, 4);

// ================= WIFI =================
const char* ssid = "iPhone";
const char* password = "rahasiaa";

// ================= BACKEND API =================
const char* deviceId = "device_real";
const char* deviceName = "Kitchen Node 1";
const char* deviceLocation = "Unassigned";
const char* deviceRoom = "Kitchen";
const char* deviceApiKey = "test";
const char* ingestionUrl = "https://c4bb-36-85-60-131.ngrok-free.app/api/devices/device_real/readings";

// ================= PIN =================
const int pinMQ2 = A0;
const int pinFlame = 5; // D5

String jsonEscape(const String& value)
{
    String escaped = "";
    for (unsigned int i = 0; i < value.length(); i++)
    {
        char c = value.charAt(i);
        if (c == '"' || c == '\\')
        {
            escaped += '\\';
        }
        escaped += c;
    }
    return escaped;
}

void setup()
{
    Wire.begin();
    Serial.begin(115200);

    pinMode(pinFlame, INPUT);

    // ================= LCD =================
    lcd.init();
    lcd.backlight();

    lcd.setCursor(0, 0);
    lcd.print("Sistem Monitor");
    delay(2000);

    lcd.clear();

    // ================= WIFI =================
    WiFi.begin(ssid, password);

    Serial.print("Connecting WiFi");

    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(1000);
    }

    Serial.println();
    Serial.println("WiFi Connected");

    lcd.setCursor(0, 0);
    lcd.print("System Ready");

    delay(2000);
    lcd.clear();
}

void loop()
{
    // ================= BACA SENSOR =================

    int nilaiMQ2 = analogRead(pinMQ2);
    int statusFlame = digitalRead(pinFlame);
    bool flameDetected = statusFlame == LOW;

    String flameMsg;
    String statusMsg;

    // Flame sensor:
    // LOW = ADA API
    // HIGH = TIDAK ADA API

    if (flameDetected)
    {
        flameMsg = "ADA API";
    }
    else
    {
        flameMsg = "TIDAK TERDETEKSI";
    }

    // Status sistem

    if (!flameDetected && nilaiMQ2 < 250)
    {
        statusMsg = "AMAN";
    }
    else
    {
        statusMsg = "GAWAT";
    }

    // ================= SERIAL =================

    Serial.print("Gas : ");
    Serial.print(nilaiMQ2);

    Serial.print(" | Flame Raw : ");
    Serial.print(statusFlame);

    Serial.print(" | Api : ");
    Serial.print(flameMsg);

    Serial.print(" | Status : ");
    Serial.println(statusMsg);

    // ================= LCD =================

    lcd.setCursor(0, 0);
    lcd.print("Gas: ");
    lcd.print(nilaiMQ2);
    lcd.print("        ");

    lcd.setCursor(0, 1);
    lcd.print("Api: ");
    lcd.print(flameMsg);
    lcd.print("          ");

    lcd.setCursor(0, 2);
    lcd.print("Status: ");
    lcd.print(statusMsg);
    lcd.print("        ");

    // ================= SIMPAN HISTORI VIA API =================

    if (WiFi.status() == WL_CONNECTED)
    {
        WiFiClientSecure client;
        client.setInsecure();

        HTTPClient http;

        String payload = "{";
        payload += "\"device_id\":\"";
        payload += jsonEscape(String(deviceId));
        payload += "\",";
        payload += "\"device_name\":\"";
        payload += jsonEscape(String(deviceName));
        payload += "\",";
        payload += "\"location\":\"";
        payload += jsonEscape(String(deviceLocation));
        payload += "\",";
        payload += "\"room\":\"";
        payload += jsonEscape(String(deviceRoom));
        payload += "\",";
        payload += "\"gas\":";
        payload += String(nilaiMQ2);
        payload += ",";
        payload += "\"flame_raw\":";
        payload += String(statusFlame);
        payload += ",";
        payload += "\"flame_detected\":";
        payload += (flameDetected ? "true" : "false");
        payload += ",";
        payload += "\"flame_message\":\"";
        payload += jsonEscape(flameMsg);
        payload += "\",";
        payload += "\"detection_status\":\"";
        payload += jsonEscape(statusMsg);
        payload += "\",";
        payload += "\"esp_millis\":";
        payload += String(millis());
        payload += ",";
        payload += "\"source\":\"esp8266\"";
        payload += "}";

        http.begin(client, ingestionUrl);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("ngrok-skip-browser-warning", "true");
        http.addHeader("x-device-key", deviceApiKey);
        http.addHeader("x-esp-device", deviceId);

        Serial.print("POST ");
        Serial.println(ingestionUrl);
        Serial.print("Payload: ");
        Serial.println(payload);

        int responseCode = http.POST(payload);
        String responseBody = http.getString();
        if (responseCode > 0)
        {
            Serial.print("API Response: ");
            Serial.println(responseCode);
            Serial.print("API Body: ");
            Serial.println(responseBody);
        }
        else
        {
            Serial.print("API Error: ");
            Serial.println(http.errorToString(responseCode));
            Serial.print("API Body: ");
            Serial.println(responseBody);
        }

        http.end();
    }
    else
    {
        Serial.println("WiFi disconnected, skip API send");
    }

    // ================= DELAY =================

    delay(3000);
}
