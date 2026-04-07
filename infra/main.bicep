param location string = resourceGroup().location

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2021-12-01-preview' = {
  name: 'log-analytics-workspace'
  location: location
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: 'acr-fitnesstracker'
  location: location
  sku: {
    name: 'Standard'
  }
}

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01-preview' = {
  name: 'cae-fitness-tracker'
  location: location
}

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-fitness-tracker'
  location: location
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-fitness-tracker'
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'Standard'
    }
    accessPolicies: [
      {
        objectId: managedIdentity.properties.principalId
        permissions: {
          secrets: [ 'get', 'list' ]
        }
      }
    ]
  }
}

resource notionApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'NOTION_API_KEY'
  properties: {
    value: 'your-notion-api-key-placeholder'
  }
}

resource caddyContainerApp 'Microsoft.App/containerApps@2023-05-01-preview' = {
  name: 'ca-caddy'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      secrets: [
        {
          name: 'NOTION_API_KEY'
          value: notionApiKeySecret.properties.value
        }
      ]
      ingress: {
        external: true
        targetPort: 80
        traffic: [
          {
            revisionWeight: 100
          }
        ]
      }
    }
    template: {
      containers: [
        {
          name: 'caddy'
          image: 'caddy:latest'
          env: [
            {
              name: 'NOTION_API_KEY'
              secretRef: 'NOTION_API_KEY'
            }
          ]
        }
      ]
    }
  }
}

resource frontendContainerApp 'Microsoft.App/containerApps@2023-05-01-preview' = {
  name: 'ca-frontend'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      secrets: [
        {
          name: 'NOTION_API_KEY'
          value: notionApiKeySecret.properties.value
        }
      ]
      ingress: {
        external: true
        targetPort: 3000
        traffic: [
          {
            revisionWeight: 100
          }
        ]
      }
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: '${acr.loginServer}/fitness-tracker-frontend:latest'
          env: [
            {
              name: 'NOTION_API_KEY'
              secretRef: 'NOTION_API_KEY'
            }
          ]
        }
      ]
    }
  }
}

resource apiContainerApp 'Microsoft.App/containerApps@2023-05-01-preview' = {
  name: 'ca-api'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      secrets: [
        {
          name: 'NOTION_API_KEY'
          value: notionApiKeySecret.properties.value
        }
      ]
      ingress: {
        external: true
        targetPort: 8000
        traffic: [
          {
            revisionWeight: 100
          }
        ]
      }
    }
    template: {
      containers: [
        {
          name: 'api'
          image: '${acr.loginServer}/fitness-tracker-api:latest'
          env: [
            {
              name: 'NOTION_API_KEY'
              secretRef: 'NOTION_API_KEY'
            }
          ]
        }
      ]
    }
  }
}
