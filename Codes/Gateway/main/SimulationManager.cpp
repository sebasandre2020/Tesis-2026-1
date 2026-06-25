#include "SimulationManager.h"
#include "AzureIoTManager.h"

// =============================================================================
// Per-node simulation ranges.
//
// Each node has slightly different ranges so the dashboard shows visually
// distinct traces:
//   - Aula 101      → CO2 moderado
//   - Laboratorio   → CO2 alto
//   - Biblioteca   → CO2 bajo
//
// Temperature/humidity are stored in tenths so `random(minDec, maxDec) / 10.0f`
// yields floats with 1 decimal.
// =============================================================================
const SimulationManager::NodeSim SimulationManager::NODES[] = {
    {"Node_01", 400, 700,  10, 40,  190, 240, 350, 550}, // Aula 101
    {"Node_02", 500, 1200, 40, 100, 200, 260, 300, 500}, // Laboratorio
    {"Node_03", 380, 550,  5,  25,  180, 230, 400, 600}, // Biblioteca
};
const int SimulationManager::NODE_COUNT =
    sizeof(NODES) / sizeof(NODES[0]);

SimulationManager::SimulationManager() : _nextNodeIdx(0) {}

void SimulationManager::publishNodeReading(int idx,
                                           AzureIoTManager &azureIoT) {
  const NodeSim &node = NODES[idx];

  int co2 = random(node.co2Min, node.co2Max);
  int dust = random(node.dustMin, node.dustMax);
  float temp = random(node.tempMinDec, node.tempMaxDec) / 10.0f;
  float hum = random(node.humMinDec, node.humMaxDec) / 10.0f;

  // Cada literal va envuelto en String() porque Arduino C++ no permite
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

void SimulationManager::publishInitialReadings(AzureIoTManager &azureIoT) {
  for (int i = 0; i < NODE_COUNT; i++) {
    publishNodeReading(i, azureIoT);
  }
}

void SimulationManager::publishNextReading(AzureIoTManager &azureIoT) {
  publishNodeReading(_nextNodeIdx, azureIoT);
  _nextNodeIdx = (_nextNodeIdx + 1) % NODE_COUNT;
}