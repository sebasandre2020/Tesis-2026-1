#ifndef AZUREIOTMANAGER_H
#define AZUREIOTMANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>

class AzureIoTManager {
public:
    AzureIoTManager(const char* ssid, const char* password, const char* connString);
    void begin();
    void loop();
    bool publishTelemetry(const String &payload);

private:
    const char* _ssid;
    const char* _password;
    const char* _connString;
    
    String _hostName;
    String _deviceId;
    String _sharedAccessKey;
    
    WiFiClientSecure _wifiClient;
    PubSubClient _mqttClient;

    void connectWiFi();
    void connectMQTT();
    void parseConnectionString();
    String createSASToken(String resourceUri, String keyName, String key, int expiry);
    String urlEncode(const char* msg);
};

#endif // AZUREIOTMANAGER_H
