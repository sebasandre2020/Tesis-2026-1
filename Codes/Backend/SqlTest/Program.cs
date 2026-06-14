using System;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        string connectionString = "Server=tcp:sqlserver-co2-yfifyk.database.windows.net,1433;Initial Catalog=sqldb-co2-telemetry;User ID=adminuser;Password=StrongP@ssw0rd2026!;Encrypt=True;";
        using (SqlConnection conn = new SqlConnection(connectionString))
        {
            await conn.OpenAsync();
            var sql = "SELECT * FROM DebugLogs ORDER BY Id DESC";
            try 
            {
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        Console.WriteLine($"DEBUG: {reader.GetString(1)}");
                    }
                }
            } catch (Exception e) { Console.WriteLine("No debug logs: " + e.Message); }
        }
    }
}
