-- T-SQL Script to initialize the TelemetryReadings table
-- Run this in the Azure SQL Database Query Editor

CREATE TABLE TelemetryReadings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NodeId NVARCHAR(50) NOT NULL,
    Co2Level INT NOT NULL,
    Timestamp DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Optional: Create an index on Timestamp to speed up historical queries
CREATE INDEX IX_TelemetryReadings_Timestamp ON TelemetryReadings(Timestamp DESC);
