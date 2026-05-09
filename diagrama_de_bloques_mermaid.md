```mermaid
graph TD
    %% Estilos de componentes
    classDef nodos fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20;
    classDef hardware fill:#e1f5fe,stroke:#0277bd,stroke-width:2px,color:#01579b;
    classDef logica fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100;
    classDef azure fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;
    classDef titulo fill:transparent,stroke:none,font-weight:bold,font-size:16px;

    subgraph Nodos_Sensores [" "]
        TitNodos["Estructura de los Nodos Sensores (x3)"]:::titulo
        
        subgraph HW_Nodo ["Componentes Internos del Nodo"]
            P_N((fa:fa-battery-full Alimentación)):::nodos
            S_N>fa:fa-wind Sensor CO2]:::nodos
            MCU_N[fa:fa-microchip MCU Arduino/STM32]:::nodos
            L_N{{fa:fa-broadcast-tower LoRa 915 MHz}}:::nodos
            
            P_N --> MCU_N
            S_N -- I2C/UART --> MCU_N
            MCU_N -- SPI/UART --> L_N
        end
        TitNodos ~~~ HW_Nodo
    end

    subgraph Gateway [" "]
        TitGW["Gateway con Edge Computing"]:::titulo
        
        subgraph HW_GW ["Hardware del Gateway"]
            P_G((fa:fa-plug Alimentación)):::hardware
            L_G{{fa:fa-satellite-dish Concentrador LoRa}}:::hardware
            MCU_G[fa:fa-server ESP32 / Raspberry Pi]:::hardware
            W_G(((fa:fa-wifi Módulo Wi-Fi))):::hardware
            
            P_G --> MCU_G
            L_G -- SPI/UART --> MCU_G
            MCU_G --- W_G
        end

        subgraph SW_GW ["Software / Edge Processing"]
            Broker[fa:fa-exchange-alt Broker MQTT Local]:::logica
            AppEdge(fa:fa-cogs Lógica y Alertas):::logica
            BDLocal[(fa:fa-hdd Base Datos Local)]:::logica
            WebLocal[/fa:fa-desktop Dashboard Local/]:::logica
            
            Broker --> AppEdge
            AppEdge <--> BDLocal
            AppEdge <--> WebLocal
        end
        
        MCU_G -. Ejecuta .-> SW_GW
        TitGW ~~~ HW_GW
    end

    subgraph Nube [" "]
        TitNube["fa:fa-cloud Azure Cloud Services"]:::titulo
        DB_Azure[(fa:fa-database Azure SQL/Cosmos)]:::azure
        
        TitNube ~~~ DB_Azure
    end

    L_N -- "Radio (LoRaWAN / LoRa P2P)" --> L_G
    
    %% Conexión Wi-Fi a Internet y Protocolo de Aplicación
    W_G -- "Conexión TCP/IP (Vía Wi-Fi)" --> AppEdge
    AppEdge -- "Sincronización Cloud<br>Protocolo: HTTPS o MQTT TLS" --> DB_Azure