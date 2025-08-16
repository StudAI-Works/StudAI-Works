# 🤖 StudAI Works - AI Service (FastAPI + Azure OpenAI)

This AI module powers a two-phase workflow to refine requirements and generate production-ready code using **Azure OpenAI**.
Built with **FastAPI**, it exposes endpoints to start a conversation, refine features, and generate the final project as Markdown with file blocks.

---

## 🧠 What It Does

- Starts a requirements conversation (project manager persona)
- Iteratively refines features with the user
- Generates a complete app spec and code in structured Markdown (Frontend + Backend)

---

## 📁 Folder Structure

```
Ai/
├── main.py             # FastAPI app (AI logic)
├── requirements.txt    # Python dependencies
├── Dockerfile          # Container image for the AI service
└── .env                # Environment variables (local dev)
```

---

## 🚀 Setup Instructions

### 1) Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2) Configure Azure OpenAI
Create `Ai/.env` with:
```
AZURE_OPENAI_KEY=...
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-06-01
AZURE_OPENAI_DEPLOYMENT_NAME=<your-deployment-name>

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:5173
CORS_ALLOW_CREDENTIALS=false
```

Notes for GPT-4.1 deployments on Azure:
- Use your actual Deployment name (not just the model name). If you deployed as `gpt-4.1`, set `AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1`.
- GPT-4.1 often requires the preview API version for chat/completions. If you see 404 Resource Not Found, switch:
	- `AZURE_OPENAI_API_VERSION=2025-01-01-preview`
	- Target URI looks like: `/openai/deployments/<DEPLOYMENT_NAME>/chat/completions?api-version=2025-01-01-preview`

### 3) Run the Server
```bash
uvicorn main:app --reload --host localhost --port 8000
```

---

## 🧪 How to Test
Open in browser:
```
http://localhost:8000/docs
```
Try the flow:
1) POST `/start-conversation` → returns `{ session_id, message }`
2) POST `/refine` with `{ "session_id": "...", "message": "I need a todo app" }` → returns assistant reply
3) POST `/generate` with `{ "session_id": "..." }` → returns Markdown containing sections and file blocks

---

## 🔗 Backend Integration (for Devs)

Recommended: call this service from your Node backend, not the browser.

Basic flow:
1) Start: `POST /start-conversation` → store `session_id` attached to the user/project
2) Refine: `POST /refine` with `{ session_id, message }` → persist both messages
3) Generate: `POST /generate` with `{ session_id }` → parse Markdown and save artifacts

---

## 👤 Maintainers
- AI Team

Feel free to reach out if you need help running or testing this module!
