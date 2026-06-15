-- ============================================================================
-- V001: Add Sharp GP2Y1010AU0F (Dust) and DHT22 (Temperature, Humidity)
--       columns to TelemetryReadings.
--       Targets pre-V000 deployments that already have the legacy 4-column
--       table (Id, NodeId, Co2Level, Timestamp). On a fresh DB that already
--       ran V000, this script is a no-op.
-- Safe to re-run. Preserves existing rows.
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TelemetryReadings') AND name = 'DustLevel'
)
    ALTER TABLE TelemetryReadings ADD DustLevel INT NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TelemetryReadings') AND name = 'Temperature'
)
    ALTER TABLE TelemetryReadings ADD Temperature DECIMAL(5,2) NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TelemetryReadings') AND name = 'Humidity'
)
    ALTER TABLE TelemetryReadings ADD Humidity DECIMAL(5,2) NULL;
GO
