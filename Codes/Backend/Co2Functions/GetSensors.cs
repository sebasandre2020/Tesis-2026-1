using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;
using System.Net;

namespace Co2Functions
{
    public class GetSensors
    {
        private readonly ILogger _logger;

        // Umbrales alineados con el frontend (getCO2Status / getMetricStatus).
        private const int CO2Elevado = 400;
        private const int CO2Critico = 500;
        // PM2.5 µg/m³ (OMS 2021): 0-35 normal, 35-55 elevado, >55 crítico
        private const int DustElevado = 35;
        private const int DustCritico = 55;
        // Temperatura °C (confort): 18-26 normal, fuera crítico si >30 o <16
        private const decimal TempLowCritico = 16m;
        private const decimal TempHighCritico = 30m;
        private const decimal TempLowElevado = 18m;
        private const decimal TempHighElevado = 26m;
        // Humedad %: 30-60 normal, fuera crítico si >75 o <20
        private const decimal HumLowCritico = 20m;
        private const decimal HumHighCritico = 75m;
        private const decimal HumLowElevado = 30m;
        private const decimal HumHighElevado = 60m;

        public GetSensors(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<GetSensors>();
        }

        [Function("GetSensors")]
        public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "sensors")] HttpRequestData req)
        {
            _logger.LogInformation("Processing GetSensors request.");

            var sensors = new List<object>();

            var connectionString = Environment.GetEnvironmentVariable("SqlEndpoint");
            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogError("SqlEndpoint environment variable is missing.");
                return req.CreateResponse(HttpStatusCode.InternalServerError);
            }

            if (connectionString.StartsWith("tcp:"))
            {
                connectionString = $"Server={connectionString};Authentication=Active Directory Default;Database=sqldb-co2-telemetry;";
            }

            try
            {
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    await conn.OpenAsync();

                    // 1. Crear tabla si no existe (seed legacy)
                    var initDbSql = @"
                        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TelemetryReadings' and xtype='U')
                        BEGIN
                            CREATE TABLE TelemetryReadings (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                NodeId NVARCHAR(50) NOT NULL,
                                Co2Level INT NOT NULL,
                                Timestamp DATETIME DEFAULT GETDATE()
                            );

                            INSERT INTO TelemetryReadings (NodeId, Co2Level) VALUES
                            ('Aula 101', 450),
                            ('Laboratorio', 500),
                            ('Biblioteca', 420);
                        END
                    ";
                    using (SqlCommand initCmd = new SqlCommand(initDbSql, conn))
                    {
                        await initCmd.ExecuteNonQueryAsync();
                    }

                    // 2. Migración idempotente: añade las nuevas columnas si la tabla ya existía.
                    //    Esto es seguro de ejecutar en cada arranque; sin pérdida de datos.
                    await EnsureColumnAsync(conn, "TelemetryReadings", "DustLevel", "INT NULL");
                    await EnsureColumnAsync(conn, "TelemetryReadings", "Temperature", "DECIMAL(5,2) NULL");
                    await EnsureColumnAsync(conn, "TelemetryReadings", "Humidity", "DECIMAL(5,2) NULL");

                    // 3. Última lectura por nodo (incluyendo las métricas nuevas).
                    var text = @"
                        WITH RankedReadings AS (
                            SELECT
                                NodeId,
                                Co2Level,
                                DustLevel,
                                Temperature,
                                Humidity,
                                Timestamp,
                                ROW_NUMBER() OVER (PARTITION BY NodeId ORDER BY Timestamp DESC) as rn
                            FROM TelemetryReadings
                        )
                        SELECT NodeId, Co2Level, DustLevel, Temperature, Humidity, Timestamp
                        FROM RankedReadings WHERE rn = 1;";

                    using (SqlCommand cmd = new SqlCommand(text, conn))
                    {
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var nodeId = reader.GetString(0);
                                if (!nodeId.StartsWith("Node_")) continue; // Skip Debug_Raw, Exception, etc.

                                int? co2Level = reader.IsDBNull(1) ? (int?)null : reader.GetInt32(1);
                                int? dustLevel = reader.IsDBNull(2) ? (int?)null : reader.GetInt32(2);
                                decimal? temperature = reader.IsDBNull(3) ? (decimal?)null : reader.GetDecimal(3);
                                decimal? humidity = reader.IsDBNull(4) ? (decimal?)null : reader.GetDecimal(4);
                                var timestamp = reader.GetDateTime(5);

                                string name = nodeId;
                                string location = "Desconocido";
                                if (nodeId == "Node_01") { name = "Aula 101"; location = "Piso 1"; }
                                else if (nodeId == "Node_02") { name = "Laboratorio"; location = "Piso 2"; }
                                else if (nodeId == "Node_03") { name = "Biblioteca"; location = "Piso 1"; }

                                sensors.Add(new
                                {
                                    id = nodeId.GetHashCode(),
                                    nodeId = nodeId,
                                    name = name,
                                    location = location,
                                    currentLevel = co2Level ?? 0,
                                    status = ComputeCO2Status(co2Level),
                                    dustLevel = dustLevel,
                                    dustStatus = ComputeDustStatus(dustLevel),
                                    temperature = temperature,
                                    temperatureStatus = ComputeTempStatus(temperature),
                                    humidity = humidity,
                                    humidityStatus = ComputeHumidityStatus(humidity),
                                    lastUpdate = timestamp.ToString("hh:mm tt")
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error querying SQL Database: {ex.Message}");
                // No datos fake: el frontend ya no debe depender de valores dummy.
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/json");

            var jsonString = JsonSerializer.Serialize(sensors, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            await response.WriteStringAsync(jsonString);

            return response;
        }

        private async Task EnsureColumnAsync(SqlConnection conn, string table, string column, string definition)
        {
            var sql = $@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(@Table) AND name = @Column
                )
                BEGIN
                    EXEC('ALTER TABLE ' + @Table + ' ADD ' + @Column + ' ' + @Definition);
                END";
            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@Table", table);
                cmd.Parameters.AddWithValue("@Column", column);
                cmd.Parameters.AddWithValue("@Definition", definition);
                await cmd.ExecuteNonQueryAsync();
            }
        }

        private static string ComputeCO2Status(int? ppm)
        {
            if (!ppm.HasValue) return "Normal";
            if (ppm.Value > CO2Critico) return "Crítico";
            if (ppm.Value > CO2Elevado) return "Elevado";
            return "Normal";
        }

        private static string ComputeDustStatus(int? ugm3)
        {
            if (!ugm3.HasValue) return "Normal";
            if (ugm3.Value > DustCritico) return "Crítico";
            if (ugm3.Value > DustElevado) return "Elevado";
            return "Normal";
        }

        private static string ComputeTempStatus(decimal? c)
        {
            if (!c.HasValue) return "Normal";
            if (c.Value < TempLowCritico || c.Value > TempHighCritico) return "Crítico";
            if (c.Value < TempLowElevado || c.Value > TempHighElevado) return "Elevado";
            return "Normal";
        }

        private static string ComputeHumidityStatus(decimal? pct)
        {
            if (!pct.HasValue) return "Normal";
            if (pct.Value < HumLowCritico || pct.Value > HumHighCritico) return "Crítico";
            if (pct.Value < HumLowElevado || pct.Value > HumHighElevado) return "Elevado";
            return "Normal";
        }
    }
}
