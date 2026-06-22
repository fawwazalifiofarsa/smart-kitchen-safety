#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 20, 4);

// ================= WIFI =================
const char *ssid = "iPhone";
const char *password = "rahasiaa";

// ================= BACKEND API =================
const char *deviceId = "device_real";
const char *deviceName = "Kitchen Node 1";
const char *deviceLocation = "Unassigned";
const char *deviceRoom = "Kitchen";
const char *deviceApiKey = "test";
const char *ingestionUrl = "[172.20.10.6](http://172.20.10.6:3000/api/devices/device_real/readings)";

// ================= PIN =================
const int pinMQ2 = A0;
const int pinFlame = D5;
const int pinBuzzer = D6;

// ================= THRESHOLD =================
const int gasThreshold = 150;

// ================= STATE TRACKING =================
bool previousBahaya = false; // state sebelumnya untuk edge detection
unsigned long lastApiSend = 0;
const long apiCooldown = 10000; // cooldown 10 detik antar pengiriman saat terus gawat

// ================= VARIABEL BUZZER =================
unsigned long previousBuzzerMillis = 0;
bool buzzerState = false;
const long buzzerOnDuration = 300;
const long buzzerOffDuration = 200;

// ================= JSON ESCAPE =================
String jsonEscape(const String &value)
{
    String escaped = "";
    for (unsigned int i = 0; i < value.length(); i++)
    {
        char c = value.charAt(i);
        if (c == '"' || c == '\\')
            escaped += '\\';
        escaped += c;
    }
    return escaped;
}

// ================= LOG SERIAL TERSTRUKTUR =================
void logEvent(const String &level, const String &message)
{
    Serial.print("[");
    Serial.print(millis());
    Serial.print("] [");
    Serial.print(level);
    Serial.print("] ");
    Serial.println(message);
}

// ================= KIRIM KE BACKEND =================
void kirimKeBackend(int nilaiMQ2, int statusFlame, bool flameDetected,
                    const String &flameMsg, const String &statusMsg)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        logEvent("WARN", "WiFi disconnected, skip API send");
        return;
    }

    WiFiClient client;
    HTTPClient http;

    String payload = "{";
    payload += "\"device_id\":\"" + jsonEscape(String(deviceId)) + "\",";
    payload += "\"device_name\":\"" + jsonEscape(String(deviceName)) + "\",";
    payload += "\"location\":\"" + jsonEscape(String(deviceLocation)) + "\",";
    payload += "\"room\":\"" + jsonEscape(String(deviceRoom)) + "\",";
    payload += "\"gas\":" + String(nilaiMQ2) + ",";
    payload += "\"flame_raw\":" + String(statusFlame) + ",";
    payload += "\"flame_detected\":";
    payload += (flameDetected ? "true" : "false");
    payload += ",";
    payload += "\"flame_message\":\"" + jsonEscape(flameMsg) + "\",";
    payload += "\"detection_status\":\"" + jsonEscape(statusMsg) + "\",";
    payload += "\"esp_millis\":" + String(millis()) + ",";
    payload += "\"source\":\"esp8266\"";
    payload += "}";

    http.begin(client, ingestionUrl);
    http.setTimeout(5000);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("ngrok-skip-browser-warning", "true");
    http.addHeader("x-device-key", deviceApiKey);
    http.addHeader("x-esp-device", deviceId);

    logEvent("INFO", "POST ke backend: " + String(ingestionUrl));

    int responseCode = http.POST(payload);

    if (responseCode > 0)
    {
        logEvent("INFO", "API Response " + String(responseCode) + ": " + http.getString());
    }
    else
    {
        logEvent("ERROR", "API Error: " + http.errorToString(responseCode));
    }

    http.end();
    lastApiSend = millis();
}

// ================= BUZZER NON-BLOCKING =================
void handleBuzzer(bool bahaya)
{
    if (!bahaya)
    {
        noTone(pinBuzzer);
        buzzerState = false;
        return;
    }

    unsigned long currentMillis = millis();

    if (!buzzerState)
    {
        if (currentMillis - previousBuzzerMillis >= buzzerOffDuration)
        {
            buzzerState = true;
            previousBuzzerMillis = currentMillis;
            tone(pinBuzzer, 1000);
        }
    }
    else
    {
        if (currentMillis - previousBuzzerMillis >= buzzerOnDuration)
        {
            buzzerState = false;
            previousBuzzerMillis = currentMillis;
            noTone(pinBuzzer);
        }
    }
}

// ================= SETUP =================
void setup()
{
    Wire.begin();
    Serial.begin(115200);

    pinMode(pinFlame, INPUT);
    pinMode(pinBuzzer, OUTPUT);

    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Sistem Monitor");
    delay(2000);
    lcd.clear();

    WiFi.begin(ssid, password);
    Serial.print("Connecting WiFi");
    lcd.setCursor(0, 0);
    lcd.print("Connecting WiFi...");

    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(1000);
    }

    logEvent("INFO", "WiFi Connected: " + WiFi.localIP().toString());

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("System Ready");
    delay(2000);
    lcd.clear();
}

// ================= LOOP =================
void loop()
{
    // ===== BACA SENSOR =====
    int nilaiMQ2 = analogRead(pinMQ2);
    int statusFlame = digitalRead(pinFlame);
    bool flameDetected = (statusFlame == LOW);

    String flameMsg = flameDetected ? "ADA API" : "TIDAK ADA";
    bool kondisiBahaya = flameDetected || (nilaiMQ2 >= gasThreshold);
    String statusMsg = kondisiBahaya ? "GAWAT" : "AMAN";

    handleBuzzer(kondisiBahaya);

    // ===== SERIAL DEBUG =====
    Serial.println("----------------------------");
    logEvent("DATA", "Gas=" + String(nilaiMQ2) +
                         " | Flame=" + flameMsg +
                         " | Status=" + statusMsg);

    // ===== LCD =====
    lcd.setCursor(0, 0);
    lcd.print("Gas: ");
    lcd.print(nilaiMQ2);
    lcd.print("        ");
    lcd.setCursor(0, 1);
    lcd.print("Api: ");
    lcd.print(flameMsg);
    lcd.print("            ");
    lcd.setCursor(0, 2);
    lcd.print("Status: ");
    lcd.print(statusMsg);
    lcd.print("          ");

    // ===== LOG & KIRIM SAAT GAWAT =====
    if (kondisiBahaya)
    {
        bool transisiKeGawat = !previousBahaya;                       // baru jadi gawat
        bool cooldownHabis = (millis() - lastApiSend) >= apiCooldown; // atau sudah 10 dtk

        if (transisiKeGawat)
        {
            logEvent("ALERT", "=== KONDISI GAWAT TERDETEKSI ===");
        }

        if (transisiKeGawat || cooldownHabis)
        {
            logEvent("ALERT", "Mengirim data ke backend...");
            kirimKeBackend(nilaiMQ2, statusFlame, flameDetected, flameMsg, statusMsg);
        }
        else
        {
            logEvent("INFO", "Gawat aktif, menunggu cooldown (" +
                                 String((apiCooldown - (millis() - lastApiSend)) / 1000) + "s)");
        }
    }
    else
    {
        if (previousBahaya)
        {
            logEvent("INFO", "=== Kondisi kembali AMAN ===");
        }
        else
        {
            logEvent("INFO", "Status aman, data tidak dikirim");
        }
    }

    previousBahaya = kondisiBahaya;

    // ===== DELAY NON-BLOCKING =====
    unsigned long waitStart = millis();
    while (millis() - waitStart < 3000)
    {
        handleBuzzer(kondisiBahaya);
        delay(10);
    }
}