@description('Location for all resources.')
param location string = resourceGroup().location

@description('Suffix to ensure unique resource names.')
param uniqueSuffix string = substring(uniqueString(resourceGroup().id), 0, 6)

@description('Administrator login for the SQL Server.')
param sqlAdminLogin string

@description('Administrator password for the SQL Server.')
@secure()
param sqlAdminPassword string

@description('Optional: Azure AD Object ID of the SQL Admin to enable Entra ID Auth')
param sqlAadAdminObjectId string = ''

// Reference built-in roles
var iotHubDataContributorRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4fc6c259-987e-4a07-842e-c321cc9d413f')
var sqlDbContributorRole = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '9b7fa17d-e63e-47b0-bb0a-15c516ac86ec')

// 1. IoT Hub (Free Tier)
module iotHub 'iot.bicep' = {
  name: 'iotHubDeployment'
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
  }
}

// 2. Azure SQL Database (Basic Tier)
module sqlDatabase 'database.bicep' = {
  name: 'sqlDeployment'
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
    adminLogin: sqlAdminLogin
    adminPassword: sqlAdminPassword
    aadAdminObjectId: sqlAadAdminObjectId
  }
}

// 3. Azure Functions (Consumption Plan)
module functions 'functions.bicep' = {
  name: 'functionsDeployment'
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
  }
}

// 4. Azure Container Apps (Consumption Plan)
module api 'api.bicep' = {
  name: 'apiDeployment'
  params: {
    location: location
    uniqueSuffix: uniqueSuffix
  }
}

// 5. Azure Static Web Apps (Free Plan)
module web 'web.bicep' = {
  name: 'webDeployment'
  params: {
    location: 'eastus2' // Static Web Apps is not available in eastus, but eastus2 is allowed by policy
    uniqueSuffix: uniqueSuffix
  }
}

output iotHubName string = iotHub.outputs.iotHubName
output sqlServerName string = sqlDatabase.outputs.sqlServerName
output functionAppName string = functions.outputs.functionAppName
output containerAppName string = api.outputs.containerAppName
output staticWebAppName string = web.outputs.staticWebAppName

// --- Role Assignments ---

var iotHubName = 'iot-co2-${uniqueSuffix}'
var sqlServerName = 'sqlserver-co2-${uniqueSuffix}'

resource iotHubRef 'Microsoft.Devices/IotHubs@2023-06-30' existing = {
  name: iotHubName
}

resource funcIotHubRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(iotHubName, 'funcapp', iotHubDataContributorRole)
  scope: iotHubRef
  properties: {
    roleDefinitionId: iotHubDataContributorRole
    principalId: functions.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource sqlServerRef 'Microsoft.Sql/servers@2023-05-01-preview' existing = {
  name: sqlServerName
}

resource funcSqlRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(sqlServerName, 'funcapp', sqlDbContributorRole)
  scope: sqlServerRef
  properties: {
    roleDefinitionId: sqlDbContributorRole
    principalId: functions.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource apiSqlRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(sqlServerName, 'containerapp', sqlDbContributorRole)
  scope: sqlServerRef
  properties: {
    roleDefinitionId: sqlDbContributorRole
    principalId: api.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}
