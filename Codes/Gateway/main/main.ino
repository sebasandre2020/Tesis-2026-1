#include <Arduino.h>

// To compile correctly, rename 'secrets.h.template' to 'secrets.h' and fill in
// the values
#if __has_include("secrets.h")
#include "secrets.h"
#else
#error                                                                         \
    "secrets.h missing. Please copy secrets.h.template to secrets.h and fill credentials."
#endif

#include "AzureIoTManager.h"
#include "LoRaManager.h"

// Define Pins for ESP32 and E220-900T30D
#define LORA_RX_PIN 17 // Connects to TXD of E220
#define LORA_TX_PIN 16 // Connects to RXD of E220
#define LORA_AUX_PIN 15
#define LORA_M0_PIN 4
#define LORA_M1_PIN 5

// Initialize Managers
LoRaManager lora(LORA_RX_PIN, LORA_TX_PIN, LORA_AUX_PIN, LORA_M0_PIN,
                 LORA_M1_PIN);
AzureIoTManager azureIoT(WIFI_SSID, WIFI_PASSWORD, IOT_HUB_CONN_STRING);

// =============================================================================
// Simulación de 3 nodos sensores
// =============================================================================
//
// Cada nodo tiene rangos de simulación ligeramente distintos para que la
// dashboard muestre datos visualmente diferenciados (Aula 101 con CO2
// moderado, Laboratorio con CO2 alto, Biblioteca con CO2 bajo).
// Los rangos de temperatura/humedad están en décimas para que
// `random(minDec, maxDec) / 10.0f` produzca floats con 1 decimal.
//
// En el futuro, cuando los nodos reales (Arduino UNO + E220) transmitan
// por LoRa, este array se reemplaza por el loop que parsea
// `lora.receivePacket()`.

struct NodeSim {
  const char *nodeId;
  int co2Min, co2Max;
  int dustMin, dustMax;
  int tempMinDec, tempMaxDec; // décimas de °C (190 = 19.0 °C)
  int humMinDec, humMaxDec;   // décimas de % (550 = 55.0 %)
};

const NodeSim NODES[] = {
    {"Node_01", 400, 700, 10, 40, 190, 240, 350, 550}, // Aula 101: CO2 moderado
    {"Node_02", 500, 1200, 40, 100, 200, 260, 300,
     500},                                            // Laboratorio: CO2 alto
    {"Node_03", 380, 550, 5, 25, 180, 230, 400, 600}, // Biblioteca: CO2 bajo
};
const int NODE_COUNT = sizeof(NODES) / sizeof(NODES[0]);
int nextNodeIdx = 0;

// Industry-standard IAQ (Indoor Air Quality) sampling interval for classrooms:
// 1 to 5 minutes is recommended to detect occupancy spikes while avoiding
// network congestion. With 3 nodes cycling, each node gets sampled every
// 3 × IAQ_SAMPLING_INTERVAL_MS.
const unsigned long IAQ_SAMPLING_INTERVAL_MS = 60000;
unsigned long lastSampleTime = 0;

/**
 * Genera y publica un payload JSON para el nodo NODES[idx].
 * Si la publicación falla (sin conexión MQTT), sigue intentando en el
 * próximo ciclo; los datos no se persisten localmente en este modo.
 */
void publishNodeReading(int idx) {
  const NodeSim &node = NODES[idx];

  int co2 = random(node.co2Min, node.co2Max);
  int dust = random(node.dustMin, node.dustMax);
  float temp = random(node.tempMinDec, node.tempMaxDec) / 10.0f;
  float hum = random(node.humMinDec, node.humMaxDec) / 10.0f;

  // Importante: envolver CADA literal en String() porque Arduino C++ no permite
  // concatenar const char* con operator+; hay que convertir todo a String
  // primero.
  String payload = String("{\"node_id\":\"") + String(node.nodeId) +
                   String("\",\"co2\":") + String(co2) + String(",\"dust\":") +
                   String(dust) + String(",\"temperature\":") +
                   String(temp, 1) + String(",\"humidity\":") + String(hum, 1) +
                   String("}");

  Serial.print("[SIMULATION] ");
  Serial.print(node.nodeId);
  Serial.print(" -> ");
  Serial.println(payload);

  if (azureIoT.publishTelemetry(payload)) {
    Serial.print("Published ");
    Serial.println(node.nodeId);
  } else {
    Serial.print("Failed to publish ");
    Serial.println(node.nodeId);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Starting IoT Multi-Sensor Gateway (Simulation Mode)...");

  // Initialize LoRa Module (Kept for hardware readiness, though we bypass it
  // for now)
  lora.begin();

  // Initialize Wi-Fi and Azure IoT connection
  azureIoT.begin();

  // Bootstrap: publicar UNA lectura inicial para cada nodo para que la
  // dashboard tenga datos visibles desde el primer GET. IoT Hub free tier
  // admite 8000 mensajes/día (≈ 5.5/min), así que 3 ráfagas al boot están
  // holgadamente dentro del límite.
  Serial.println("[BOOT] Publishing initial reading for each node...");
  for (int i = 0; i < NODE_COUNT; i++) {
    publishNodeReading(i);
  }
  lastSampleTime = millis();
}

void loop() {
  // Keep Azure MQTT connection alive
  azureIoT.loop();

  unsigned long currentMillis = millis();

  // Non-blocking timer: cada IAQ_SAMPLING_INTERVAL_MS publicamos UNA lectura
  // del siguiente nodo en la rotación. Con 3 nodos y 60s de intervalo, cada
  // nodo se muestrea cada 3 minutos. El umbral de 1 minuto es coherente con
  // las recomendaciones IAQ para aulas (1-5 min entre muestras).
  if (currentMillis - lastSampleTime >= IAQ_SAMPLING_INTERVAL_MS) {
    lastSampleTime = currentMillis;
    publishNodeReading(nextNodeIdx);
    nextNodeIdx = (nextNodeIdx + 1) % NODE_COUNT;
  }
}
