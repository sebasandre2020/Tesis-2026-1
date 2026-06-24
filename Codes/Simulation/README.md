# Simulator — `simulate.py`

Sends simulated **CO₂ / Polvo (Sharp GP2Y1010AU0F) / Temperatura + Humedad (DHT22)**
readings for all 3 sensor nodes (Node_01, Node_02, Node_03) directly into
the Azure SQL database. Use this when the physical ESP32 gateway is
offline but you still want the frontend dashboard and per-node pages
to show live data.

This script **does not** send anything to the IoT Hub. It connects
directly to SQL and `INSERT`s into `TelemetryReadings`. The Azure
Function's `GetReadings` / `GetSensors` endpoints will pick up these
rows just like they pick up real gateway messages — so the per-node
filter, the comparative chart, the threshold lines, and the
"Sensor 1/2/3" cards all populate from the same source.

## 1. Install dependencies (one time)

From a PowerShell or cmd window in this directory:

```powershell
py -3 -m pip install -r requirements.txt
```

Also make sure the **Microsoft ODBC Driver 18 for SQL Server** is
installed on your machine (the function app uses AAD auth, this
script uses SQL auth with `adminuser` so it works from any machine
without AAD setup):

- Download: <https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server>
- Quick check: `py -3 -c "import pyodbc; print(pyodbc.drivers())"` should
  list `ODBC Driver 18 for SQL Server` (or 17).

## 2. Run it

From this directory:

```powershell
# Single batch (3 readings, one per node) — useful for quick smoke-tests
py -3 simulate.py --once

# Populate 24h of historical data per node (so the chart isn't empty
# on first load), then continue sampling every 15s
py -3 simulate.py --bootstrap 50

# Just continuous sampling (no historical bootstrap)
py -3 simulate.py

# Slower / faster sampling (seconds between cycles)
py -3 simulate.py --interval 30
py -3 simulate.py --interval 5
```

Stop with **Ctrl+C**. The script autocomits every insert, so partial
runs are safe.

## 3. Defaults

All of these can be overridden via environment variables:

| Var | Default | Meaning |
|---|---|---|
| `SQL_SERVER` | `tcp:sqlserver-co2-yfifyk.database.windows.net,1433` | SQL server (the `tcp:` prefix is auto-stripped for pyodbc) |
| `SQL_USER` | `adminuser` | SQL auth user |
| `SQL_PASSWORD` | `StrongP@ssw0rd2026!` | SQL auth password |
| `SQL_DATABASE` | `sqldb-co2-telemetry` | Database name |
| `SIM_INTERVAL` | `15` | Seconds between cycles (per-node rate = `SIM_INTERVAL × 3`) |

**Tip**: `SIM_INTERVAL=30 py -3 simulate.py` is a one-liner that
overrides the interval for that single run.

## 4. Per-node ranges

Same as the ESP32 gateway's `NODES[]` table. Edit `NODES` at the top
of `simulate.py` to change them.

| Node | CO₂ ppm | Polvo µg/m³ | Temp °C | Humedad % |
|---|---|---|---|---|
| Node_01 (Aula 101)     | 400–700   | 10–40   | 19.0–24.0 | 35.0–55.0 |
| Node_02 (Laboratorio)  | 500–1200  | 40–100  | 20.0–26.0 | 30.0–50.0 |
| Node_03 (Biblioteca)   | 380–550   | 5–25    | 18.0–23.0 | 40.0–60.0 |
