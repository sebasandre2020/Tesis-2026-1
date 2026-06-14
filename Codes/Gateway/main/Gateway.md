# Gateway Implementation Guide

This document describes the hardware wiring and software structure of the ESP32-based Gateway for the IoT CO₂ Level Monitoring System.

## 1. Hardware Connections (Wiring Diagram)

The Gateway is composed of an **ESP32** microcontroller and an **E220-900T30D (915 MHz)** LoRa module. Since the E220 module operates via UART, it is connected to the ESP32's Hardware Serial 2 pins.

| E220-900T30D Pin | ESP32 Pin | Description |
| :--- | :--- | :--- |
| **M0** | GPIO 4 | Mode selection pin 0 (Used to switch between normal, wake-up, power-saving, and sleep modes). |
| **M1** | GPIO 5 | Mode selection pin 1. |
| **RXD** | GPIO 17 (TX2) | Serial UART Receive (Connects to ESP32 TX). |
| **TXD** | GPIO 16 (RX2) | Serial UART Transmit (Connects to ESP32 RX). |
| **AUX** | GPIO 15 | Auxiliary pin (Indicates module's working status, e.g., transmitting/receiving). |
| **VCC** | 3.3V or 5V | Power supply (Ensure your ESP32 can provide enough current, or use an external 5V source with common ground if transmitting at 30dBm). |
| **GND** | GND | Common Ground. |

> [!WARNING]
> The E220-900T30D can draw up to 600mA+ when transmitting at maximum power (30dBm / 1W). The ESP32's onboard 3.3V regulator *cannot* supply this current. It is highly recommended to power the E220 module directly from a stable 5V source (like the VIN pin if powered by USB, or an external power supply), ensuring the ESP32 and E220 share a common GND. The IO pins on the E220 are 3.3V tolerant.

## 2. Firmware Structure

The codebase is modular, separating concerns into individual classes.

- `main.ino`: The main Arduino entry point. It initializes components, runs the main loop, handles LoRa packet reception, and delegates publishing to the Azure IoT Manager.
- `LoRaManager.h` & `LoRaManager.cpp`: Encapsulates UART communication with the E220-900T30D module. It parses incoming telemetry payload strings from the sensor nodes.
- `AzureIoTManager.h` & `AzureIoTManager.cpp`: Handles Wi-Fi connectivity and MQTT connection to the Azure IoT Hub. 
- `secrets.h.template`: A template file for sensitive credentials. **You must copy this file to `secrets.h` and fill in your actual credentials.** The `secrets.h` file is ignored by git to ensure security.

## 3. Initial Setup

1. Copy `secrets.h.template` and rename it to `secrets.h`.
2. Update `secrets.h` with your Wi-Fi SSID, Wi-Fi Password, and Azure IoT Hub Device Connection String.
3. Install the required libraries in your Arduino IDE / PlatformIO:
   - `PubSubClient` (for MQTT)
   - `ArduinoJson` (optional, if you expand to parse complex JSON payloads)
4. Select your ESP32 board and compile/upload the firmware.
