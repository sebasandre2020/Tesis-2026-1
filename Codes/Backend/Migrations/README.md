# Database Migrations

This directory contains **versioned, idempotent SQL migrations** for the
`sqldb-co2-telemetry` database. They are the single source of truth for
schema changes.

## Why this exists

The Azure Function (`GetSensors.cs`) used to run `ALTER TABLE` on every
cold start, requiring the function's managed identity to have
`db_ddladmin`. That was a poor fit: the function only needs to read and
write telemetry rows, not alter schema. **Now the function is a pure
reader/writer** and all schema changes go through the scripts in this
directory.

## File naming

```
V###__short_description.sql
```

- `V###` — monotonic version number, zero-padded to 3 digits.
- `__` — double underscore separator.
- `short_description` — snake_case, e.g. `add_dust_temperature_humidity`.

Never edit a migration after it has been applied to a production
environment. To change the schema, add a new `V###` file.

## Run order

```
V000  →  V001  →  V002  →  …
```

Each script is idempotent (`IF NOT EXISTS` guards), so re-running a
script is safe. They are NOT reversible — a forward-only migration
strategy. If you need to roll back, write a new migration that undoes
the change.

## How to apply migrations

### Option A — Azure Portal Query Editor (easiest, manual)

1. Azure Portal → **SQL databases** → `sqldb-co2-telemetry`.
2. Left sidebar → **Query editor (preview)**.
3. Sign in with an account that has `db_owner` or `db_ddladmin`
   (e.g. `adminuser` from `local.settings.json`).
4. Paste the contents of `V000__baseline.sql` → **Run**.
5. Repeat for `V001__…sql` and any subsequent migrations.

### Option B — `sqlcmd` (scriptable, CI-friendly)

```bash
sqlcmd -S "sqlserver-co2-yfifyk.database.windows.net,1433" \
       -d sqldb-co2-telemetry \
       -U adminuser \
       -P 'StrongP@ssw0rd2026!' \
       -G \
       -i Migrations/V000__baseline.sql

sqlcmd ... -i Migrations/V001__add_dust_temperature_humidity.sql
```

`-G` switches sqlcmd to AAD authentication; omit it if you're using
SQL auth.

### Option C — CI/CD (recommended for prod)

Add a GitHub Actions job that runs the `sqlcmd` block above before
deploying the function code. Pin the migration version in the job so a
new commit doesn't accidentally apply a migration the env doesn't
expect.

## How to verify

After running, paste this into Query Editor:

```sql
SELECT column_id, name, TYPE_NAME(system_type_id) AS type, is_nullable
FROM sys.columns
WHERE object_id = OBJECT_ID('TelemetryReadings')
ORDER BY column_id;
```

Expected after `V000 + V001` (7 columns):

| column_id | name        | type      | is_nullable |
|-----------|-------------|-----------|-------------|
| 1         | Id          | int       | 0           |
| 2         | NodeId      | nvarchar  | 0           |
| 3         | Co2Level    | int       | 0           |
| 4         | Timestamp   | datetime  | 0           |
| 5         | DustLevel   | int       | 1           |
| 6         | Temperature | decimal   | 1           |
| 7         | Humidity    | decimal   | 1           |

And to confirm the index:

```sql
SELECT name, type_desc
FROM sys.indexes
WHERE object_id = OBJECT_ID('TelemetryReadings');
```

Expected: a `HEAP` (the table itself) + `IX_TelemetryReadings_NodeId_Timestamp`
(CLUSTERED or NONCLUSTERED, doesn't matter for the read path).

## Managed-identity permission model

After this cleanup, the function app's managed identity only needs:

- `db_datareader` — to read `TelemetryReadings` from `GetSensors.cs`
  and `GetReadings.cs`.
- `db_datawriter` — to insert rows from `IoTHubTrigger.cs`.

It does **not** need `db_ddladmin` anymore. If you previously granted
that role (during the manual fix-up), it's safe to revoke it. Run as the
AAD admin in `master`:

```sql
ALTER ROLE db_ddladmin DROP MEMBER [<MI_NAME>];
```

Where `<MI_NAME>` is the System-Assigned Managed Identity of the
function app (find it under Function App → Identity → System assigned).

## Migration history

| Version | Date       | Description                                                  |
|---------|------------|--------------------------------------------------------------|
| V000    | 2026-06-15 | Baseline: TelemetryReadings table + NodeId/Timestamp index.   |
| V001    | 2026-06-15 | Add DustLevel, Temperature, Humidity columns (Sharp + DHT22). |
