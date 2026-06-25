# Arduino UNO Sensor Node

Firmware for the perception-layer node: an **Arduino UNO** broadcasting
simulated CO₂ / dust / temperature / humidity readings every 60 s via the
**E220-900T30D** LoRa module.

The packets are picked up by the ESP32 gateway in
[`Codes/Gateway/main`](../Gateway/main) and forwarded to Azure IoT Hub.

---

## 1. Hardware required

| Component | Qty | Notes |
|---|---|---|
| Arduino UNO (ATmega328P) | 1 | Any clone works. |
| E220-900T30D (915 MHz) | 1 | Must have an antenna attached **before** powering on. |
| Resistor 1 kΩ | 1 | Voltage divider. |
| Resistor 2 kΩ | 1 | Voltage divider. |
| Breadboard + jumper wires | — | For prototyping. |
| (Optional) External 5 V / ≥1 A supply | 1 | Recommended for sustained max-power transmission. |

The E220 datasheet (`E220-900T30D_UserManual_EN_v1.0.pdf`) and Arduino
datasheet (`A000066-datasheet.pdf`) are saved in this folder for reference.

---

## 2. Pin map

| Arduino UNO pin | E220-900T30D pin | Direction | Notes |
|---|---|---|---|
| **D10** | TXD | UNO ← E220 | Direct wire. 3.3 V from E220 is read as HIGH by the 5 V UNO. |
| **D11** | RXD | UNO → E220 | Through a **1 kΩ + 2 kΩ voltage divider** (5 V → 3.3 V). |
| **D5**  | M0  | UNO → E220 | Mode select 0. |
| **D6**  | M1  | UNO → E220 | Mode select 1. |
| **D7**  | AUX | UNO ← E220 | HIGH = module ready. |
| **5V**  | VCC | UNO → E220 | Powers the module. |
| **GND** | GND | UNO → E220 | Common ground. |

M0 and M1 are both LOW in this firmware (transparent transmission mode).
The gateway runs in the same mode, on the E220 factory default channel
(0x50, ≈ 915 MHz) and broadcast address (0xFFFF), so they pair
automatically.

---

## 3. Wiring diagram

```
                              Arduino UNO                      E220-900T30D
                              +----------+                     +-----------+
                              |          |                     |           |
                              |       D10+------->-------------<+TXD       |
                              |          |                     |           |
                              |       D11+---+                 |           |
                              |          |   |                 |           |
                              |          |  [1kΩ]              |           |
                              |          |   |                 |           |
                              |          |   +----+----[2kΩ]---+           |
                              |          |        |            |  +---->-->+RXD
                              |          |       GND           |  |
                              |          |                     |  |
                              |        D5+-------->-------------+->+M0
                              |          |                     |  |
                              |        D6+-------->-------------+->+M1
                              |          |                     |  |
                              |        D7+<---------<----------+--AUX
                              |          |                     |  |
                              |        5V+-------->-------------+->+VCC
                              |          |                     |  |
                              |       GND+-------->-------------+->+GND
                              +----------+                     +-----------+
                                                                |
                                                              (antenna!)
```

### 3.1 The 1 kΩ + 2 kΩ voltage divider (D11 → E220 RXD)

Arduino UNO outputs 5 V on its digital pins. The E220-900T30D's RXD line
expects 3.3 V logic — feeding 5 V directly can damage the module over
time. The simplest safe way to step 5 V down to 3.3 V is a two-resistor
divider:

```
  UNO D11 ----[ 1kΩ ]----o----[ 2kΩ ]---- GND
                         |
                         +-------> E220 RXD
```

Output voltage: `Vout = 5 V × 2 kΩ / (1 kΩ + 2 kΩ) ≈ 3.33 V`.

The other direction (E220 TXD → UNO D10) is fine without any divider: the
E220 outputs 3.3 V and the UNO recognizes anything ≥ ~3.0 V as HIGH on a
5 V board.

---

## 4. Configure `NODE_ID`

Open `main.ino` and change the `NODE_ID` define to a unique value for each
physical node:

```cpp
#define NODE_ID "Node_01"   // use "Node_02", "Node_03", etc.
```

Whatever string you put here is forwarded verbatim by the gateway to
Azure IoT Hub, and the dashboard uses it to label the trace.

---

## 5. Flash the firmware

1. Open `main.ino` in the Arduino IDE (1.8.x or 2.x).
2. **Tools → Board → Arduino Uno**.
3. **Tools → Port →** the COM port of your UNO.
4. **Sketch → Upload** (Ctrl+U).
5. **Tools → Serial Monitor**, set baud to **9600**.

No external libraries are required — `SoftwareSerial` ships with the IDE
and `dtostrf` / `snprintf` are part of AVR libc.

---

## 6. Expected serial-monitor output

```
Arduino UNO node "Node_01" starting...
[LORA] E220-900T30D initialized (transparent mode, 9600 8N1).
[BOOT] Initial random delay: 17 s
[BOOT] Publishing first packet...
[TX] {"node_id":"Node_01","co2":742,"dust":31,"temperature":22.4,"humidity":48.7}
[TX] {"node_id":"Node_01","co2":589,"dust":12,"temperature":21.8,"humidity":52.3}
...
```

A new packet prints every **60 s**.

---

## 7. End-to-end test (gateway + node)

1. Flash the gateway with `USE_LORA_REAL true` (see
   [`Codes/Gateway/main/main.ino`](../Gateway/main/main.ino)).
2. Open the gateway's serial monitor at **115200** baud.
3. Power up one or more UNO nodes (each with its own `NODE_ID`).
4. On the gateway you should see lines like:

   ```
   [LORA] Received: {"node_id":"Node_01","co2":742,"dust":31,"temperature":22.4,"humidity":48.7}
   [LORA] -> Published to Azure.
   ```

5. Open the React dashboard — the reading appears within a few seconds.

To go back to the cloud-only smoke test (no LoRa), flip `USE_LORA_REAL`
back to `false` and re-flash the gateway.

---

## 8. Payload format

```json
{"node_id":"Node_01","co2":742,"dust":31,"temperature":22.4,"humidity":48.7}
```

Fields:

| Field | Type | Units | Source (planned) |
|---|---|---|---|
| `node_id`     | string | —       | Compile-time constant. |
| `co2`         | int    | ppm     | MH-Z19 (NDIR). |
| `dust`        | int    | µg/m³   | Sharp GP2Y1010AU0F. |
| `temperature` | float  | °C      | DHT22 / DS18B20. |
| `humidity`    | float  | %       | DHT22. |

Until the sensors are wired up, every value is generated by
`random(min, max)` with classroom-realistic ranges.

---

## 9. Power considerations

The E220-900T30D can draw **600 mA+ when transmitting at maximum power**
(30 dBm / 1 W). The Arduino UNO's 5 V pin (USB-powered) can supply about
500 mA before its polyfuse trips, which is borderline.

- For short tests at default / low power: USB power is fine.
- For sustained max-power transmission: power the E220 from an
  **external 5 V / ≥1 A supply** and share the GND with the UNO.

---

## 10. Troubleshooting

| Symptom | Likely cause |
|---|---|
| No `[LORA] E220 initialized` line | Check 5V / GND / AUX wiring; check that the antenna is attached. |
| Serial shows `[TX] ...` but gateway sees nothing | Different E220 channel/address on one side; M0/M1 not both LOW; baud rate mismatch; antenna disconnected on either side; out of range. |
| Garbled JSON on the gateway | Baud rate mismatch (must be 9600 on both) or TX/RX swapped (remember: UNO TX goes to E220 RXD through the divider). |
| Gateway publishes nothing | Wi-Fi or Azure credentials missing / wrong — see `Codes/Gateway/main/secrets.h`. |
| Random resets during TX | UNO 5 V rail sagging under E220 current draw; use external 5 V supply. |