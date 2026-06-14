# IoT CO₂ Monitoring System for UTEC Classrooms

## 1. 🚀 Project Overview
This repository contains the source code and configuration for the **IoT CO₂ Level Monitoring System**, designed to control and monitor air quality across university classrooms at UTEC. 

The system operates on a star network topology using LoRa communication to transmit telemetry data from distributed sensor nodes to a central custom gateway, which then bridges the data to a scalable, secure, and low-cost Azure cloud infrastructure for real-time visualization and alerting.

---

## 2. 🏗️ System Architecture & Resources

This system is divided into three distinct functional layers: the Perception Layer, the Edge Layer, and the Cloud/Application Layer. This separation of concerns ensures that data collection, routing, processing, and visualization are highly decoupled and scalable.

### 2.1 Hardware and Edge Layers

#### Perception Layer (Sensor Nodes)
These are the devices physically located inside the classrooms. Their primary responsibility is to read the environmental CO₂ concentration and transmit the data securely over long distances using radio frequency.
* **Microcontroller:** Arduino UNO.
* **CO₂ Sensor:** MH-Z19 (Provides highly accurate NDIR CO₂ measurements).
* **LoRa Module:** E220-900T30D (915 MHz) for long-range, low-power transmission.
* **Simulated Telemetry Note:** While the physical sensor nodes are intended for deployment, the current Azure backend deployment includes a simulated telemetry approach with seeded "dummy" nodes (e.g., *Aula 101, Laboratorio, Biblioteca*) to allow immediate end-to-end testing and frontend rendering without requiring physical hardware to be active.

#### Edge Layer (Custom Gateway)
Acting as the central hub of our star network topology, the gateway receives LoRa packets from multiple nodes (designed for 3 nodes initially) and acts as an internet bridge, retransmitting the payloads to the cloud.
* **Microcontroller:** ESP32 (Handles Wi-Fi connectivity and MQTT processing).
* **LoRa Module:** E220-900T30D (915 MHz).

### 2.2 Cloud & Application Layer (Azure)
The system leverages an optimized, low-cost (Free/Consumption tier prioritized) Azure architecture to handle high-frequency IoT telemetry, storage, and real-time visualization.

* **Azure IoT Hub (Free Tier):** Acts as the secure, high-throughput entry point for the system. It handles device authentication and receives continuous telemetry payloads from the ESP32 Gateway via MQTT/HTTPS.
* **Azure Functions (Consumption Plan):** A serverless event-driven processor. It automatically triggers upon receiving messages from the IoT Hub. Its role is to unpack, validate, and format the raw LoRa data before persisting it to the database.
* **Azure SQL Database (Basic/DTU):** A relational storage engine used to persist historical telemetry data and classroom configuration. It is optimized for the complex, indexed queries required by the frontend's historical charts.
* **Azure Container Apps (Consumption Plan):** A serverless container execution environment that hosts the .NET Core backend API. It utilizes a *Scale to Zero* feature, meaning the application consumes absolutely zero compute resources (and costs) when there are no active requests.
* **Azure Static Web Apps (Free Plan):** A fast, global hosting service used to distribute the React frontend dashboard directly to the users' browsers.

### 2.3 Software Architecture Design Patterns

**Backend (.NET Core / C#):**
* **Clean Architecture:** Ensures business logic (Domain) is completely decoupled from technological infrastructure (Databases, Cloud Services).
* **CQRS (Command Query Responsibility Segregation):** Separates high-frequency write operations (IoT ingestion) from heavy read operations (historical charts).
* **Observer Pattern:** Used as the alert engine. When a CO₂ reading exceeds thresholds, it publishes an event notifying the web sockets and alert services.
* **RBAC & Managed Identities:** Secures internal container-to-database communication and manages user access levels.

**Frontend (React.js / TypeScript):**
* **Feature-Based Architecture:** Code is grouped by domain feature (e.g., `co2-dashboard`, `alerts`) rather than file type, ensuring high modularity.
* **Container and Presentational Pattern:** Smart containers handle API communication, while dumb presentational components are strictly visual, making them 100% reusable.
* **Reactive WebSockets:** The frontend subscribes to real-time *push* messages emitted by the cloud, triggering instant critical UI alerts without requiring manual page reloads.

---

## 3. 🔌 Hardware Connections (Gateway)

The ESP32 Custom Gateway connects to the E220-900T30D LoRa module via UART (Hardware Serial 2). 

| E220-900T30D Pin | ESP32 Pin | Description |
| :--- | :--- | :--- |
| **M0** | GPIO 4 | Mode selection pin 0. |
| **M1** | GPIO 5 | Mode selection pin 1. |
| **RXD** | GPIO 17 (TX2) | Serial UART Receive (Connects to ESP32 TX). |
| **TXD** | GPIO 16 (RX2) | Serial UART Transmit (Connects to ESP32 RX). |
| **AUX** | GPIO 15 | Auxiliary pin (Indicates module's working status). |
| **VCC** | 3.3V or 5V | Power supply (5V external source recommended for 30dBm transmission). |
| **GND** | GND | Common Ground. |

> **Warning:** When transmitting at maximum power (30dBm / 1W), the E220-900T30D module can draw over 600mA. Do not power the LoRa module directly from the ESP32's 3.3V pin, as it may cause brownouts. Use a dedicated 5V external supply and share the common ground.

---

## 4. 📂 Directory Structure

```text
📦 Codes
 ┣ 📂 Backend                 # .NET Core Application containing the REST API, Domain, and Infrastructure logic.
 ┣ 📂 Frontend                # React.js application with features for the real-time CO₂ dashboard and alerts.
 ┣ 📂 Gateway                 # C/C++ firmware for the ESP32 Gateway and Azure IoT integration.
 ┣ 📂 Software Infraestructure # Bicep templates and deployment scripts for Azure resources.
 ┗ 📂 .github/workflows       # CI/CD pipelines for automating deployments to Azure.
```

---

## 5. 🛠️ How to Run & Deploy

### Local Development

**Backend (.NET Core):**
1. Navigate to the `Backend` directory.
2. Ensure you have the .NET SDK installed.
3. Configure your local database connection string in `appsettings.Development.json`.
4. Run the application:
   ```bash
   dotnet run
   ```

**Frontend (React.js):**
1. Navigate to the `Frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### CI/CD (GitHub Actions)
The project utilizes GitHub Actions to automate the deployment process to Azure, ensuring continuous integration and delivery. 

The pipelines are defined in the `.github/workflows` directory:
* **Frontend Pipeline:** Automatically builds the React application and deploys it to Azure Static Web Apps. Requires the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret.
* **Backend Pipeline:** Builds the .NET Core backend into a Docker image, pushes it to GitHub Container Registry (GHCR), and deploys it to Azure Container Apps. Requires the `AZURE_CREDENTIALS` secret.
