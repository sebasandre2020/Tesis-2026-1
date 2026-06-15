#include <Arduino.h>

// To compile correctly, rename 'secrets.h.template' to 'secrets.h' and fill in the values
#if __has_include("secrets.h")
#include "secrets.h"
#else
#error "secrets.h missing. Please copy secrets.h.template to secrets.h and fill credentials."
#endif

#include "LoRaManager.h"
#include "AzureIoTManager.h"

// Define Pins for ESP32 and E220-900T30D
#define LORA_RX_PIN 17  // Connects to TXD of E220
#define LORA_TX_PIN 16  // Connects to RXD of E220
#define LORA_AUX_PIN 15
#define LORA_M0_PIN 4
#define LORA_M1_PIN 5

// Initialize Managers
LoRaManager lora(LORA_RX_PIN, LORA_TX_PIN, LORA_AUX_PIN, LORA_M0_PIN, LORA_M1_PIN);
AzureIoTManager azureIoT(WIFI_SSID, WIFI_PASSWORD, IOT_HUB_CONN_STRING);

// Industry-standard IAQ (Indoor Air Quality) sampling interval for classrooms:
// 1 to 5 minutes is recommended to detect occupancy spikes while avoiding network congestion.
// Here we configure it to 1 minute (60000 milliseconds) for responsive alerting.
const unsigned long IAQ_SAMPLING_INTERVAL_MS = 60000;
unsigned long lastSampleTime = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("Starting IoT Multi-Sensor Gateway (Simulation Mode)...");

    // Initialize LoRa Module (Kept for hardware readiness, though we bypass it for now)
    lora.begin();

    // Initialize Wi-Fi and Azure IoT connection
    azureIoT.begin();
}

void loop() {
    // Keep Azure MQTT connection alive
    azureIoT.loop();

    unsigned long currentMillis = millis();

    // Non-blocking timer for IAQ telemetry simulation
    if (currentMillis - lastSampleTime >= IAQ_SAMPLING_INTERVAL_MS || lastSampleTime == 0) {
        lastSampleTime = currentMillis;

        // === SIMULACIÓN DE SENSORES ===
        // CO2 (MH-Z19): 400-1200 ppm
        int simulatedCO2 = random(400, 1200);

        // Polvo (Sharp GP2Y1010AU0F): 0-150 µg/m³ (PM2.5-ish, valores indoor típicos)
        int simulatedDust = random(0, 150);

        // Temperatura (DHT22): 16-30 °C con 1 decimal
        float simulatedTemp = random(160, 300) / 10.0f;

        // Humedad relativa (DHT22): 25-75 %
        float simulatedHum = random(250, 750) / 10.0f;

        // Payload JSON con los 4 sensores: co2 (MH-Z19) + polvo (Sharp) + temp/humedad (DHT22)
        String payload = "{\"node_id\":\"Node_01\""
                       + ",\"co2\":" + String(simulatedCO2)
                       + ",\"dust\":" + String(simulatedDust)
                       + ",\"temperature\":" + String(simulatedTemp, 1)
                       + ",\"humidity\":" + String(simulatedHum, 1)
                       + "}";

        Serial.print("[SIMULATION] Generated payload: ");
        Serial.println(payload);

        // Forward to Azure IoT Hub
        if (azureIoT.publishTelemetry(payload)) {
            Serial.println("Successfully published simulated data to Azure IoT Hub.");
        } else {
            Serial.println("Failed to publish to Azure IoT Hub.");
        }
    }
}
