# 🤖 StudAI Works - AI Service (FastAPI + Gemini)

This AI module takes plain user input and returns fully working code using **Google Gemini 2.5**.
Built using **FastAPI**, this service can be integrated into the backend via a simple POST call.

---

## 🧠 What It Does

- Accepts prompts like: `"I need a student management system website"`
- Enhances the prompt
- Sends it to Gemini
- Returns detailed project code (Frontend + Backend)

---

## 📁 Folder Structure

```
ai/
├── main.py             # FastAPI app (AI logic)
├── requirements.txt    # Python dependencies
├── .env.example        # Template for secrets
└── .gitignore          # Ignores .env & cache files
```

---

## 🚀 Setup Instructions

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure your Gemini API Key
```bash
cp .env.example .env
# Then edit .env and add your Gemini API key
```

### 3. Run the Server
```bash
uvicorn main:app --reload --host localhost --port 8000
```

---

## 🧪 How to Test
Open in browser:
```
http://localhost:8000/docs
```
Try the `/generate` endpoint with a sample input:
```json
{
  "userInput": "Create a todo list app"
}
```

It will return:
- `generatedPrompt`: The refined prompt sent to Gemini
- `generatedCode`: The code returned by Gemini

---

## 🔗 Backend Integration (for Devs)

Update `userprompthandle.ts` in backend to:
```ts
const response = await fetch("http://localhost:8000/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userInput })
});

const result = await response.json();
res.send(result);
```

---

## 👤 Maintainer
- Hamsika S (AI Team)

Feel free to reach out if you need help running or testing this module!
