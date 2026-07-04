#include "LoRaManager.h"

LoRaManager::LoRaManager(uint8_t rxPin, uint8_t txPin, uint8_t auxPin)
    : _rxPin(rxPin), _txPin(txPin), _auxPin(auxPin) {
    // E220 uses UART, we map it to ESP32 HardwareSerial 2
    _serial = &Serial2;
    _rxBuffer = "";
}

void LoRaManager::begin() {
    pinMode(_auxPin, INPUT_PULLUP);

    // Initialize UART at 9600 baud rate (default for E220)
    _serial->begin(9600, SERIAL_8N1, _rxPin, _txPin);
    delay(500); // Wait for module to stabilize
    Serial.println("LoRa Manager initialized.");
}

bool LoRaManager::receivePacket(String &payload) {
    bool packetReceived = false;
    while (_serial->available()) {
        char c = _serial->read();
        
        if (c == '\r') {
            continue; // Filter out carriage returns
        }
        
        if (c == '\n') {
            _rxBuffer.trim();
            if (_rxBuffer.length() > 0) {
                payload = _rxBuffer;
                packetReceived = true;
            }
            _rxBuffer = ""; // Clear buffer for next packet
            if (packetReceived) {
                return true; // Return immediately with the completed packet
            }
        } else {
            _rxBuffer += c;
            
            // Limit buffer size to prevent memory leaks or overflows if noise occurs
            if (_rxBuffer.length() > 200) {
                _rxBuffer = "";
            }
        }
    }
    return false;
}
