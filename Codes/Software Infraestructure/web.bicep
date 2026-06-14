param location string
param uniqueSuffix string

var staticWebAppName = 'stapp-co2-web-${uniqueSuffix}'

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // The static web app will be connected via GitHub Actions during deployment
    provider: 'GitHub'
    repositoryUrl: 'https://github.com/placeholder/repo' // Placeholder
    branch: 'main'
  }
}

output staticWebAppName string = staticWebApp.name
