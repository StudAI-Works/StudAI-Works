"""
StudAI Works - AI Service
FastAPI service for code generation using Azure OpenAI (GPT-4 Turbo)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
import openai
import os
import logging
import time
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Load environment variables
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="StudAI Works - AI Service",
    description="AI-powered code generation service using Azure OpenAI",
    version="3.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Azure OpenAI Config
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")

if not all([AZURE_OPENAI_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME, AZURE_OPENAI_API_VERSION]):
    raise ValueError("Missing Azure OpenAI configuration in environment variables")

openai.api_key = AZURE_OPENAI_KEY
openai.api_base = AZURE_OPENAI_ENDPOINT
openai.api_type = "azure"
openai.api_version = AZURE_OPENAI_API_VERSION

# Rate limiting tokens (1M/min)
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

def get_completion_with_continuation(user_input: str, section_prompt: str, previous_response: str = "") -> str:
    messages = [
        {"role": "system", "content": "You are an expert software developer with a focus on clean, production-ready code."},
        {"role": "user", "content": section_prompt if not previous_response else f"{previous_response}\n[CONTINUE]"}
    ]
    response = openai.ChatCompletion.create(
        engine=AZURE_OPENAI_DEPLOYMENT_NAME,
        messages=messages,
        temperature=0.3,
        max_tokens=8192,
        top_p=0.9,
        frequency_penalty=0.1,
        presence_penalty=0.1
    )
    return response.choices[0].message["content"]

class GenerateRequest(BaseModel):
    userInput: str

class GenerateResponse(BaseModel):
    generatedPrompt: str
    generatedCode: str

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
  - `package.json`, `vite.config.ts`, `index.html`, `.env`, etc. are included and complete including packages inside the json so that npm install fixes all necessary dependencies
  - `README.md` has full setup and usage instructions
  - All paths and routing logic in React are correct and functional
  - Make sure the index.html has proper scripts

---

### 📂 Output Format (Strict Markdown Format)
Follow this exact format so the code can be parsed correctly:

1. ✅ **Project Overview**: Describe app features, architecture, and high-level flow
2. 📁 **Folder Structure**: Use a markdown tree format
3. 🔢 **Code Blocks**:
   - Use markdown headers like:
     ```
     #### path/to/file.ext
     ```language
     // code here
     ```
   - Keep each file in its own clearly separated section
   - Ensure the code is complete and syntactically valid
4. 🚀 **Setup Instructions**: Full steps to run the project
6. 📝 **Notes**: List any assumptions or trade-offs
7. the readme give in the end at once and do not use #### in the readme

---

### 🛑 Large Output Instructions
If output exceeds limit:
- End with `[CONTINUE]`
- In the next call, **resume exactly where the last output stopped** — don’t repeat completed sections

---

Start by generating the full application for: **"{user_input}"**
    """

# Section prompts
SECTION_PROMPTS = {
    "overview": "Start with Part 1 - ✅ Project Overview. Describe the purpose, features, and architecture of the app based on the user's request.",
    "structure": "Generate Part 2 - 📁 Folder Structure in markdown tree format.",
    "frontend": "Generate Part 3 - 🔢 Code for the React Frontend using TypeScript, Tailwind CSS, Zustand, and Vite.",
    "backend": "Generate Part 4 - 🔢 Code for the FastAPI Backend with PostgreSQL integration, auth, and logging.",
    "setup": "Generate Part 5 - 🚀 Setup Instructions for installing dependencies, setting environment variables, and running the project.",
    "notes": "Generate Part 6 - 📝 Notes about assumptions, limitations, and optional improvements."
}

@app.get("/")
async def root():
    return {"message": "StudAI Works Azure AI Service is running!", "status": "healthy"}

@app.get("/health")
@retry(retry=retry_if_exception_type(openai.error.OpenAIError), stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def health_check():
    try:
        openai.ChatCompletion.create(
            engine=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[{"role": "user", "content": "Ping"}]
        )
        return {"status": "healthy", "service": "Azure OpenAI connected"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Azure OpenAI connection failed")

@app.post("/generate", response_model=GenerateResponse)
@retry(retry=retry_if_exception_type(openai.error.OpenAIError), stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def generate_code(request: GenerateRequest):
    try:
        if not request.userInput or len(request.userInput.strip()) < 10:
            raise HTTPException(status_code=400, detail="Input too short")

        base_prompt = create_base_prompt(request.userInput)
        full_response = ""

        for section_name, section_task in SECTION_PROMPTS.items():
            logger.info(f"🔧 Generating section: {section_name}")
            section_prompt = f"{base_prompt}\n\n{section_task}"
            section_response = get_completion_with_continuation(request.userInput, section_prompt)

            while "[CONTINUE]" in section_response:
                logger.info(f"⏭ Continuing section: {section_name}")
                next_chunk = get_completion_with_continuation(request.userInput, section_prompt, section_response)
                section_response = section_response.replace("[CONTINUE]", "") + next_chunk

            throttle_tokens(len(section_response) // 4)
            full_response += f"\n\n---\n### 🔹 {section_name.capitalize()}\n\n{section_response.strip()}"

        return GenerateResponse(
            generatedPrompt=base_prompt.strip(),
            generatedCode=full_response.strip()
        )

    except Exception as e:
        logger.error(f"❌ Error in /generate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/generate-simple")
@retry(retry=retry_if_exception_type(openai.error.OpenAIError), stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def generate_simple(request: GenerateRequest):
    try:
        simple_prompt = f"Create a simple web app for: {request.userInput}"
        completion = openai.ChatCompletion.create(
            engine=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[{"role": "user", "content": simple_prompt}],
            temperature=0.5,
            max_tokens=2048
        )
        return {
            "userInput": request.userInput,
            "generatedCode": completion.choices[0].message["content"],
            "prompt": simple_prompt
        }
    except Exception as e:
        logger.error(f"Error in /generate-simple: {str(e)}")
        raise HTTPException(status_code=500, detail="Simple generation failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
