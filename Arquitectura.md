# 📡 Sistema de Monitoreo IoT para Niveles de CO₂

Proyecto de tesis para el diseño e implementación de un sistema de monitoreo, control y alerta IoT de niveles de CO₂ en espacios universitarios en UTEC. El sistema emplea comunicación LoRa mediante una topología de red estrella con un gateway personalizado, integrado con una infraestructura en la nube escalable, segura y de bajo costo.

---

## 🏗️ Arquitectura General del Sistema

El proyecto se divide en tres capas principales que garantizan la recolección, el procesamiento y la visualización de la calidad del aire en tiempo real, manteniendo un bajo consumo de ancho de banda y una alta disponibilidad.

1. **Capa de Percepción (Nodos Sensores):** Dispositivos ubicados en las aulas que leen la concentración de CO₂ y transmiten la data vía radiofrecuencia.
2. **Capa de Borde (Gateway Personalizado):** Actúa como el concentrador central de la topología estrella. Recibe los paquetes LoRa de múltiples nodos (inicialmente 3 para esta fase) y los retransmite a la nube utilizando Wi-Fi/Internet.
3. **Capa de Nube y Aplicación (Azure):** Infraestructura encargada de la ingesta, almacenamiento, procesamiento de reglas de negocio (alertas) y exposición de datos a los usuarios finales.

---

## ☁️ Componentes de la Infraestructura (Cloud & Hardware)

### Hardware y Borde

#### Nodo Sensor
| Componente | Modelo |
| :--- | :--- |
| **Microcontrolador** | Arduino UNO |
| **Módulo LoRa** | E220-900T30D 915 MHz |
| **Sensor de CO₂** | E220-900T30D 915 MHz |

#### Gateway Personalizado
| Componente | Modelo |
| :--- | :--- |
| **Microcontrolador + Wi-Fi** | ESP32 |
| **Módulo LoRa** | E220-900T30D 915 MHz |

### Infraestructura en Azure (Optimizada para Presupuesto $0)
* **Azure IoT Hub (Free Tier):** Punto de entrada seguro que recibe la telemetría MQTT/HTTPS del Gateway. Se encarga de la autenticación del dispositivo y la recepción continua de mensajes.
* **Azure Functions (Consumption Plan):** Procesador *serverless* basado en eventos. Se dispara automáticamente al recibir mensajes del IoT Hub para desempaquetar, validar y formatear los datos de LoRa, enviándolos luego a la base de datos.
* **Azure SQL Database (Basic/DTU):** Motor relacional para el almacenamiento histórico de telemetría y configuración de aulas. Ideal para realizar consultas complejas e indexadas.
* **Azure Container Apps (Consumption Plan):** Entorno de ejecución de contenedores *serverless* que aloja la API del backend. Permite escalar a cero (*Scale to Zero*) para no consumir recursos cuando no hay peticiones. Las imágenes Docker se obtienen de GitHub Container Registry (GHCR) mediante flujos de CI/CD para evitar costos de registro.
* **Azure Static Web Apps (Free Plan):** Servicio de alojamiento global y rápido para distribuir el frontend de la aplicación web a los navegadores de los usuarios.

---

## 📐 Arquitectura de Software (Backend)

El backend del sistema está diseñado bajo los principios de la **Arquitectura Limpia (Clean Architecture)** o Arquitectura Hexagonal, asegurando que la lógica de negocio esté completamente desacoplada de la infraestructura tecnológica (bases de datos, servicios de nube o interfaces de usuario).

### Estructura de Capas

    📦 src
     ┣ 📂 Domain         # Entidades base (Nodo, LecturaCO2, Alerta) y reglas puras. Cero dependencias externas.
     ┣ 📂 Application    # Casos de uso (RegistrarLectura, GenerarAlerta) e interfaces (Contratos).
     ┣ 📂 Infrastructure # Acceso a datos (EF Core), comunicación externa, integración con Azure.
     ┗ 📂 API            # Controladores REST, inyección de dependencias y configuración de contenedores.

### Patrones de Diseño Implementados

* **CQRS (Command Query Responsibility Segregation):** Separación estricta entre las operaciones de escritura (alta frecuencia de ingesta de telemetría IoT) y las de lectura (consultas pesadas de históricos para gráficos en el frontend).
* **Repository Pattern & Unit of Work:** Abstracción de la base de datos SQL. Permite un acceso centralizado a los datos, facilitando las pruebas unitarias y permitiendo cambiar el motor de base de datos en el futuro si fuera necesario.
* **Observer (Publicador/Suscriptor):** Fundamental para el motor de alertas. Cuando una lectura de CO₂ excede el límite permitido, se publica un evento que notifica a los servicios encargados de registrar la alerta, enviar notificaciones y actualizar la web.
* **RBAC (Role-Based Access Control):** Patrón de seguridad implementado para gestionar permisos de usuarios (ej. Administrador vs. Visualizador). Se apoya en *Managed Identities* de Azure para la comunicación interna segura entre los contenedores y la base de datos.

---

## 🖥️ Arquitectura y Patrones de Diseño del Frontend

La aplicación web está diseñada para manejar de manera eficiente el flujo de datos en tiempo real (alertas críticas) y la visualización fluida de datos históricos, priorizando la modularidad y la reutilización.

### Estructura del Proyecto (Feature-Based Architecture)

El proyecto se organiza en **módulos o características (Features)** en lugar de agruparse por tipo de archivo. Esto hace que la aplicación sea más escalable y fácil de mantener.

    📦 src
     ┣ 📂 assets         # Imágenes, iconos y estilos globales (Tailwind).
     ┣ 📂 components     # Componentes UI genéricos y reutilizables (Botones, Tarjetas, Modales).
     ┣ 📂 features       # Módulos específicos del dominio.
     ┃ ┣ 📂 co2-dashboard# Lógica, vistas y componentes del panel de sensores.
     ┃ ┗ 📂 alerts       # Lógica y vistas de notificaciones críticas.
     ┣ 📂 hooks          # Hooks personalizados globales (ej. useAuth, useTheme).
     ┣ 📂 services       # Clientes HTTP (Axios/Fetch) y configuración de WebSockets.
     ┣ 📂 store          # Gestión del estado global (Context API o Zustand/Redux).
     ┗ 📂 utils          # Funciones de ayuda (formateo de fechas, cálculo de promedios).

### Patrones de Diseño Implementados

* **Componentes Contenedores y Presentacionales (Container/Presentational Pattern):**
  * **Contenedores (Smart):** Gestionan la lógica de negocio, se comunican con la API de Azure y manejan el estado (ej. un componente que obtiene el histórico de CO₂ de la base de datos).
  * **Presentacionales (Dumb):** Solo reciben datos (`props`) y los renderizan (ej. un gráfico de líneas). Son agnósticos sobre el origen de los datos, lo que los hace 100% reutilizables.
* **Hooks Personalizados (Custom Hooks):** Abstraen lógica compleja de la interfaz. Por ejemplo, un hook `useRealTimeCO2()` encapsula la conexión a WebSockets y las suscripciones a telemetría, devolviendo solo los valores limpios al componente.
* **Patrón Proveedor (Provider Pattern):** Usado con *React Context* para inyectar estados globales (como la sesión del usuario o el tema visual) en todo el árbol de componentes, evitando pasar propiedades manualmente nivel por nivel (*prop-drilling*).
* **Observador Reactivo (vía WebSockets):** El frontend actúa como suscriptor en tiempo real. La interfaz reacciona autónomamente a los mensajes *push* emitidos por la nube cuando el CO₂ supera el umbral, mostrando alertas instantáneas sin recargar la página.

---

## 💻 Tecnologías y Frameworks

| Capa | Tecnologías | Justificación |
| :--- | :--- | :--- |
| **Firmware (Nodos y Gateway)** | C/C++ (Arduino IDE / ESP-IDF) | Control de bajo nivel del hardware, optimización de memoria y soporte maduro para librerías de radiofrecuencia (LoRa). |
| **Backend API** | C# y .NET Core | Alto rendimiento en procesamiento concurrente, fuertemente tipado e integración nativa y optimizada con el ecosistema de Azure. |
| **Frontend Web** | React.js y TypeScript | Creación de una SPA (*Single Page Application*) fluida con tipado estricto. Ideal para renderizar gráficos dinámicos y métricas en tiempo real. |
| **Base de Datos** | Azure SQL Database (T-SQL) | Estructuración sólida de datos históricos relacionales, ideal para consultas agregadas y generación de reportes universitarios. |
| **CI/CD y Contenedores** | Docker, GitHub Actions, GHCR | Automatización del ciclo de vida del software y despliegue continuo hacia Azure Container Apps sin costos adicionales de registro privado. |