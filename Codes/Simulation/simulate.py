"""
simulate.py — Sends simulated CO2/polvo/temp/humedad readings for 3 nodes
directly to the Azure SQL database. Useful for testing the frontend when
the physical ESP32 gateway is offline.

USAGE (from a Windows PowerShell or cmd, in this directory):

  py -3 simulate.py                     # continuous, default 15s/node
  py -3 simulate.py --once              # single batch (3 readings, 1 per node)
  py -3 simulate.py --bootstrap 50      # 50 historical readings/node spread
                                         # over the last 24h, then start continuous
  py -3 simulate.py --interval 60       # 60s between cycles (slower)

The script connects to the same SQL DB your Azure Function uses and
INSERTs into TelemetryReadings. The IoT Hub is NOT involved — the
function app's GetReadings endpoint will pick up these rows just like
real gateway messages.

REQUIREMENTS:
  1. Python 3.8+ on PATH (Windows: install from python.org, then `py -3 --version`).
  2. pip install -r requirements.txt  (installs pyodbc).
  3. Microsoft ODBC Driver 18 for SQL Server.
     Download: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
     Quick check after install:  py -3 -c "import pyodbc; print(pyodbc.drivers())"
     should list "ODBC Driver 18 for SQL Server" or "ODBC Driver 17 for SQL Server".

ENVIRONMENT VARIABLES (optional — defaults match your project):
  SQL_SERVER      Default: tcp:sqlserver-co2-yfifyk.database.windows.net,1433
  SQL_USER        Default: adminuser
  SQL_PASSWORD    Default: StrongP@ssw0rd2026!
  SQL_DATABASE    Default: sqldb-co2-telemetry
  SIM_INTERVAL    Default: 15  (seconds between cycles, per-node reads at SIM_INTERVAL × 3)
"""

import argparse
import datetime as dt
import os
import random
import sys
import time

try:
    import pyodbc
except ImportError:
    sys.exit(
        "ERROR: pyodbc not installed. Run:\n"
        "  py -3 -m pip install -r requirements.txt"
    )


# =============================================================================
# Per-node simulation ranges (same as the ESP32 gateway's NODES[] table).
# =============================================================================
NODES = [
    {"id": "Node_01", "co2": (400, 700),  "dust": (10, 40),   "temp": (19.0, 24.0), "hum": (35.0, 55.0)},
    {"id": "Node_02", "co2": (500, 1200), "dust": (40, 100),  "temp": (20.0, 26.0), "hum": (30.0, 50.0)},
    {"id": "Node_03", "co2": (380, 550),  "dust": (5, 25),    "temp": (18.0, 23.0), "hum": (40.0, 60.0)},
]


def connection_string(driver: str) -> str:
    server = os.getenv("SQL_SERVER", "tcp:sqlserver-co2-yfifyk.database.windows.net,1433")
    # El prefijo "tcp:" del connection string guardado en local.settings.json
    # es específico de .NET. pyodbc espera el host:puerto directamente.
    if server.startswith("tcp:"):
        server = server[4:]
    user = os.getenv("SQL_USER", "adminuser")
    pwd = os.getenv("SQL_PASSWORD", "StrongP@ssw0rd2026!")
    db = os.getenv("SQL_DATABASE", "sqldb-co2-telemetry")
    return (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={db};"
        f"UID={user};"
        f"PWD={pwd};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
    )


def pick_driver() -> str:
    """Devuelve el primer driver ODBC para SQL Server disponible en el sistema."""
    available = pyodbc.drivers()
    for preferred in ("ODBC Driver 18 for SQL Server",
                       "ODBC Driver 17 for SQL Server"):
        if preferred in available:
            return preferred
    # Fallback: cualquier driver que contenga "SQL Server"
    for d in available:
        if "SQL Server" in d:
            return d
    sys.exit(
        "ERROR: no se encontró ningún driver ODBC para SQL Server.\n"
        "Instala Microsoft ODBC Driver 18 (recomendado):\n"
        "  https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server\n"
        f"Drivers vistos: {available}"
    )


def random_reading(node: dict, when: dt.datetime) -> tuple:
    """Genera una tupla (NodeId, Co2Level, DustLevel, Temperature, Humidity, Timestamp)."""
    return (
        node["id"],
        random.randint(*node["co2"]),
        random.randint(*node["dust"]),
        round(random.uniform(*node["temp"]), 2),
        round(random.uniform(*node["hum"]), 2),
        when,
    )


def insert_reading(cursor, row: tuple) -> None:
    """Inserta una fila. La columna Timestamp se rellena en SQL con GETDATE() si es None."""
    node_id, co2, dust, temp, hum, when = row
    if when is None:
        cursor.execute(
            "INSERT INTO TelemetryReadings (NodeId, Co2Level, DustLevel, Temperature, Humidity) "
            "VALUES (?, ?, ?, ?, ?)",
            node_id, co2, dust, temp, hum,
        )
    else:
        cursor.execute(
            "INSERT INTO TelemetryReadings (NodeId, Co2Level, DustLevel, Temperature, Humidity, Timestamp) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            node_id, co2, dust, temp, hum, when,
        )


def bootstrap(conn, n_per_node: int) -> None:
    """Inserta n_per_node lecturas históricas por nodo, espaciadas en las últimas 24h."""
    cursor = conn.cursor()
    now = dt.datetime.utcnow()
    span = dt.timedelta(hours=24)
    inserted = 0
    for node in NODES:
        for i in range(n_per_node):
            # Distribuye las lecturas uniformemente en las últimas 24h, sin
            # tocar la hora actual (siempre antes de now).
            offset = span * (i + 1) / (n_per_node + 1)
            when = now - offset
            row = random_reading(node, when)
            insert_reading(cursor, row)
            inserted += 1
    cursor.close()
    print(f"[bootstrap] inserted {inserted} historical readings "
          f"({n_per_node} per node, spread over the last 24h)")


def cycle(conn) -> int:
    """Inserta UNA lectura por nodo (un ciclo completo)."""
    cursor = conn.cursor()
    now = dt.datetime.utcnow()
    for node in NODES:
        row = random_reading(node, now)
        insert_reading(cursor, row)
        print(f"[{now.isoformat(timespec='seconds')}Z] {row[0]:8s}  "
              f"CO2={row[1]:>4d} ppm  dust={row[2]:>3d} µg/m³  "
              f"temp={row[3]:>4.1f} °C  hum={row[4]:>4.1f} %")
    cursor.close()
    return len(NODES)


def main() -> None:
    parser = argparse.ArgumentParser(description="CO2 sensor simulator")
    parser.add_argument("--once", action="store_true",
                        help="Insert a single batch (3 readings) and exit")
    parser.add_argument("--bootstrap", type=int, default=0, metavar="N",
                        help="Insert N historical readings per node (spread over the last 24h) before starting")
    parser.add_argument("--interval", type=int, default=int(os.getenv("SIM_INTERVAL", "15")),
                        help="Seconds between cycles (default: 15)")
    args = parser.parse_args()

    driver = pick_driver()
    conn_str = connection_string(driver)

    print(f"[simulate.py] Connecting to SQL DB...")
    print(f"             driver: {driver}")
    print(f"             server: {os.getenv('SQL_SERVER', 'tcp:sqlserver-co2-yfifyk.database.windows.net,1433')}")
    print(f"             database: {os.getenv('SQL_DATABASE', 'sqldb-co2-telemetry')}")

    try:
        conn = pyodbc.connect(conn_str, autocommit=True, timeout=10)
    except pyodbc.Error as e:
        sys.exit(f"ERROR: could not connect to SQL DB.\n{e}")

    print(f"[simulate.py] Connected. Per-node ranges:")
    for n in NODES:
        print(f"             {n['id']}: CO2 {n['co2']} ppm, dust {n['dust']} µg/m³, "
              f"temp {n['temp']} °C, hum {n['hum']} %")

    if args.bootstrap > 0:
        bootstrap(conn, args.bootstrap)

    if args.once:
        cycle(conn)
        conn.close()
        print("[simulate.py] Done (--once).")
        return

    print(f"[simulate.py] Continuous mode. Press Ctrl+C to stop.")
    print(f"             Each cycle inserts {len(NODES)} readings (one per node) every {args.interval}s.")
    print(f"             Effective per-node rate: ~1 reading / {args.interval * len(NODES)}s.")
    print()
    try:
        cycle_count = 0
        while True:
            cycle(conn)
            cycle_count += 1
            if cycle_count % 10 == 0:
                print(f"             ... {cycle_count} cycles done, {cycle_count * len(NODES)} readings inserted")
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n[simulate.py] Stopping on user interrupt.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
