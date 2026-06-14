#include "AzureIoTManager.h"
#include <time.h>
#include <mbedtls/base64.h>
#include <mbedtls/md.h>
#include <mbedtls/sha256.h>

AzureIoTManager::AzureIoTManager(const char* ssid, const char* password, const char* connString)
    : _ssid(ssid), _password(password), _connString(connString), _mqttClient(_wifiClient) {
}

void AzureIoTManager::parseConnectionString() {
    String connStr = String(_connString);
    int hostNameIdx = connStr.indexOf("HostName=") + 9;
    int deviceIdIdx = connStr.indexOf("DeviceId=") + 9;
    int sharedAccessKeyIdx = connStr.indexOf("SharedAccessKey=") + 16;
    
    int hostNameEnd = connStr.indexOf(';', hostNameIdx);
    int deviceIdEnd = connStr.indexOf(';', deviceIdIdx);
    
    _hostName = connStr.substring(hostNameIdx, hostNameEnd);
    _deviceId = connStr.substring(deviceIdIdx, deviceIdEnd);
    _sharedAccessKey = connStr.substring(sharedAccessKeyIdx);
}

void AzureIoTManager::begin() {
    parseConnectionString();
    connectWiFi();
    
    // Configure NTP to get time (required for SAS token generation)
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    while (time(nullptr) < 1600000000) {
        delay(100);
    }
    
    // Azure IoT Hub uses Baltimore CyberTrust Root, but WiFiClientSecure in ESP32 allows setInsecure() for quick setups
    _wifiClient.setInsecure(); 
    
    _mqttClient.setServer(_hostName.c_str(), 8883);
}

void AzureIoTManager::connectWiFi() {
    Serial.print("Connecting to Wi-Fi");
    WiFi.begin(_ssid, _password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWi-Fi Connected.");
}

String AzureIoTManager::urlEncode(const char* msg) {
    const char *hex = "0123456789abcdef";
    String encodedMsg = "";
    while (*msg != '\0') {
        if (('a' <= *msg && *msg <= 'z') || ('A' <= *msg && *msg <= 'Z') || ('0' <= *msg && *msg <= '9') || *msg == '-' || *msg == '_' || *msg == '.' || *msg == '~') {
            encodedMsg += *msg;
        } else {
            encodedMsg += '%';
            encodedMsg += hex[*msg >> 4];
            encodedMsg += hex[*msg & 15];
        }
        msg++;
    }
    return encodedMsg;
}

String AzureIoTManager::createSASToken(String resourceUri, String keyName, String key, int expiry) {
    uint32_t timestamp = time(nullptr) + expiry;
    String stringToSign = urlEncode(resourceUri.c_str()) + "\n" + String(timestamp);
    
    size_t keyLen = key.length();
    unsigned char decodedKey[256];
    size_t decodedKeyLen = 0;
    mbedtls_base64_decode(decodedKey, sizeof(decodedKey), &decodedKeyLen, (const unsigned char*)key.c_str(), keyLen);
    
    unsigned char mac[32];
    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
    mbedtls_md_hmac_starts(&ctx, decodedKey, decodedKeyLen);
    mbedtls_md_hmac_update(&ctx, (const unsigned char*)stringToSign.c_str(), stringToSign.length());
    mbedtls_md_hmac_finish(&ctx, mac);
    mbedtls_md_free(&ctx);
    
    unsigned char base64Mac[256];
    size_t base64MacLen = 0;
    mbedtls_base64_encode(base64Mac, sizeof(base64Mac), &base64MacLen, mac, 32);
    
    String signature = urlEncode((const char*)base64Mac);
    String sasToken = "SharedAccessSignature sr=" + urlEncode(resourceUri.c_str()) + "&sig=" + signature + "&se=" + String(timestamp);
    if (keyName.length() > 0) {
        sasToken += "&skn=" + keyName;
    }
    return sasToken;
}

void AzureIoTManager::connectMQTT() {
    while (!_mqttClient.connected()) {
        Serial.print("Connecting to MQTT...");
        
        String clientId = _deviceId;
        String username = _hostName + "/" + _deviceId + "/?api-version=2021-04-12";
        String resourceUri = _hostName + "/devices/" + _deviceId;
        String password = createSASToken(resourceUri, "", _sharedAccessKey, 3600); // Token valid for 1 hour
        
        if (_mqttClient.connect(clientId.c_str(), username.c_str(), password.c_str())) {
            Serial.println("connected");
        } else {
            Serial.print("failed, rc=");
            Serial.print(_mqttClient.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

void AzureIoTManager::loop() {
    if (WiFi.status() != WL_CONNECTED) {
        connectWiFi();
    }
    if (!_mqttClient.connected()) {
        connectMQTT();
    }
    _mqttClient.loop();
}

bool AzureIoTManager::publishTelemetry(const String &payload) {
    if (_mqttClient.connected()) {
        String topic = "devices/" + _deviceId + "/messages/events/";
        return _mqttClient.publish(topic.c_str(), payload.c_str());
    }
    return false;
}
