#ifndef LORAMANAGER_H
#define LORAMANAGER_H

#include <Arduino.h>

class LoRaManager {
public:
    LoRaManager(uint8_t rxPin, uint8_t txPin, uint8_t auxPin);
    void begin();
    bool receivePacket(String &payload);

private:
    uint8_t _rxPin;
    uint8_t _txPin;
    uint8_t _auxPin;
    HardwareSerial* _serial;
    String _rxBuffer;
};

#endif // LORAMANAGER_H
