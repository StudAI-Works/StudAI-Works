# Backend Setup

## Environment Variables

Before running the application, you need to set up your environment variables:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the actual values in `.env`:
   - `FASTAPI_HOST`: Your FastAPI host address
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service key
   - `AZURE_OPENAI_KEY`: Your Azure OpenAI API key
   - `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint
   - `AZURE_OPENAI_DEPLOYMENT_NAME`: Your Azure OpenAI deployment name
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GOOGLE_API_KEY`: Your Google API key

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

**Important**: Never commit the `.env` file with actual secrets to the repository. The `.env` file is in `.gitignore` to prevent accidental commits.
