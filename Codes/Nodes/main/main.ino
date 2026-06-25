// =============================================================================
// Arduino UNO sensor node — IoT CO2 monitoring system (UTEC thesis)
//
// Reads SIMULATED CO2 / dust / temperature / humidity values (real MH-Z19,
// GP2Y1010AU0F, DHT22 sensors are not yet wired up) and broadcasts a JSON
// telemetry packet over the E220-900T30D LoRa module every
// NODE_SEND_INTERVAL_MS.
//
// Payload (newline-terminated so the gateway's readStringUntil('\n') can
// frame it):
//
//   {"node_id":"Node_01","co2":742,"dust":31,"temperature":22.4,"humidity":48.7}
//
// Change NODE_ID below for each physical node (Node_01, Node_02, ...).
// =============================================================================

#include <Arduino.h>
#include <SoftwareSerial.h>

// =============================================================================
// NODE_ID — must be unique per physical node. The gateway forwards whatever
// node_id arrives to Azure, so this controls how the dashboard labels the
// readings.
// =============================================================================
#define NODE_ID "Node_01"
// =============================================================================

// =============================================================================
// SEND INTERVAL — milliseconds between telemetry packets.
// =============================================================================
#define NODE_SEND_INTERVAL_MS 60000UL // 60 s
// =============================================================================

// =============================================================================
// PIN MAP — Arduino UNO <-> E220-900T30D
// =============================================================================
//   UNO D10 (RX, SoftwareSerial)  <-----  E220 TXD   (direct; 3.3 V is
//                                                   detected as HIGH on
//                                                   a 5 V UNO)
//   UNO D11 (TX, SoftwareSerial)  ------>  E220 RXD  (through 1kΩ+2kΩ
//                                                   voltage divider:
//                                                   5 V -> 3.3 V)
//   UNO D5  (OUT)                 ------>  E220 M0
//   UNO D6  (OUT)                 ------>  E220 M1
//   UNO D7  (IN)                  <-----  E220 AUX
//   UNO 5V                        ------>  E220 VCC
//   UNO GND                       ------>  E220 GND
// =============================================================================
#define LORA_RX_PIN  10
#define LORA_TX_PIN  11
#define LORA_M0_PIN  5
#define LORA_M1_PIN  6
#define LORA_AUX_PIN 7

// E220-900T30D factory default UART: 9600 baud, 8N1.
#define LORA_BAUD 9600

// On a UNO (2 KB SRAM) we build the JSON with snprintf into a static
// buffer instead of using ArduinoJson, to keep RAM pressure low.
#define PAYLOAD_BUFFER_SIZE 128

// Maximum time we'll wait for AUX to go HIGH before giving up on a send.
#define AUX_WAIT_TIMEOUT_MS 1000UL

SoftwareSerial loraSerial(LORA_RX_PIN, LORA_TX_PIN); // (RX, TX)
unsigned long lastSendMs = 0;
bool randomSeeded = false;

void loraInit() {
  pinMode(LORA_AUX_PIN, INPUT);
  pinMode(LORA_M0_PIN, OUTPUT);
  pinMode(LORA_M1_PIN, OUTPUT);

  // Normal transparent transmission mode (M0 = 0, M1 = 0). The gateway
  // runs in the same mode, on the E220 factory default channel/address,
  // so they can talk out of the box.
  digitalWrite(LORA_M0_PIN, LOW);
  digitalWrite(LORA_M1_PIN, LOW);

  loraSerial.begin(LORA_BAUD);
  delay(500); // Let the module stabilize.

  Serial.println("[LORA] E220-900T30D initialized (transparent mode, 9600 8N1).");
}

bool loraReady() {
  // AUX goes HIGH once the module's UART buffer is empty and it's safe to
  // start a new transmission. LOW means either busy or buffer not empty.
  return digitalRead(LORA_AUX_PIN) == HIGH;
}

// Seed random once with an analog pin so two identical sketches don't
// produce the exact same sequence of readings forever.
void seedRandomOnce() {
  if (randomSeeded) return;
  randomSeed(analogRead(A0));
  randomSeeded = true;
}

// Fake sensor reading in classroom-ish ranges.
void generateReading(int &co2, int &dust, float &tempC, float &humPct) {
  seedRandomOnce();
  co2    = random(400, 1200);          // CO2 ppm
  dust   = random(5, 100);             // µg/m³
  tempC  = random(180, 270) / 10.0f;   // 18.0 .. 27.0 °C
  humPct = random(300, 700) / 10.0f;   // 30.0 .. 70.0 %
}

// Build the JSON payload into `out`. Returns false on formatting failure.
bool buildPayload(char *out, size_t outSize) {
  int co2, dust;
  float tempC, humPct;
  generateReading(co2, dust, tempC, humPct);

  // dtostrf() is the safest way to format a float on AVR (printf-family
  // %f works on modern toolchains but dtostrf is bulletproof across all
  // AVR libc versions). width=0 → no padding, so the output is "22.4".
  char tempStr[8];
  char humStr[8];
  dtostrf(tempC, 0, 1, tempStr);
  dtostrf(humPct, 0, 1, humStr);

  int n = snprintf(out, outSize,
                   "{\"node_id\":\"%s\",\"co2\":%d,\"dust\":%d,"
                   "\"temperature\":%s,\"humidity\":%s}",
                   NODE_ID, co2, dust, tempStr, humStr);

  return (n > 0 && (size_t)n < outSize);
}

void sendTelemetryPacket() {
  char payload[PAYLOAD_BUFFER_SIZE];

  if (!buildPayload(payload, sizeof(payload))) {
    Serial.println("[TX] payload build failed (buffer too small).");
    return;
  }

  // Block briefly until the module's UART buffer is free. With a fresh
  // module this returns immediately; only matters right after boot or
  // after a long burst.
  unsigned long waitStart = millis();
  while (!loraReady()) {
    if (millis() - waitStart > AUX_WAIT_TIMEOUT_MS) {
      Serial.println("[TX] E220 AUX stuck LOW for >1s; aborting send.");
      return;
    }
  }

  loraSerial.print(payload);
  loraSerial.print('\n'); // Frame delimiter the gateway uses.

  Serial.print("[TX] ");
  Serial.println(payload);
}

void setup() {
  Serial.begin(9600);
  delay(500);

  Serial.println();
  Serial.print("Arduino UNO node \"");
  Serial.print(NODE_ID);
  Serial.println("\" starting...");

  loraInit();

  // Random initial delay so multiple nodes powered on at the same time
  // don't all transmit in lockstep on boot — each one picks its own slot
  // within the first ~30 s.
  unsigned long bootDelay = random(0, 30000UL);
  Serial.print("[BOOT] Initial random delay: ");
  Serial.print(bootDelay / 1000);
  Serial.println(" s");
  delay(bootDelay);

  // Send one packet immediately so the wiring can be verified without
  // waiting a full minute.
  Serial.println("[BOOT] Publishing first packet...");
  sendTelemetryPacket();
  lastSendMs = millis();
}

void loop() {
  // Non-blocking timer: returns control to the runtime each pass.
  unsigned long now = millis();
  if (now - lastSendMs >= NODE_SEND_INTERVAL_MS) {
    lastSendMs = now;
    sendTelemetryPacket();
  }
}