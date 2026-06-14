# 📡 IoT CO₂ Level Monitoring System

Thesis project for the design and implementation of an IoT monitoring, control, and alert system for CO₂ levels in university spaces at UTEC. The system uses LoRa communication through a star network topology with a custom gateway, integrated with a scalable, secure, and low-cost cloud infrastructure.

---

## 🏗️ General System Architecture

The project is divided into three main layers that guarantee the collection, processing, and visualization of air quality in real-time, maintaining low bandwidth consumption and high availability.

1. **Perception Layer (Sensor Nodes):** Devices located in the classrooms that read the CO₂ concentration and transmit the data via radio frequency.
2. **Edge Layer (Custom Gateway):** Acts as the central hub of the star topology. Receives LoRa packets from multiple nodes (initially 3 for this phase) and retransmits them to the cloud using Wi-Fi/Internet.
3. **Cloud and Application Layer (Azure):** Infrastructure responsible for ingestion, storage, business rule processing (alerts), and data exposure to end users.

---

## ☁️ Infrastructure Components (Cloud & Hardware)

### Hardware and Edge

#### Sensor Node
| Component | Model |
| :--- | :--- |
| **Microcontroller** | Arduino UNO |
| **LoRa Module** | E220-900T30D 915 MHz |
| **CO₂ Sensor** | MH-Z19 |

#### Custom Gateway
| Component | Model |
| :--- | :--- |
| **Microcontroller + Wi-Fi** | ESP32 |
| **LoRa Module** | E220-900T30D 915 MHz |

### Azure Infrastructure (Optimized for $0 Budget)
* **Azure IoT Hub (Free Tier):** Secure entry point that receives MQTT/HTTPS telemetry from the Gateway. Handles device authentication and continuous message reception.
* **Azure Functions (Consumption Plan):** Event-driven *serverless* processor. Automatically triggers upon receiving messages from the IoT Hub to unpack, validate, and format LoRa data, then sends it to the database.
* **Azure SQL Database (Basic/DTU):** Relational engine for historical telemetry storage and classroom configuration. Ideal for complex and indexed queries.
* **Azure Container Apps (Consumption Plan):** *Serverless* container execution environment hosting the backend API. Allows scaling to zero (*Scale to Zero*) to avoid consuming resources when there are no requests. Docker images are pulled from GitHub Container Registry (GHCR) via CI/CD pipelines to avoid registry costs.
* **Azure Static Web Apps (Free Plan):** Fast, global hosting service to distribute the frontend web application to users' browsers.

---

## 📐 Software Architecture (Backend)

The system's backend is designed under the principles of **Clean Architecture** or Hexagonal Architecture, ensuring that business logic is completely decoupled from technological infrastructure (databases, cloud services, or user interfaces).

### Layer Structure

    📦 src
     ┣ 📂 Domain         # Base entities (Node, CO2Reading, Alert) and pure rules. Zero external dependencies.
     ┣ 📂 Application    # Use cases (RegisterReading, GenerateAlert) and interfaces (Contracts).
     ┣ 📂 Infrastructure # Data access (EF Core), external communication, Azure integration.
     ┗ 📂 API            # REST controllers, dependency injection, and container configuration.

### Implemented Design Patterns

* **CQRS (Command Query Responsibility Segregation):** Strict separation between write operations (high frequency IoT telemetry ingestion) and read operations (heavy historical queries for frontend charts).
* **Repository Pattern & Unit of Work:** Abstraction of the SQL database. Allows centralized data access, facilitating unit testing and allowing for future database engine changes if necessary.
* **Observer (Publisher/Subscriber):** Fundamental for the alert engine. When a CO₂ reading exceeds the allowed limit, an event is published notifying the services in charge of registering the alert, sending notifications, and updating the web.
* **RBAC (Role-Based Access Control):** Security pattern implemented to manage user permissions (e.g., Administrator vs. Viewer). Relies on Azure *Managed Identities* for secure internal communication between containers and the database.

---

## 🖥️ Frontend Architecture and Design Patterns

The web application is designed to efficiently handle real-time data flow (critical alerts) and fluid historical data visualization, prioritizing modularity and reusability.

### Project Structure (Feature-Based Architecture)

The project is organized into **modules or features** rather than grouped by file type. This makes the application more scalable and easier to maintain.

    📦 src
     ┣ 📂 assets         # Images, icons, and global styles (Tailwind).
     ┣ 📂 components     # Generic and reusable UI components (Buttons, Cards, Modals).
     ┣ 📂 features       # Domain-specific modules.
     ┃ ┣ 📂 co2-dashboard# Logic, views, and components for the sensor dashboard.
     ┃ ┗ 📂 alerts       # Logic and views for critical notifications.
     ┣ 📂 hooks          # Global custom hooks (e.g., useAuth, useTheme).
     ┣ 📂 services       # HTTP clients (Axios/Fetch) and WebSockets configuration.
     ┣ 📂 store          # Global state management (Context API or Zustand/Redux).
     ┗ 📂 utils          # Helper functions (date formatting, average calculations).

### Implemented Design Patterns

* **Container and Presentational Components Pattern:**
  * **Containers (Smart):** Manage business logic, communicate with the Azure API, and handle state (e.g., a component that fetches historical CO₂ from the database).
  * **Presentational (Dumb):** Only receive data (`props`) and render it (e.g., a line chart). They are agnostic about data origin, making them 100% reusable.
* **Custom Hooks:** Abstract complex logic from the interface. For example, a `useRealTimeCO2()` hook encapsulates WebSocket connection and telemetry subscriptions, returning only clean values to the component.
* **Provider Pattern:** Used with *React Context* to inject global states (like user session or visual theme) throughout the component tree, avoiding manual property passing level by level (*prop-drilling*).
* **Reactive Observer (via WebSockets):** The frontend acts as a real-time subscriber. The interface autonomously reacts to *push* messages emitted by the cloud when CO₂ exceeds the threshold, showing instant alerts without reloading the page.

---

## 💻 Technologies and Frameworks

| Layer | Technologies | Justification |
| :--- | :--- | :--- |
| **Firmware (Nodes and Gateway)** | C/C++ (Arduino IDE / ESP-IDF) | Low-level hardware control, memory optimization, and mature support for radio frequency libraries (LoRa). |
| **Backend API** | C# and .NET Core | High performance in concurrent processing, strongly typed, and native, optimized integration with the Azure ecosystem. |
| **Frontend Web** | React.js and TypeScript | Creation of a fluid SPA (*Single Page Application*) with strict typing. Ideal for rendering dynamic charts and real-time metrics. |
| **Database** | Azure SQL Database (T-SQL) | Solid structuring of relational historical data, ideal for aggregate queries and university report generation. |
| **CI/CD and Containers** | Docker, GitHub Actions, GHCR | Automation of the software lifecycle and continuous deployment to Azure Container Apps without additional private registry costs. |