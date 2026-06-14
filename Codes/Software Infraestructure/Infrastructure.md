# Azure Infrastructure Guide

Welcome to your Azure Infrastructure guide! Since you have just created your Azure account, this document will walk you through the entire process of setting up your cloud environment for the IoT CO₂ Level Monitoring System using **Infrastructure as Code (IaC)** with **Azure Bicep**.

## 1. Prerequisites

Before deploying the templates, you need to configure your local environment to interact with your new Azure account.

1. **Install Azure CLI**: 
   - Download and install the Azure CLI from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).
   - This tool allows you to run commands against your Azure account from your terminal.

2. **Install Bicep**:
   - Bicep is already included in the latest versions of Azure CLI. You can verify it by running:
     ```bash
     az bicep version
     ```

3. **Install VS Code Extensions** (Optional but recommended):
   - Search for and install the **Bicep** extension in Visual Studio Code. It provides syntax highlighting and validation for the IaC files.

## 2. Login and Initial Setup

1. **Open your terminal** (PowerShell or Command Prompt).
2. **Login to Azure**:
   ```bash
   az login
   ```
   *This will open a browser window asking you to log in with your Azure credentials.*

3. **Set your subscription**:
   If you have multiple subscriptions (e.g., Free Trial, Pay-As-You-Go), make sure you select the correct one:
   ```bash
   az account list --output table
   az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
   ```

4. **Create a Resource Group**:
   A Resource Group is a logical container where all your project resources will live.
   ```bash
   az group create --name "rg-co2-monitoring-v2" --location "brazilsouth"
   ```
   *(You can change `eastus` to a region closer to you, e.g., `brazilsouth` or `eastus2`)*

## 3. Deployment using Bicep

The infrastructure is defined in modular Bicep files inside this folder. We have one `main.bicep` file that orchestrates the deployment of all other templates (`iot.bicep`, `database.bicep`, `functions.bicep`, `api.bicep`, `web.bicep`).

### Deploy the entire infrastructure
Run the following command in the terminal from the folder where your `.bicep` files are located:

```bash
az deployment group create \
  --resource-group rg-co2-monitoring-v2 \
  --template-file main.bicep \
  --parameters sqlAdminLogin="adminuser" sqlAdminPassword="StrongP@ssw0rd2026!"
```

## 4. Understanding the Resources Created

Once the deployment finishes (it might take 5-10 minutes), you will have the following resources in your Azure Portal, optimized for a **$0 Budget** as specified in your architecture:

* **Azure IoT Hub (Free Tier)**: Receives LoRa telemetry. Only 1 Free Tier IoT Hub is allowed per subscription.
* **Azure SQL Server & Database (Basic)**: Stores your historical data. *(Note: Basic tier costs around ~$5/month. If you want absolutely $0, you might need to use Azure Cosmos DB Free Tier, but the architecture specifies Azure SQL Basic).*
* **Azure Storage Account & App Service Plan (Consumption Y1)**: Required for the Azure Function.
* **Azure Function App (Consumption)**: Processes messages from the IoT Hub.
* **Azure Container Apps Environment & App (Consumption)**: Hosts your backend API. Scales to zero when not in use.
* **Azure Static Web Apps (Free Plan)**: Hosts your React.js frontend.

## 5. Next Steps Post-Deployment

Now that your infrastructure is deployed with **Managed Identities** and **RBAC**, follow these steps to configure your environment:

### 1. Configure IoT Hub Gateway Identity
You need to create a device identity in Azure IoT Hub for your ESP32 Gateway to get its connection string.
Run the following commands in Azure CLI (replace `<YOUR_IOT_HUB_NAME>`):

```bash
# 1. Create the device identity
az iot hub device-identity create --hub-name "<YOUR_IOT_HUB_NAME>" --device-id "esp32-gateway"

# 2. Retrieve the connection string
az iot hub device-identity connection-string show --hub-name "<YOUR_IOT_HUB_NAME>" --device-id "esp32-gateway"
```
Copy the returned `connectionString` and place it in the `secrets.h` file of your ESP32 Gateway firmware.

### 2. Configure Azure SQL Database Admin (Optional but Recommended)
For your Managed Identities to access the SQL Database, you should set an Azure Active Directory (Entra ID) administrator.
```bash
# Replace with your actual SQL server name and your Azure AD user email or object ID
az sql server ad-admin create --resource-group "rg-co2-monitoring-v2" --server-name "<YOUR_SQL_SERVER_NAME>" --display-name "<YOUR_EMAIL>" --object-id "<YOUR_OBJECT_ID>"
```

### 3. Configure Azure Functions Environment Variables
Since we configured the infrastructure to use **System-Assigned Managed Identity**, you do not need connection strings! Instead, you provide the fully qualified endpoints, and Azure will use RBAC behind the scenes.

Run the following command to configure your Function App (replace placeholders):
```bash
az functionapp config appsettings set \
  --name "<YOUR_FUNCTION_APP_NAME>" \
  --resource-group "rg-co2-monitoring-v2" \
  --settings "EventHubConnection__fullyQualifiedNamespace=<YOUR_IOT_HUB_NAME>.servicebus.windows.net" \
             "SqlEndpoint=tcp:<YOUR_SQL_SERVER_NAME>.database.windows.net,1433"
```
*Note: In your .NET Core code, ensure your SQL connection string specifies `Authentication=Active Directory Default;`.*

### 4. Deploy Code
- Set up GitHub Actions to build and push your Docker image to GitHub Container Registry (GHCR).
- Configure your Container App to pull the new image.
- Use GitHub Actions to deploy your React app to the Azure Static Web App.
