#ifndef SIMULATION_MANAGER_H
#define SIMULATION_MANAGER_H

#include <Arduino.h>

class AzureIoTManager;

/**
 * Generates and publishes simulated CO2 / dust / temperature / humidity
 * readings for a fixed set of 3 virtual nodes (Aula 101, Laboratorio,
 * Biblioteca). Used by the gateway when no physical sensor nodes are
 * transmitting — i.e. when USE_LORA_REAL is false in main.ino.
 *
 * Each call to publishNextReading() advances an internal cursor so the
 * 3 nodes are sampled in round-robin.
 */
class SimulationManager {
public:
  SimulationManager();

  // Publishes one reading per simulated node (used at boot so the
  // dashboard has data from the first GET).
  void publishInitialReadings(AzureIoTManager &azureIoT);

  // Publishes the next reading in the rotation and advances the cursor.
  void publishNextReading(AzureIoTManager &azureIoT);

private:
  struct NodeSim {
    const char *nodeId;
    int co2Min, co2Max;        // ppm
    int dustMin, dustMax;      // µg/m³
    int tempMinDec, tempMaxDec; // tenths of °C (190 = 19.0 °C)
    int humMinDec, humMaxDec;   // tenths of % (550 = 55.0 %)
  };

  static const NodeSim NODES[];
  static const int NODE_COUNT;

  int _nextNodeIdx;

  // Builds the JSON payload for NODES[idx] and forwards it to azureIoT.
  void publishNodeReading(int idx, AzureIoTManager &azureIoT);
};

#endif // SIMULATION_MANAGER_H