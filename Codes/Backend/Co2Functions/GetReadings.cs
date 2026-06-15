using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;
using System.Net;
using System.Web;

namespace Co2Functions
{
    public class GetReadings
    {
        private readonly ILogger _logger;

        public GetReadings(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<GetReadings>();
        }

        [Function("GetReadings")]
        public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "readings")] HttpRequestData req)
        {
            _logger.LogInformation("Processing GetReadings request.");

            var query = HttpUtility.ParseQueryString(req.Url.Query);
            string rangeStr = query["range"] ?? "24h";
            int hours = 24;
            bool isJune = false;

            if (rangeStr == "1h") hours = 1;
            else if (rangeStr == "3h") hours = 3;
            else if (rangeStr == "12h") hours = 12;
            else if (rangeStr == "24h") hours = 24;
            else if (rangeStr == "7d") hours = 168;
            else if (rangeStr == "june") isJune = true;

            var readings = new List<object>();

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

                    var text = isJune
                        ? @"
                            SELECT NodeId, Co2Level, DustLevel, Temperature, Humidity, Timestamp
                            FROM TelemetryReadings
                            WHERE Timestamp >= '2026-06-01T00:00:00Z' AND Timestamp < '2026-07-01T00:00:00Z'
                            ORDER BY Timestamp ASC;
                        "
                        : @"
                            SELECT NodeId, Co2Level, DustLevel, Temperature, Humidity, Timestamp
                            FROM TelemetryReadings
                            WHERE Timestamp >= DATEADD(hour, -@Hours, GETUTCDATE())
                            ORDER BY Timestamp ASC;
                        ";

                    using (SqlCommand cmd = new SqlCommand(text, conn))
                    {
                        cmd.Parameters.AddWithValue("@Hours", hours);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var nodeId = reader.GetString(0);
                                if (!nodeId.StartsWith("Node_")) continue; // Skip Debug_Raw, Exception, etc.

                                string name = nodeId;
                                if (nodeId == "Node_01") name = "Aula 101";
                                else if (nodeId == "Node_02") name = "Laboratorio";
                                else if (nodeId == "Node_03") name = "Biblioteca";

                                var co2Level = reader.IsDBNull(1) ? (int?)null : reader.GetInt32(1);
                                int? dustLevel = reader.IsDBNull(2) ? (int?)null : reader.GetInt32(2);
                                decimal? temperature = reader.IsDBNull(3) ? (decimal?)null : reader.GetDecimal(3);
                                decimal? humidity = reader.IsDBNull(4) ? (decimal?)null : reader.GetDecimal(4);
                                var timestamp = reader.GetDateTime(5);

                                readings.Add(new
                                {
                                    nodeId = name,
                                    co2 = co2Level,
                                    dust = dustLevel,
                                    temperature = temperature,
                                    humidity = humidity,
                                    // Specify 'Z' so the frontend knows it's UTC
                                    timestamp = DateTime.SpecifyKind(timestamp, DateTimeKind.Utc).ToString("o")
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error querying SQL Database: {ex.Message}");
                // Return empty array on failure (frontend already handles empty)
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/json");

            var jsonString = JsonSerializer.Serialize(readings, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            await response.WriteStringAsync(jsonString);

            return response;
        }
    }
}
