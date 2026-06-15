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
        // Capa única: si los modificas aquí, replica en
        // Codes/Frontend/src/utils/formatters.ts.
        private const int CO2Elevado = 400;
        private const int CO2Critico = 500;
        private const int DustElevado = 35;
        private const int DustCritico = 55;
        private const decimal TempLowCritico = 16m;
        private const decimal TempHighCritico = 30m;
        private const decimal TempLowElevado = 18m;
        private const decimal TempHighElevado = 26m;
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

                    // Lectura pura: la tabla es creada/migrada por
                    // Codes/Backend/Migrations/V000__baseline.sql y
                    // V001__add_dust_temperature_humidity.sql.
                    // Esta function ya NO hace DDL.
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
                // Devolvemos 500 para que el error sea visible; ya no swallow
                // errores de DDL porque esta function no hace DDL.
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteStringAsync(JsonSerializer.Serialize(new { error = ex.Message }));
                return errorResponse;
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/json");

            var jsonString = JsonSerializer.Serialize(sensors, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            await response.WriteStringAsync(jsonString);

            return response;
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
