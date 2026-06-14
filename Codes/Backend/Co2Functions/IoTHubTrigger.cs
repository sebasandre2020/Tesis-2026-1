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
                await InsertIntoDatabaseAsync("Debug_Raw", 0, message);

                try
                {
                    using (JsonDocument document = JsonDocument.Parse(message))
                    {
                        var root = document.RootElement;
                        string nodeId = "";
                        int co2Level = 0;

                        if (root.TryGetProperty("node_id", out JsonElement nodeElement) || root.TryGetProperty("NodeId", out nodeElement))
                        {
                            nodeId = nodeElement.GetString() ?? "";
                        }

                        if (root.TryGetProperty("co2", out JsonElement co2Element) || root.TryGetProperty("Co2Level", out co2Element))
                        {
                            if (co2Element.ValueKind == JsonValueKind.Number) co2Level = co2Element.GetInt32();
                            else if (co2Element.ValueKind == JsonValueKind.String) int.TryParse(co2Element.GetString(), out co2Level);
                        }

                        if (string.IsNullOrEmpty(nodeId))
                        {
                            nodeId = "Unknown_Node";
                        }
                        
                        if (nodeId != "Unknown_Node")
                        {
                            await InsertIntoDatabaseAsync(nodeId, co2Level, message);
                        }
                        
                        _logger.LogInformation($"Successfully processed reading for {nodeId} with CO2: {co2Level}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Failed to parse JSON: {ex.Message}");
                    await InsertIntoDatabaseAsync("Exception", 0, "EXCEPTION PARSING: " + ex.Message + " | RAW: " + message);
                }
            }
        }

        private async Task InsertIntoDatabaseAsync(string nodeId, int co2Level, string rawMessage)
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

                    var text = "INSERT INTO TelemetryReadings (NodeId, Co2Level) VALUES (@NodeId, @Co2Level);";
                    using (SqlCommand cmd = new SqlCommand(text, conn))
                    {
                        cmd.Parameters.AddWithValue("@NodeId", nodeId);
                        cmd.Parameters.AddWithValue("@Co2Level", co2Level);
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
    }
}
