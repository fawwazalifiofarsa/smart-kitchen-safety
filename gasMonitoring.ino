#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>

// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 20, 4);

// ================= WIFI =================
const char* ssid = "Iphone";
const char* password = "rahasiaa";

// ================= FIREBASE =================
#define API_KEY "AIzaSyC60KmS0DNcm8dZGCjlFsvBNFO-xwQ3P0U"
#define DATABASE_URL "gasfiremonitoring-default-rtdb.firebaseio.com"
#define USER_EMAIL "test@gmail.com"
#define USER_PASSWORD "123456"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ================= PIN =================
const int pinMQ2 = A0;
const int pinFlame = 5; // D5

// ================= CLEANUP =================
unsigned long lastCleanup = 0;
const unsigned long cleanupInterval = 300000; // 5 menit

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

    // ================= FIREBASE =================
    config.api_key = API_KEY;
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;
    config.database_url = DATABASE_URL;

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    while (!Firebase.ready())
    {
        delay(500);
    }

    Serial.println("Firebase Connected");

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

    String flameMsg;
    String statusMsg;

    // Flame sensor:
    // LOW = ADA API
    // HIGH = TIDAK ADA API

    if (statusFlame == LOW)
    {
        flameMsg = "ADA API";
    }
    else
    {
        flameMsg = "TIDAK TERDETEKSI";
    }

    // Status sistem

    if (statusFlame == HIGH && nilaiMQ2 < 250)
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

    // ================= UPDATE REALTIME =================

    Firebase.RTDB.setInt(
        &fbdo,
        "/sensor/gas",
        nilaiMQ2);

    Firebase.RTDB.setString(
        &fbdo,
        "/sensor/api",
        flameMsg);

    Firebase.RTDB.setString(
        &fbdo,
        "/sensor/status",
        statusMsg);

    // ================= CLEANUP LOG =================

    if (millis() - lastCleanup >= cleanupInterval)
    {
        Serial.println("Cleaning sensor_logs...");

        if (Firebase.RTDB.deleteNode(
                &fbdo,
                "/sensor_logs"))
        {
            Serial.println("sensor_logs cleaned");
        }
        else
        {
            Serial.print("Cleanup Error: ");
            Serial.println(fbdo.errorReason());
        }

        lastCleanup = millis();
    }

    // ================= SIMPAN HISTORI =================

    FirebaseJson logData;

    logData.set("gas", nilaiMQ2);
    logData.set("api", flameMsg);
    logData.set("status", statusMsg);
    logData.set("esp_millis", millis());

    if (Firebase.RTDB.pushJSON(
            &fbdo,
            "/sensor_logs",
            &logData))
    {
        Serial.println("History Saved");
    }
    else
    {
        Serial.print("Firebase Error : ");
        Serial.println(fbdo.errorReason());
    }

    // ================= DELAY =================

    delay(3000);
}