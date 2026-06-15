-- ============================================================================
-- V000: Baseline schema for the CO2 monitoring system.
-- Idempotent. Safe to run on a fresh DB or a DB that already has the table.
-- Run order: V000 FIRST, then V001, V002, ...
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TelemetryReadings' and xtype='U')
BEGIN
    CREATE TABLE TelemetryReadings (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        NodeId       NVARCHAR(50)   NOT NULL,
        Co2Level     INT            NOT NULL,
        DustLevel    INT            NULL,
        Temperature  DECIMAL(5,2)   NULL,
        Humidity     DECIMAL(5,2)   NULL,
        Timestamp    DATETIME       NOT NULL DEFAULT GETDATE()
    );

    -- Hot path index: GetReadings.cs filters by NodeId and orders by Timestamp.
    -- Without this index, every dashboard load scans the entire table.
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_TelemetryReadings_NodeId_Timestamp')
    BEGIN
        CREATE INDEX IX_TelemetryReadings_NodeId_Timestamp
            ON TelemetryReadings (NodeId, Timestamp DESC);
    END
END
GO
