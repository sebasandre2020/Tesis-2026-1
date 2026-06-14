param location string
param uniqueSuffix string
param adminLogin string
@secure()
param adminPassword string
param aadAdminObjectId string = ''

var sqlServerName = 'sqlserver-co2-${uniqueSuffix}'
var databaseName = 'sqldb-co2-telemetry'

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: adminLogin
    administratorLoginPassword: adminPassword
    administrators: empty(aadAdminObjectId) ? null : {
      administratorType: 'ActiveDirectory'
      principalType: 'User'
      login: 'AADAdmin'
      sid: aadAdminObjectId
      tenantId: subscription().tenantId
    }
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: 'Basic' // Basic DTU tier
    tier: 'Basic'
    capacity: 5
  }
}

// Allow Azure services and resources to access this server
resource firewallRule 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output sqlServerName string = sqlServer.name
output databaseName string = sqlDatabase.name
