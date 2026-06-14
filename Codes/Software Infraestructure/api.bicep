param location string
param uniqueSuffix string

var logAnalyticsWorkspaceName = 'log-co2-${uniqueSuffix}'
var containerAppEnvName = 'cae-co2-${uniqueSuffix}'
var containerAppName = 'ca-co2-api-${uniqueSuffix}'

// 1. Log Analytics Workspace (Required for Container Apps Env)
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
  }
}

// 2. Container Apps Environment
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// 3. Container App (Backend API)
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          name: 'co2-backend-api'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' // Placeholder, replace with GHCR image
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0 // Scale to Zero as requested
        maxReplicas: 5
      }
    }
  }
}

output containerAppName string = containerApp.name
output principalId string = containerApp.identity.principalId
