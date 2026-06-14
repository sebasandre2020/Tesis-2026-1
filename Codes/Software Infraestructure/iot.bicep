param location string
param uniqueSuffix string

var iotHubName = 'iot-co2-${uniqueSuffix}'

resource iotHub 'Microsoft.Devices/IotHubs@2023-06-30' = {
  name: iotHubName
  location: location
  sku: {
    name: 'F1' // Free tier
    capacity: 1
  }
  properties: {
    // Basic settings for IoT Hub
    features: 'None'
    routing: {
      fallbackRoute: {
        name: '$fallback'
        source: 'DeviceMessages'
        condition: 'true'
        endpointNames: [
          'events'
        ]
        isEnabled: true
      }
    }
  }
}

output iotHubName string = iotHub.name
