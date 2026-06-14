# End-to-End Application Deployment Guide

Congratulations! The entire IoT CO₂ Monitoring System is now live in the cloud. We have successfully deployed the backend, database, and frontend to Azure.

## 🚀 Application URLs

- **Frontend (Azure Static Web Apps)**: [https://orange-pond-0bd85900f.7.azurestaticapps.net](https://orange-pond-0bd85900f.7.azurestaticapps.net)
- **Backend API (Azure Container Apps)**: [https://ca-co2-api-yfifyk.purplefield-0f4b041e.brazilsouth.azurecontainerapps.io/api/sensors](https://ca-co2-api-yfifyk.purplefield-0f4b041e.brazilsouth.azurecontainerapps.io/api/sensors)

## 📋 What was deployed?

1. **Azure SQL Database & IoT Hub**: We successfully deployed the Bicep templates found in `Software Infraestructure`. 
2. **Backend**: An HTTP Trigger (`GetSensors.cs`) was added to the `.NET` Azure Functions project to fetch the latest telemetry data from the SQL Database. It was containerized and pushed to Azure Container Apps. Upon first request, the database was automatically seeded with dummy nodes (Aula 101, Laboratorio, Biblioteca) so the frontend could immediately render data!
3. **Frontend**: The React application was built pointing to the new Backend endpoint, and deployed to Azure Static Web Apps using the `@azure/static-web-apps-cli`.

## 🛠 Next Steps

- **Visit the Frontend URL** above to see your live React dashboard!
- The IoT Hub is ready to accept telemetry from your ESP32 Gateway.
- If you intend to use GitHub Actions in the future (as planned initially), the workflows are ready in `.github/workflows`. You simply need to push the code to a GitHub repository and add the following repository secrets:
  - `AZURE_STATIC_WEB_APPS_API_TOKEN` (for the frontend deployment)
  - `AZURE_CREDENTIALS` (for the backend deployment)
