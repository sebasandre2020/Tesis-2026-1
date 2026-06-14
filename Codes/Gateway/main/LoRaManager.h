#ifndef LORAMANAGER_H
#define LORAMANAGER_H

#include <Arduino.h>

class LoRaManager {
public:
    LoRaManager(uint8_t rxPin, uint8_t txPin, uint8_t auxPin, uint8_t m0Pin, uint8_t m1Pin);
    void begin();
    bool receivePacket(String &payload);

private:
    uint8_t _rxPin;
    uint8_t _txPin;
    uint8_t _auxPin;
    uint8_t _m0Pin;
    uint8_t _m1Pin;
    HardwareSerial* _serial;
};

#endif // LORAMANAGER_H
