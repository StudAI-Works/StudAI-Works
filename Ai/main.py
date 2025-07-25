# file: src/fastapi/main.py
import os
import copy
import asyncio
import logging
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI, RateLimitError
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type

# --- Setup & Configuration ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="StudAI Works - Conversational AI Coder",
    description="A conversational service to first refine features and then generate code.",
    version="5.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Client Setup ---
client = AsyncAzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
)
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

# --- In-Memory Session Storage ---
CONVERSATION_SESSIONS = {}

# CONVERSATION_REFINEMENT: Dict[str, List[Dict[str, str]]] = {}
# CONVERSATION_GENERATION: Dict[str, List[Dict[str, str]]] = {}

# --- Pydantic Models ---
class ConversationRequest(BaseModel):
    session_id: str
    message: str

class ConversationResponse(BaseModel):
    reply: str
    session_id: str

class GenerateRequest(BaseModel):
    session_id: str

class StartResponse(BaseModel):
    session_id: str
    message: str

# --- System Prompts ---
REFINEMENT_SYSTEM_PROMPT = """
You are a friendly and brilliant project manager. Your goal is to talk to the user and help them clarify the features for a web application they want to build. Ask clarifying questions, suggest features, and help them create a solid plan. Keep your responses concise and guide the conversation forward. Once you feel the plan is clear, confirm with the user if they are ready to generate the code.
"""

CODE_GEN_SYSTEM_PROMPT = """
You are an expert Full-Stack Developer with 25+ years of experience. Your task is to generate a complete, production-grade, and well-documented web application based on the provided conversation history.

The user and a project manager have already discussed the features. Your job is to read their entire conversation and build the application exactly as specified.

### 🔧 Tech Stack
- Frontend: React (TypeScript) + Tailwind CSS + Vite
- Backend: Python FastAPI + SQLAlchemy + PostgreSQL
- State Management: Zustand

### 📂 Output Format (Strict markdown Format)
Follow this exact format for parsing. For each step, generate ONLY the content for that step.
Use markdown headers like:
```
#### frontend/src/App.tsx
```typescript
// code here
```

#### backend/src/server.ts
```typescript
// code here
```

---

1.  **Project Overview**: A high-level description based on the conversation.
2.  **Folder Structure**: A markdown tree.
3.  **Code Files**: All frontend and backend code. Use markdown headers for each file path (e.g., `#### path/to/file.ext`).
4.  **README.md**: Complete setup and run instructions.
"""

CODE_GEN_PLAN = {
    "Project Overview": "First, provide the 'Project Overview'. Summarize the app's features based on the entire conversation history.",
    "Folder Structure": "Next, generate the complete 'Folder Structure' in a markdown tree format.",
    "Code Files": "Now, generate all the code files (Frontend and Backend). Ensure each file is in its own markdown block with a `#### path/to/file.ext` header.",
    "README.md": "Finally, create the `README.md` file with complete setup instructions. and dont use #### the four # header inside the readme"
}

# --- API Endpoints ---
@app.get("/")
async def root():
    return {"message": "Conversational AI Coder is running!", "status": "healthy"}

@app.post("/start-conversation", response_model=StartResponse)
async def start_conversation():
    session_id = str(uuid.uuid4())
    initial_message = "Hello! I'm here to help you plan your web application. What are you thinking of building today?"
    CONVERSATION_SESSIONS[session_id] = [
        {"role": "system", "content": REFINEMENT_SYSTEM_PROMPT},
        {"role": "assistant", "content": initial_message}
    ]
    logger.info(f"New conversation started: {session_id}")
    return StartResponse(session_id=session_id, message=initial_message)

@app.post("/refine", response_model=ConversationResponse)
async def refine_features(request: ConversationRequest):
    if request.session_id not in CONVERSATION_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    history = CONVERSATION_SESSIONS[request.session_id]
    history.append({"role": "user", "content": request.message})

    try:
        response = await client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=history,
            temperature=0.7,
            max_tokens=1000,
        )
        reply = response.choices[0].message.content
        history.append({"role": "assistant", "content": reply})
        CONVERSATION_SESSIONS[request.session_id] = history
        return ConversationResponse(reply=reply, session_id=request.session_id)
    except Exception as e:
        logger.error(f"Error during refinement: {e}")
        raise HTTPException(status_code=500, detail="AI conversation failed.")

@retry(
    wait=wait_random_exponential(min=1, max=20),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(RateLimitError)
)
# New function: Non-streamed generation
async def run_code_generation(request: GenerateRequest) -> str:
    if request.session_id not in CONVERSATION_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found to generate code from.")

    conversation_history = copy.deepcopy(CONVERSATION_SESSIONS[request.session_id])

    messages = [
        {"role": "system", "content": CODE_GEN_SYSTEM_PROMPT},
        {"role": "user", "content": "Here is the full conversation history. Please generate the application based on this.\n\n" + "\n".join([f"{m['role']}: {m['content']}" for m in conversation_history if m['role'] != 'system'])}
    ]

    full_output = ""
    try:
        for section_title, section_task in CODE_GEN_PLAN.items():
            messages.append({"role": "user", "content": section_task})

            response = await client.chat.completions.create(
                model=AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=messages,
                temperature=0.2,
                max_tokens=8192,
            )

            section_response = response.choices[0].message.content
            messages.append({"role": "assistant", "content": section_response})

            full_output += f"\n\n---\n## 🔹 {section_title}\n\n{section_response}"

    except Exception as e:
        logger.error(f"Error during generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during code generation: {str(e)}")

    return full_output


# Final API endpoint
@app.post("/generate")
async def generate_code(request: GenerateRequest):
    try:
        full_output = await run_code_generation(request)
        return Response(content=full_output, media_type='text/markdown')
    except Exception as e:
        logger.error(f"Error during generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)