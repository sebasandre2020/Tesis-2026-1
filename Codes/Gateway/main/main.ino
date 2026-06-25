#include <Arduino.h>

// =============================================================================
// MODE SELECTION — flip this single value to switch the gateway between the
// built-in data generator and a real LoRa receiver.
// =============================================================================
//   false → simulation mode (NO LoRa needed). The gateway generates fake
//           CO2/dust/temp/humidity readings for 3 virtual nodes on a timer
//           and publishes them to Azure. Use this to smoke-test the full
//           cloud pipeline without any physical sensor nodes powered on.
//   true  → real LoRa mode. The gateway listens for JSON packets broadcast
//           by physical Arduino UNO + E220-900T30D nodes and forwards each
//           one to Azure unchanged. The SimulationManager is compiled out.
// =============================================================================
#define USE_LORA_REAL false
// =============================================================================

// To compile correctly, rename 'secrets.h.template' to 'secrets.h' and fill in
// the values.
#if __has_include("secrets.h")
#include "secrets.h"
#else
#error \
    "secrets.h missing. Please copy secrets.h.template to secrets.h and fill credentials."
#endif

#include "AzureIoTManager.h"
#include "LoRaManager.h"

#if !USE_LORA_REAL
#include "SimulationManager.h"
#endif

// =============================================================================
// Pin map: ESP32 <-> E220-900T30D (kept identical regardless of mode so the
// module is initialized either way — in simulation mode we just don't read
// from it).
// =============================================================================
#define LORA_RX_PIN 17 // ESP32 RX2 <- E220 TXD
#define LORA_TX_PIN 16 // ESP32 TX2 -> E220 RXD
#define LORA_AUX_PIN 15
#define LORA_M0_PIN 4
#define LORA_M1_PIN 5

// Global managers.
LoRaManager lora(LORA_RX_PIN, LORA_TX_PIN, LORA_AUX_PIN, LORA_M0_PIN,
                 LORA_M1_PIN);
AzureIoTManager azureIoT(WIFI_SSID, WIFI_PASSWORD, IOT_HUB_CONN_STRING);

#if !USE_LORA_REAL
SimulationManager simulation;
#endif

// Industry-standard IAQ (Indoor Air Quality) sampling interval for classrooms
// (1–5 min is recommended to detect occupancy spikes without network
// congestion). With 3 nodes cycling, each virtual node gets sampled every
// 3 × IAQ_SAMPLING_INTERVAL_MS.
const unsigned long IAQ_SAMPLING_INTERVAL_MS = 60000;
unsigned long lastSampleTime = 0;

#if USE_LORA_REAL
/**
 * Drains whatever is currently sitting in the LoRa UART buffer and forwards
 * each newline-terminated JSON line to Azure. receivePacket() is
 * non-blocking — it returns false when no full packet is ready — so it's
 * safe to call on every loop() iteration.
 */
void handleIncomingPackets() {
  String payload;
  while (lora.receivePacket(payload)) {
    Serial.print("[LORA] Received: ");
    Serial.println(payload);
    if (azureIoT.publishTelemetry(payload)) {
      Serial.println("[LORA] -> Published to Azure.");
    } else {
      Serial.println(
          "[LORA] -> Azure publish failed (no MQTT); packet dropped.");
    }
  }
}
#endif

void setup() {
  Serial.begin(115200);
  delay(1000);

#if USE_LORA_REAL
  Serial.println("Starting IoT Multi-Sensor Gateway (REAL LoRa mode)...");
#else
  Serial.println("Starting IoT Multi-Sensor Gateway (SIMULATION mode)...");
#endif

  // Initialize the LoRa module (no-op receive-wise when USE_LORA_REAL is
  // false, but it still flips M0/M1 to transparent mode so the module is
  // ready if you flip the flag later).
  lora.begin();

  // Connect Wi-Fi and Azure IoT Hub.
  azureIoT.begin();

#if !USE_LORA_REAL
  // Bootstrap: publish ONE initial reading per simulated node so the
  // dashboard has data visible from the first GET. The IoT Hub free tier
  // allows 8000 messages/day (≈5.5/min), so 3 bursts at boot are well
  // within budget.
  Serial.println("[BOOT] Publishing initial reading for each node...");
  simulation.publishInitialReadings(azureIoT);
#endif

  lastSampleTime = millis();
}

void loop() {
  // Keep Azure MQTT connection alive (Wi-Fi reconnect, MQTT ping, etc.).
  azureIoT.loop();

#if USE_LORA_REAL
  // Real LoRa mode: forward anything arriving on the UART to Azure.
  handleIncomingPackets();
#else
  // Simulation mode: every IAQ_SAMPLING_INTERVAL_MS publish one reading of
  // the next node in the rotation. With 3 nodes and a 60 s interval each
  // node gets sampled every ~3 minutes, which matches the IAQ recommendation
  // for classrooms (1–5 min between samples).
  unsigned long currentMillis = millis();
  if (currentMillis - lastSampleTime >= IAQ_SAMPLING_INTERVAL_MS) {
    lastSampleTime = currentMillis;
    simulation.publishNextReading(azureIoT);
  }
#endif
}