# Azure Web App Deployment Guide

## Prerequisites
1. Azure subscription
2. Azure CLI installed
3. GitHub account (for automated deployment)

## Step 1: Prepare Your Application

### Environment Variables
Set these in Azure Web App Configuration:
- `NODE_ENV=production`
- `SUPABASE_URL=your_supabase_url`
- `SUPABASE_ANON_KEY=your_supabase_key`
- `FASTAPI_URL=your_fastapi_service_url`
- `PORT=80` (Azure will set this automatically)

### Build Process
The deployment will:
1. Build the React frontend
2. Copy frontend build to backend
3. Build TypeScript backend
4. Deploy to Azure

## Step 2: Create Azure Web App

### Using Azure CLI:
```bash
# Create resource group
az group create --name studai-rg --location "East US"

# Create App Service plan
az appservice plan create --name studai-plan --resource-group studai-rg --sku B1 --is-linux

# Create Web App
az webapp create --resource-group studai-rg --plan studai-plan --name your-studai-app --runtime "NODE|18-lts"

# Configure deployment from GitHub
az webapp deployment source config --name your-studai-app --resource-group studai-rg --repo-url https://github.com/StudAI-Works/StudAI-Works --branch main --manual-integration
```

### Using Azure Portal:
1. Create new Web App
2. Choose Node.js 18 runtime
3. Set up GitHub Actions deployment

## Step 3: Configure Environment Variables

In Azure Portal > Configuration > Application Settings:
```
NODE_ENV=production
SUPABASE_URL=your_actual_url
SUPABASE_ANON_KEY=your_actual_key
FASTAPI_URL=your_fastapi_url
REQUIRE_AUTH_GENERATE=true
REQUIRE_AUTH_PROJECTS=true
```

## Step 4: Deploy AI Service (FastAPI)

### Option A: Azure Container Apps
```bash
# Build and push Docker image
docker build -t studai-ai ./Ai
docker tag studai-ai your-registry.azurecr.io/studai-ai
docker push your-registry.azurecr.io/studai-ai

# Deploy to Container Apps
az containerapp create \
  --name studai-ai \
  --resource-group studai-rg \
  --environment studai-env \
  --image your-registry.azurecr.io/studai-ai \
  --target-port 8000
```

### Option B: Separate Web App for AI
```bash
az webapp create \
  --resource-group studai-rg \
  --plan studai-plan \
  --name studai-ai-app \
  --runtime "PYTHON|3.9"
```

## Step 5: Update Configuration

Update `FASTAPI_URL` in your main app to point to the AI service:
- Container Apps: `https://studai-ai.app-region.azurecontainerapps.io`
- Web App: `https://studai-ai-app.azurewebsites.net`

## Step 6: Test Deployment

1. Push changes to main branch
2. GitHub Actions will build and deploy
3. Access your app at `https://your-studai-app.azurewebsites.net`

## Troubleshooting

### Common Issues:
1. **Build fails**: Check Node.js version (should be 18.x)
2. **App won't start**: Check logs in Azure Portal > Log stream
3. **Static files not served**: Ensure frontend is built and copied correctly
4. **API errors**: Verify environment variables are set correctly
5. **CORS issues**: Update CORS configuration if needed

### Logs:
```bash
# View logs via CLI
az webapp log tail --name your-studai-app --resource-group studai-rg
```

## Cost Optimization

For production:
- Use **B1 Basic** plan ($12.41/month)
- Consider **S1 Standard** for better performance
- Use **Free tier** for testing (limited hours)

## Security Considerations

1. Set up custom domain with SSL
2. Configure authentication if needed
3. Use Azure Key Vault for sensitive data
4. Enable Application Insights for monitoring
