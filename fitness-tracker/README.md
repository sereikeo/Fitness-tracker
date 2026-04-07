# Fitness Tracker Web App

## Local Development Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo/fitness-tracker.git
   cd fitness-tracker
   ```

2. Create a `.env` file in the root directory with your Notion API key:
   ```
   NOTION_API_KEY=your-notion-api-key
   ```

3. Start the local development environment using Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Access the application at [http://localhost:80](http://localhost:80).

## Azure Deployment Steps

1. Ensure you have the Azure CLI installed and logged in.
2. Deploy the infrastructure using Bicep:
   ```bash
   az deployment sub create --template-file infra/main.bicep --location <your-location>
   ```

3. Configure GitHub Actions with the necessary secrets (`AZURE_CREDENTIALS`, `NOTION_API_KEY`).

4. Push changes to the main branch to trigger the CI/CD pipeline.
