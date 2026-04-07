param location string = resourceGroup().location

resource rgFitnessTracker 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-fitness-tracker'
  location: location
}

resource acrFitnessTracker 'Microsoft.ContainerRegistry/registries@2021-06-01-preview' = {
  name: 'acrfitnesstracker'
  location: rgFitnessTracker.location
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: false
  }
}

resource caeFitnessTracker 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-fitness-tracker'
  location: rgFitnessTracker.location
}

resource kvFitnessTracker 'Microsoft.KeyVault/vaults@2021-11-01-preview' = {
  name: 'kvfitnesstracker'
  location: rgFitnessTracker.location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'Standard'
    }
    accessPolicies: []
  }
}

resource idFitnessTracker 'Microsoft.ManagedIdentity/userAssignedIdentities@2018-11-30' = {
  name: 'id-fitness-tracker'
  location: rgFitnessTracker.location
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2020-08-01' = {
  name: 'loganalyticsworkspace'
  location: rgFitnessTracker.location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
  }
}

resource caCaddy 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-caddy'
  location: rgFitnessTracker.location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: caeFitnessTracker.id
    configuration: {
      secrets: []
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
          image: 'caddy:latest'
          name: 'caddy'
          ports: [
            {
              containerPort: 80
            }
          ]
          volumeMounts: []
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

resource caFrontend 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-frontend'
  location: rgFitnessTracker.location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: caeFitnessTracker.id
    configuration: {
      secrets: []
      ingress: {
        external: false
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
          image: 'your-acr-name.azurecr.io/frontend:latest'
          name: 'frontend'
          ports: [
            {
              containerPort: 3000
            }
          ]
          volumeMounts: []
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

resource caApi 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-api'
  location: rgFitnessTracker.location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${idFitnessTracker.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: caeFitnessTracker.id
    configuration: {
      secrets: []
      ingress: {
        external: false
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
          image: 'your-acr-name.azurecr.io/api:latest'
          name: 'api'
          ports: [
            {
              containerPort: 8000
            }
          ]
          volumeMounts: []
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

resource kvAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2021-11-01-preview' = {
  name: '${kvFitnessTracker.name}/add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: idFitnessTracker.properties.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
    ]
  }
}

resource kvSecretNotionApiKey 'Microsoft.KeyVault/vaults/secrets@2021-11-01-preview' = {
  name: '${kvFitnessTracker.name}/NOTION_API_KEY'
  properties: {
    value: 'your-notion-api-key'
  }
}
