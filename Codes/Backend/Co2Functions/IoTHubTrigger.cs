using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;

namespace Co2Functions
{
    public class IoTHubTrigger
    {
        private readonly ILogger _logger;

        public IoTHubTrigger(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<IoTHubTrigger>();
        }

        [Function("IoTHubTrigger")]
        public async Task Run(
            [EventHubTrigger("iothub-ehub-iot-co2-yf-58217364-d7aaa12c92", Connection = "EventHubConnection")] string[] messages)
        {
            foreach (var message in messages)
            {
                _logger.LogInformation($"C# IoT Hub trigger function processed a message: {message}");
                await InsertIntoDatabaseAsync("Debug_Raw", 0, null, null, null, message);

                try
                {
                    using (JsonDocument document = JsonDocument.Parse(message))
                    {
                        var root = document.RootElement;
                        string nodeId = "";
                        int co2Level = 0;
                        int? dustLevel = null;
                        decimal? temperature = null;
                        decimal? humidity = null;

                        if (root.TryGetProperty("node_id", out JsonElement nodeElement) || root.TryGetProperty("NodeId", out nodeElement))
                        {
                            nodeId = nodeElement.GetString() ?? "";
                        }

                        if (root.TryGetProperty("co2", out JsonElement co2Element) || root.TryGetProperty("Co2Level", out co2Element))
                        {
                            co2Level = ReadInt(co2Element);
                        }

                        // Nuevos sensores: toleramos ausencia (mensajes legacy) con NULL.
                        if (root.TryGetProperty("dust", out JsonElement dustElement) || root.TryGetProperty("DustLevel", out dustElement))
                        {
                            int parsed = ReadInt(dustElement);
                            dustLevel = parsed >= 0 ? parsed : (int?)null;
                        }

                        if (root.TryGetProperty("temperature", out JsonElement tempElement) || root.TryGetProperty("Temperature", out tempElement))
                        {
                            decimal parsed = ReadDecimal(tempElement);
                            temperature = parsed > -100m && parsed < 100m ? parsed : (decimal?)null;
                        }

                        if (root.TryGetProperty("humidity", out JsonElement humElement) || root.TryGetProperty("Humidity", out humElement))
                        {
                            decimal parsed = ReadDecimal(humElement);
                            humidity = parsed >= 0m && parsed <= 100m ? parsed : (decimal?)null;
                        }

                        if (string.IsNullOrEmpty(nodeId))
                        {
                            nodeId = "Unknown_Node";
                        }

                        if (nodeId != "Unknown_Node")
                        {
                            await InsertIntoDatabaseAsync(nodeId, co2Level, dustLevel, temperature, humidity, message);
                        }

                        _logger.LogInformation($"Successfully processed reading for {nodeId} (co2={co2Level}, dust={dustLevel}, temp={temperature}, hum={humidity})");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Failed to parse JSON: {ex.Message}");
                    await InsertIntoDatabaseAsync("Exception", 0, null, null, null, "EXCEPTION PARSING: " + ex.Message + " | RAW: " + message);
                }
            }
        }

        private static int ReadInt(JsonElement el)
        {
            if (el.ValueKind == JsonValueKind.Number) return el.GetInt32();
            if (el.ValueKind == JsonValueKind.String && int.TryParse(el.GetString(), out var n)) return n;
            return 0;
        }

        private static decimal ReadDecimal(JsonElement el)
        {
            if (el.ValueKind == JsonValueKind.Number) return el.GetDecimal();
            if (el.ValueKind == JsonValueKind.String && decimal.TryParse(el.GetString(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var d)) return d;
            return 0m;
        }

        private async Task InsertIntoDatabaseAsync(string nodeId, int co2Level, int? dustLevel, decimal? temperature, decimal? humidity, string rawMessage)
        {
            var connectionString = Environment.GetEnvironmentVariable("SqlEndpoint");
            if (string.IsNullOrEmpty(connectionString)) return;

            if (connectionString.StartsWith("tcp:"))
            {
                connectionString = $"Server={connectionString};Authentication=Active Directory Default;Database=sqldb-co2-telemetry;";
            }

            try
            {
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    await conn.OpenAsync();

                    // INSERT con columnas nuevas; pasamos DBNull cuando el valor es null.
                    var text = @"INSERT INTO TelemetryReadings (NodeId, Co2Level, DustLevel, Temperature, Humidity)
                                 VALUES (@NodeId, @Co2Level, @DustLevel, @Temperature, @Humidity);";
                    using (SqlCommand cmd = new SqlCommand(text, conn))
                    {
                        cmd.Parameters.AddWithValue("@NodeId", nodeId);
                        cmd.Parameters.AddWithValue("@Co2Level", co2Level);
                        cmd.Parameters.AddWithValue("@DustLevel", (object?)dustLevel ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Temperature", (object?)temperature ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Humidity", (object?)humidity ?? DBNull.Value);
                        await cmd.ExecuteNonQueryAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"SQL Error: {ex.Message}");
            }
        }
    }

    public class TelemetryPayload
    {
        public string node_id { get; set; } = string.Empty;
        public int co2 { get; set; }
        public int? dust { get; set; }
        public decimal? temperature { get; set; }
        public decimal? humidity { get; set; }
    }
}
