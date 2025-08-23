# file: Ai/main.py
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

# Azure envs (do not fail-fast; allow non-Azure endpoints like /start-conversation)
REQUIRED_ENV = [
    "AZURE_OPENAI_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_API_VERSION",
    "AZURE_OPENAI_DEPLOYMENT_NAME",
]
_missing = [k for k in REQUIRED_ENV if not os.getenv(k)]
AZURE_READY = len(_missing) == 0

app = FastAPI(
    title="StudAI Works - Conversational AI Coder",
    description="A conversational service to first refine features and then generate code.",
    version="5.0.0"
)

# CORS configuration via env
# ALLOWED_ORIGINS: comma-separated list of origins. Example: http://localhost:5173,https://studai.app
# CORS_ALLOW_CREDENTIALS: "true" | "false"
_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] or ["*"]
allow_credentials = os.getenv("CORS_ALLOW_CREDENTIALS", "false").lower() == "true"

# If wildcard origins are used, browsers won't allow credentials; enforce safe behavior
if "*" in allowed_origins and allow_credentials:
    logger.warning(
        "CORS_ALLOW_CREDENTIALS=true is incompatible with ALLOWED_ORIGINS='*'. "
        "Disabling credentials to avoid browser rejection."
    )
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Client Setup ---
client = None
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
if AZURE_READY:
    client = AsyncAzureOpenAI(
        api_key=os.getenv("AZURE_OPENAI_KEY"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    )
    logger.info(
        "AI service initialized: model=%s, origins=%s, credentials=%s",
        AZURE_OPENAI_DEPLOYMENT_NAME,
        allowed_origins,
        allow_credentials,
    )
else:
    logger.warning("Azure OpenAI env not fully configured (%s missing). /start-conversation will work; /refine and /generate will return 503 until configured.", ", ".join(_missing))

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

class FileInput(BaseModel):
    path: str
    content: str

class EditRequest(BaseModel):
    instructions: str = ""
    error: str = ""
    files: list[FileInput] = Field(default_factory=list)
    file_paths: list[str] = Field(default_factory=list)  # optional: full project file index for context

# --- System Prompts ---
REFINEMENT_SYSTEM_PROMPT = """
You are a friendly and brilliant project manager. Your goal is to talk to the user and help them clarify the features for a web application they want to build. Ask clarifying questions, suggest features, and help them create a solid plan. Keep your responses concise and guide the conversation forward. Once you feel the plan is clear, confirm with the user if they are ready to generate the code. Keep in mind that this is for a future prompt.
"""

CODE_GEN_SYSTEM_PROMPT = """
You are an expert Full-Stack Developer with 25+ years of experience. Your task is to generate a complete, production-grade, and well-documented web application based on the provided conversation history.

The user and a project manager have already discussed the features. Your job is to read their entire conversation and build the application exactly as specified.
###You need to use CSS not tailwind and also you need to generate it inside the index.css file not in any other files and the website modren look like a webiste that goning to come look beautiful and naturally with that much styles and animations and make sure one more time everyting importted perfectly tis is very important

### prefix the code without this error Something went wrong

/src/store/useAppStore.ts: (0 , _zustand.default) is not a function (80:38)

   updateNotification: (n: Notification) => void;
  | }
  | 
>  | const useAppStore = create<AppState>((set) => ({
                                             ^
   |   currentScreen: 'dashboard',
  |   setCurrentScreen: (screen) => set({ currentScreen: screen }),
  | 
### 🔧 Tech Stack
- Frontend: React (TypeScript) + CSS + Vite (Unless specified otherwise in history)
- make sure to include all necessary files to be able to download and run this project like index.html or index.tsx etc
- Backend: Something compatible with react
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
> All frontend-related files (e.g., `vite.config.ts`, `tsconfig.json`, `tailwind.config.cjs`, `index.html`, `package.json`) must be under the `frontend/` folder.  
> All backend files (e.g., `requirements.txt`, `main.py`, `pyproject.toml`) must be under the `backend/` folder.  
> No files should exist at the project root except the `README.md`.
---

1.  **Project Overview**: A high-level description based on the conversation.
2.  **Folder Structure**: A markdown tree.
3.  **Code Files**: All frontend and backend code. Use markdown headers for each file path (e.g., `#### path/to/file.ext`).
4.  **README.md**: Complete setup and run instructions.
"""

CODE_GEN_PLAN = {
    "Project Overview": "First, provide the 'Project Overview'. Summarize the app's features based on the entire conversation history.",
    "Folder Structure": "Next, generate the complete 'Folder Structure' in a markdown tree format.",
    "Code Files": "Now, generate all the code files (Frontend and Backend). Ensure each file is in its own markdown block with a `#### path/to/file.ext` header as well as make sure to include all files like index etc so that no import fails as well as make sure of having all necessary libraries in the package.json for frontend.",
    "README.md": "Finally, create the `README.md` file with complete setup instructions. and dont use #### the four # header inside the readme",
    "Validate Project": "Finally, double-check that the project is complete and functional. Ensure all important files exist (vite.config.ts, index.html(including the initialisation of tsx in it if necessary), package.json(recheck if all imports are included), tailwind.config.js in frontend; server.ts or main.py and requirements.txt in backend). Check that the README covers everything necessary to run the project. Then confirm that this app should build and run end-to-end without errors. Respond with your validation checklist and a final confirmation message."
}

# --- API Endpoints ---
@app.get("/")
async def root():
    return {
        "message": "Conversational AI Coder is running!",
        "status": "healthy",
        "azure_ready": AZURE_READY,
        "model": AZURE_OPENAI_DEPLOYMENT_NAME,
    }

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
        if not AZURE_READY or client is None:
            raise HTTPException(status_code=503, detail="Azure OpenAI is not configured. Please set AZURE_OPENAI_* env vars.")
        response = await client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=history,
            temperature=0.7,
            max_tokens=2000,
        )
        reply = response.choices[0].message.content
        history.append({"role": "assistant", "content": reply})
        CONVERSATION_SESSIONS[request.session_id] = history
        return ConversationResponse(reply=reply, session_id=request.session_id)
    except Exception as e:
        logger.error(f"Error during refinement: {e}")
        msg = str(e)
        if "404" in msg and ("Resource not found" in msg or "Not Found" in msg):
            raise HTTPException(status_code=502, detail=(
                "Azure returned 404 for chat/completions. Please verify: "
                "AZURE_OPENAI_DEPLOYMENT_NAME matches your deployment name, and "
                "AZURE_OPENAI_API_VERSION is valid for your model (e.g., 2025-01-01-preview for GPT-4.1)."
            ))
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
        if not AZURE_READY or client is None:
            raise HTTPException(status_code=503, detail="Azure OpenAI is not configured. Please set AZURE_OPENAI_* env vars.")
        for section_title, section_task in CODE_GEN_PLAN.items():
            messages.append({"role": "user", "content": section_task})

            response = await client.chat.completions.create(
                model=AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=messages,
                temperature=0.2,
                max_tokens=10192,
            )

            section_response = response.choices[0].message.content
            messages.append({"role": "assistant", "content": section_response})

            full_output += f"\n\n---\n## 🔹 {section_title}\n\n{section_response}"

    except Exception as e:
        logger.error(f"Error during generation: {str(e)}")
        msg = str(e)
        if "404" in msg and ("Resource not found" in msg or "Not Found" in msg):
            raise HTTPException(status_code=502, detail=(
                "Azure returned 404 for chat/completions. Check AZURE_OPENAI_DEPLOYMENT_NAME and set AZURE_OPENAI_API_VERSION to a supported preview (e.g., 2025-01-01-preview for GPT-4.1)."
            ))
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

# --- Edit/Improve existing code ---
@app.post("/edit")
async def edit_code(req: EditRequest):
    try:
        if not AZURE_READY or client is None:
            raise HTTPException(status_code=503, detail="Azure OpenAI is not configured. Please set AZURE_OPENAI_* env vars.")

        # Build prompt: provide instruction/error and current files; ask for only modified files in strict format
        SYSTEM_PROMPT = (
            "You are an expert software engineer and code editor. Given the user's instructions or a concrete error, "
            "produce only the updated files needed to implement the change or fix the error. Output strictly as markdown blocks, "
            "one per changed file, using this exact format: \n\n"
            "#### path/to/file.ext\n\n```language\n<full file content>\n```\n\n"
            "Do not include explanations or any other text. If no changes are needed, return an empty response."
        )

        # Prepare a compact files listing. If too many files, this may be large; MVP keeps it simple.
        files_text_parts = []
        for f in req.files:
            # Heuristic language from extension
            lang = ""
            if f.path.endswith((".ts", ".tsx")):
                lang = "ts"
            elif f.path.endswith((".js", ".jsx")):
                lang = "js"
            elif f.path.endswith(".css"):
                lang = "css"
            elif f.path.endswith(".json"):
                lang = "json"
            elif f.path.endswith(".md"):
                lang = "md"
            files_text_parts.append(f"#### {f.path}\n\n```{lang}\n{f.content}\n```")

        files_context = "\n\n---\n".join(files_text_parts)

        # Lightweight context of full project paths if provided
        index_section = ("\n\nProject file index (paths only):\n" + "\n".join(req.file_paths)) if req.file_paths else ""

        user_msg = (
            (f"Instructions:\n{req.instructions}\n\n" if req.instructions else "") +
            (f"Error:\n{req.error}\n\n" if req.error else "") +
            "Here are the current relevant files. Apply the change/fix and output only the changed files as strict markdown blocks.\n\n"
            + files_context + index_section
        )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg}
        ]

        resp = await client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=messages,
            temperature=0.2,
            max_tokens=4096,
        )
        content = resp.choices[0].message.content or ""
        return Response(content=content, media_type='text/markdown')
    except Exception as e:
        logger.error(f"Error during edit: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)