#include "LoRaManager.h"

LoRaManager::LoRaManager(uint8_t rxPin, uint8_t txPin, uint8_t auxPin, uint8_t m0Pin, uint8_t m1Pin)
    : _rxPin(rxPin), _txPin(txPin), _auxPin(auxPin), _m0Pin(m0Pin), _m1Pin(m1Pin) {
    // E220 uses UART, we map it to ESP32 HardwareSerial 2
    _serial = &Serial2;
}

void LoRaManager::begin() {
    pinMode(_auxPin, INPUT);
    pinMode(_m0Pin, OUTPUT);
    pinMode(_m1Pin, OUTPUT);

    // Set normal operation mode (M0 = 0, M1 = 0)
    digitalWrite(_m0Pin, LOW);
    digitalWrite(_m1Pin, LOW);

    // Initialize UART at 9600 baud rate (default for E220)
    _serial->begin(9600, SERIAL_8N1, _rxPin, _txPin);
    delay(500); // Wait for module to stabilize
    Serial.println("LoRa Manager initialized.");
}

bool LoRaManager::receivePacket(String &payload) {
    if (_serial->available()) {
        payload = _serial->readStringUntil('\n');
        payload.trim(); // Remove trailing newline/carriage return
        if (payload.length() > 0) {
            return true;
        }
    }
    return false;
}
