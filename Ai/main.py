"""
StudAI Works - AI Service
Merged: Harsha's Phase 1 + Phase 2/3 + Advanced refinement & file-editing features
"""

import os
import copy
import asyncio
import logging
import uuid
import time
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional, Dict, List
from openai import AzureOpenAI, AsyncAzureOpenAI, OpenAIError, RateLimitError
from tenacity import retry, stop_after_attempt, wait_random_exponential, wait_exponential, retry_if_exception_type

# -------------------------
# Load environment variables
# -------------------------
load_dotenv()

AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")

if not all([AZURE_OPENAI_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME, AZURE_OPENAI_API_VERSION]):
    raise ValueError("Missing Azure OpenAI configuration in environment variables")

# -------------------------
# Logging
# -------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ANSI colors for terminal visibility
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
RESET = "\033[0m"

# -------------------------
# FastAPI app
# -------------------------
app = FastAPI(
    title="StudAI Works - AI Service",
    description="AI-powered iterative code generation with refinement and file editing",
    version="4.0.0"
)

# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Azure OpenAI Clients
# -------------------------
client = AzureOpenAI(
    api_key=AZURE_OPENAI_KEY,
    api_version=AZURE_OPENAI_API_VERSION,
    azure_endpoint=AZURE_OPENAI_ENDPOINT
)

async_client = AsyncAzureOpenAI(
    api_key=AZURE_OPENAI_KEY,
    api_version=AZURE_OPENAI_API_VERSION,
    azure_endpoint=AZURE_OPENAI_ENDPOINT
)

# -------------------------
# Token Throttling
# -------------------------
MAX_TOKENS_PER_MIN = 1_000_000
tokens_used = 0
token_window_start = time.time()

def throttle_tokens(estimated_tokens: int):
    global tokens_used, token_window_start
    now = time.time()
    if now - token_window_start > 60:
        tokens_used = 0
        token_window_start = now
    tokens_used += estimated_tokens
    if tokens_used > MAX_TOKENS_PER_MIN:
        sleep_time = 60 - (now - token_window_start)
        logger.warning(f"Throttling: sleeping for {sleep_time:.2f}s")
        time.sleep(sleep_time)
        tokens_used = estimated_tokens
        token_window_start = time.time()

# -------------------------
# In-Memory Session Storage
# -------------------------
sessions: Dict[str, Dict] = {}
CONVERSATION_SESSIONS: Dict[str, List[Dict[str, str]]] = {}

# -------------------------
# Pydantic Schemas
# -------------------------
class GenerateRequest(BaseModel):
    userInput: str
    sessionId: Optional[str] = None
    followUp: Optional[str] = None

class GenerateResponse(BaseModel):
    sessionId: str
    generatedPrompt: str
    generatedCode: str

class ChatRequest(BaseModel):
    sessionId: Optional[str] = None
    message: str

class FollowupRequest(BaseModel):
    sessionId: str
    followUp: str

class ConversationRequest(BaseModel):
    session_id: str
    message: str

class ConversationResponse(BaseModel):
    reply: str
    session_id: str
    work_summary: str | None = None

class StartResponse(BaseModel):
    session_id: str
    message: str

# -------------------------
# Prompt Templates
# -------------------------
def create_base_prompt(user_input: str) -> str:
    return f"""
You are an expert Full-Stack Developer and Prompt Engineer with 25+ years of experience.

Your task is to generate **production-grade, modular, scalable, and well-documented** code for a full-stack web application described below.

---

🧾 **User Request**: "{user_input}"

---

### 🔧 Tech Stack
- **Frontend**: React (TypeScript) + Tailwind CSS + Vite + React Router + Zustand
- **Backend**: Python FastAPI + SQLAlchemy + PostgreSQL
- **State Management**: Zustand
- **Authentication**: JWT (JSON Web Tokens)

---

### 📋 Project Requirements
- Write clean, modular, DRY code using best practices (e.g., SOLID)
- Include detailed inline comments and logging where appropriate
- Provide a complete and runnable folder/file structure
- Ensure:
  - All imports work (no missing files or broken paths)
  - `package.json`, `vite.config.ts`, `index.html`, `.env`, etc. are included and complete
  - `README.md` has full setup and usage instructions
  - All paths and routing logic in React are correct and functional
  - `index.html` has proper script tags

---

### 📂 Output Format (Strict Markdown Format)
1. ✅ **Project Overview**
2. 📁 **Folder Structure**
3. 🔢 **Code Blocks**
4. 🚀 **Setup Instructions**
5. 📝 **Notes**

Start building for: **"{user_input}"**
"""

SECTION_PROMPTS = {
    "overview": "Start with Part 1 - ✅ Project Overview.",
    "structure": "Generate Part 2 - 📁 Folder Structure in markdown tree format.",
    "frontend": "Generate Part 3 - 🔢 Code for the React Frontend.",
    "backend": "Generate Part 4 - 🔢 Code for the FastAPI Backend.",
    "setup": "Generate Part 5 - 🚀 Setup Instructions.",
    "notes": "Generate Part 6 - 📝 Notes."
}

# -------------------------
# Utilities
# -------------------------
def parse_markdown_to_dict(markdown: str):
    file_pattern = r'####\s+(.+?)\s*\r?\n```[ \t]*([a-zA-Z0-9+\-_.]*)?\s*\r?\n([\s\S]*?)```'
    files = {}
    for match in re.finditer(file_pattern, markdown, re.DOTALL):
        path = match.group(1).strip()
        content = match.group(3).strip()
        files[path] = content
    return files

def extract_project_summary(markdown: str):
    summary_re = r'##\s*(?:🔹\s*)?Project Overview\s*\r?\n([\s\S]*?)(?=\r?\n---|\r?\n\*\*\*|^##\s|\Z)'
    m = re.search(summary_re, markdown, re.DOTALL | re.MULTILINE)
    return m.group(1).strip() if m else ""

def extract_readme(markdown_output: str) -> str:
    pattern = r'####\s+README\.md\s*\r?\n```[ \t]*(?:markdown|md)?[ \t]*\r?\n([\s\S]*?)```'
    match = re.search(pattern, markdown_output, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else ""

@retry(retry=retry_if_exception_type(OpenAIError),
       stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
def ask_openai(messages: List[Dict[str, str]]) -> str:
    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_NAME,
        messages=messages,
        temperature=0.7,
        max_tokens=1000,
        top_p=1.0
    )
    return response.choices[0].message.content

# -------------------------
# Endpoints
# -------------------------
@app.get("/")
async def root():
    return {"message": "StudAI Works is running", "status": "healthy"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    session_id = request.sessionId or str(uuid.uuid4())
    if session_id not in sessions:
        sessions[session_id] = {"chat": []}
    chat = sessions[session_id]["chat"]
    chat.append({"role": "user", "content": request.message})
    response = ask_openai([{"role": "system", "content": "You're a helpful assistant for planning software projects."}] + chat)
    chat.append({"role": "assistant", "content": response})
    return {"sessionId": session_id, "response": response}

@app.post("/generate", response_model=GenerateResponse)
async def generate_endpoint(request: GenerateRequest):
    session_id = request.sessionId or str(uuid.uuid4())

    # -------- Phase 2: Planning (Visibility added) --------
    logger.info(f"{BLUE}PHASE 2 ▶ Starting planning for session {session_id}{RESET}")
    logger.info(f"{BLUE}PHASE 2 ▶ UserInput:{RESET} {request.userInput}")

    plan_prompt = [
        {"role": "system", "content": "You are a senior software architect. Create a step-by-step plan."},
        {"role": "user", "content": request.userInput}
    ]
    plan = ask_openai(plan_prompt)
    logger.info(f"{BLUE}PHASE 2 ✅ Plan generated (preview):{RESET} {plan[:350].replace(chr(10),' ')}{'...' if len(plan) > 350 else ''}")

    tools_prompt = [
        {"role": "system", "content": "Suggest the best stack, tools, and libraries."},
        {"role": "user", "content": plan}
    ]
    tools = ask_openai(tools_prompt)
    logger.info(f"{BLUE}PHASE 2 ✅ Tools suggested (preview):{RESET} {tools[:350].replace(chr(10),' ')}{'...' if len(tools) > 350 else ''}")
    logger.info(f"{BLUE}PHASE 2 ⏹ Completed planning for session {session_id}{RESET}")

    base_prompt = create_base_prompt(request.userInput) + f"""

---\n
### 🛠 Plan:\n{plan}\n
---\n
### 🧰 Tools:\n{tools}
"""

    sessions[session_id] = {
        "chat": [{"role": "user", "content": request.userInput}],
        "code": [{"role": "system", "content": "You are an expert developer."},
                 {"role": "user", "content": base_prompt}]
    }

    full_response = ""
    history = sessions[session_id]["code"]

    # -------- Generation with Phase 3 self-review per section --------
    for section, prompt in SECTION_PROMPTS.items():
        logger.info(f"{YELLOW}SECTION ▶ Generating '{section}'...{RESET}")
        history.append({"role": "user", "content": prompt})
        section_response = ask_openai(history)
        logger.info(f"{YELLOW}SECTION ✅ Draft generated for '{section}' (preview):{RESET} {section_response[:220].replace(chr(10),' ')}{'...' if len(section_response) > 220 else ''}")

        # Phase 3: Self-review & correction (Visibility added)
        logger.info(f"{GREEN}PHASE 3 ▶ Reviewing & correcting section '{section}'...{RESET}")
        review_prompt = [
            {"role": "system", "content": "Review the following code or content for bugs, missing parts, or bad practices. Then fix it without removing correct content."},
            {"role": "user", "content": section_response}
        ]
        corrected_section = ask_openai(review_prompt)
        logger.info(f"{GREEN}PHASE 3 ✅ Review completed for '{section}' (preview):{RESET} {corrected_section[:220].replace(chr(10),' ')}{'...' if len(corrected_section) > 220 else ''}")

        section_response = corrected_section
        history.append({"role": "assistant", "content": section_response})
        throttle_tokens(len(section_response) // 4)
        full_response += f"\n\n---\n### 🔹 {section.capitalize()}\n\n{section_response.strip()}"

    logger.info(f"{MAGENTA}ALL SECTIONS ✅ Completed for session {session_id}{RESET}")

    return GenerateResponse(
        sessionId=session_id,
        generatedPrompt=base_prompt,
        generatedCode=full_response.strip()
    )

@app.post("/followup")
async def followup_endpoint(request: FollowupRequest):
    if request.sessionId not in sessions or "code" not in sessions[request.sessionId]:
        raise HTTPException(status_code=404, detail="Session not found")
    code_history = sessions[request.sessionId]["code"]
    code_history.append({"role": "user", "content": request.followUp})
    logger.info(f"{YELLOW}FOLLOW-UP ▶ Applying incremental change...{RESET}")
    new_code = ask_openai(code_history)
    review_prompt = [
        {"role": "system", "content": "Review the code for bugs, missing parts, or bad practices and fix them."},
        {"role": "user", "content": new_code}
    ]
    corrected_code = ask_openai(review_prompt)
    code_history.append({"role": "assistant", "content": corrected_code})
    logger.info(f"{GREEN}FOLLOW-UP ✅ Change reviewed & applied (preview):{RESET} {corrected_code[:220].replace(chr(10),' ')}{'...' if len(corrected_code) > 220 else ''}")
    return {"update": corrected_code}

@app.get("/health")
@retry(retry=retry_if_exception_type(OpenAIError),
       stop=stop_after_attempt(3),
       wait=wait_random_exponential(multiplier=1, min=4, max=10))
async def health_check():
    try:
        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[{"role": "user", "content": "Ping"}],
            temperature=0.0,
            max_tokens=10
        )
        return {"status": "healthy", "service": "Azure OpenAI connected"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Azure OpenAI connection failed")

@app.post("/generate-simple")
@retry(retry=retry_if_exception_type(OpenAIError),
       stop=stop_after_attempt(3),
       wait=wait_exponential(min=2, max=10))
async def generate_simple(request: GenerateRequest):
    simple_prompt = f"Create a simple web app for: {request.userInput}"
    result = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_NAME,
        messages=[{"role": "user", "content": simple_prompt}],
        temperature=0.5,
        max_tokens=2048
    )
    return {
        "userInput": request.userInput,
        "generatedCode": result.choices[0].message.content,
        "prompt": simple_prompt
    }

# -------------------------
# New Advanced Endpoints
# -------------------------
@app.post("/start", response_model=StartResponse)
async def start():
    session_id = str(uuid.uuid4())
    CONVERSATION_SESSIONS[session_id] = [{
        "role": "system",
        "content": "You are a senior software engineer with deep expertise in code refinement and targeted file editing."
    }]
    return StartResponse(session_id=session_id, message="Session started.")

@app.post("/conversation", response_model=ConversationResponse)
async def conversation(request: ConversationRequest):
    if request.session_id not in CONVERSATION_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    conversation_history = CONVERSATION_SESSIONS[request.session_id]
    conversation_history.append({"role": "user", "content": request.message})
    reply = ask_openai(conversation_history)
    conversation_history.append({"role": "assistant", "content": reply})
    work_summary = None
    if "generate" in request.message.lower() or "create" in request.message.lower():
        work_summary = extract_project_summary(reply)
    return ConversationResponse(reply=reply, session_id=request.session_id, work_summary=work_summary)

@app.post("/refine")
async def refine_existing_code(session_id: str, refinement_instructions: str):
    if session_id not in CONVERSATION_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    history = copy.deepcopy(CONVERSATION_SESSIONS[session_id])
    history.append({"role": "user", "content": f"Refine this project: {refinement_instructions}"})
    logger.info(f"{YELLOW}REFINE ▶ Refining existing project for session {session_id}{RESET}")
    refinement_reply = ask_openai(history)
    files_dict = parse_markdown_to_dict(refinement_reply)
    readme_content = extract_readme(refinement_reply)
    logger.info(f"{GREEN}REFINE ✅ Done (files parsed):{RESET} {len(files_dict)}")
    return {
        "refined_files": files_dict,
        "refined_readme": readme_content
    }

@app.post("/edit-file")
async def targeted_file_edit(file_content: str, edit_instructions: str):
    prompt = [
        {"role": "system", "content": "Edit the provided file according to the given instructions, keeping the rest of the content unchanged."},
        {"role": "user", "content": f"File content:\n{file_content}\n\nInstructions:\n{edit_instructions}"}
    ]
    logger.info(f"{YELLOW}EDIT-FILE ▶ Applying targeted edit...{RESET}")
    edited_file = ask_openai(prompt)
    logger.info(f"{GREEN}EDIT-FILE ✅ Edit completed (preview):{RESET} {edited_file[:220].replace(chr(10),' ')}{'...' if len(edited_file) > 220 else ''}")
    return {"edited_file": edited_file}
