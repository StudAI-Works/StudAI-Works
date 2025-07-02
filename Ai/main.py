import os
import re
import shutil
import uuid
import openai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Groq config
openai.api_key = os.getenv("GROQ_API_KEY")
openai.api_base = "https://api.groq.com/openai/v1"

# FastAPI app
app = FastAPI(
    title="StudAI Works - Project Generator",
    description="Generates full-stack apps using Groq + FastAPI + React",
    version="3.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    userInput: str

def create_meta_prompt(user_input: str) -> str:
    return f'''
You are an expert full-stack developer. Based on the user request below, generate a complete modular project.

"{user_input}"

### Requirements:
- Use React (multi-page SPA) for frontend
- Use FastAPI for backend
- Use Python/JS best practices
- Format every file in a markdown code block.
- Every file must be inside a code block with the **file path as the first line of the code block**, not outside.
Example:
```jsx
// frontend/src/pages/Login.jsx
<file content>


- Include:
  1. Project Overview
  2. Frontend Code
  3. Backend Code
  4. Database Schema
  5. Setup Instructions
  6. API Endpoints
'''

def extract_files(text: str, base_dir: str) -> None:
    fallback_counter = 0
    all_matches = []

    # Match Format 1: ### `path` followed by ```lang\ncode\n```
    heading_pattern = re.compile(
        r"### [`\"](.*?)[`\"]\s*```([a-zA-Z]*)\n(.*?)```", re.DOTALL)
    heading_matches = heading_pattern.findall(text)
    logger.info(f"Found {len(heading_matches)} code blocks with markdown-heading paths.")
    for path, lang, content in heading_matches:
        all_matches.append((path.strip(), content.strip()))

    # Match Format 2: ```lang\n// path\ncode\n```
    inline_path_pattern = re.compile(
        r"```(?:[a-zA-Z]*\n)?//\s*(.*?)\n(.*?)```", re.DOTALL)
    inline_matches = inline_path_pattern.findall(text)
    logger.info(f"Found {len(inline_matches)} code blocks with inline comment paths.")
    for path, content in inline_matches:
        all_matches.append((path.strip(), content.strip()))

    if not all_matches:
        logger.warning("No code blocks with file paths found.")
        fallback_path = os.path.join(base_dir, "unknown", "raw_model_output.md")
        os.makedirs(os.path.dirname(fallback_path), exist_ok=True)
        with open(fallback_path, "w", encoding="utf-8") as f:
            f.write(text)
        logger.warning(f"Saved fallback output to: {fallback_path}")
        return

    for path, content in all_matches:
        if not path:
            path = f"unknown/fallback_{fallback_counter}.txt"
            fallback_counter += 1
            logger.warning(f"Missing file path; saving fallback file: {path}")

        clean_path = path.replace("\\", "/")
        full_path = os.path.join(base_dir, clean_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        logger.info(f"Saved file: {clean_path} ({len(content)} bytes)")

    # Save raw output for debugging
    raw_output_path = os.path.join(base_dir, "raw_model_output.md")
    with open(raw_output_path, "w", encoding="utf-8") as f:
        f.write(text)
    logger.info(f"Saved raw model output to: {raw_output_path}")


@app.post("/generate")
async def generate_output(request: GenerateRequest):
    try:
        logger.info(f"Generating code for: {request.userInput}")
        prompt = create_meta_prompt(request.userInput)

        response = openai.ChatCompletion.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are a code generator bot."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4096,
            stream=True
        )

        output = ""
        for chunk in response:
            if "choices" in chunk and len(chunk["choices"]) > 0:
                delta = chunk["choices"][0].get("delta", {})
                if "content" in delta:
                    output += delta["content"]

        if not output.strip():
            raise ValueError("Model returned an empty response")

        logger.info("Raw model output:\n" + output[:2000])

        return {"userInput": request.userInput, "output": output}

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-and-save")
async def generate_and_save(request: GenerateRequest):
    try:
        logger.info(f"Generating and saving for: {request.userInput}")
        prompt = create_meta_prompt(request.userInput)

        response = openai.ChatCompletion.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are a code generator bot."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4096,
            stream=True
        )

        output = ""
        for chunk in response:
            if "choices" in chunk and len(chunk["choices"]) > 0:
                delta = chunk["choices"][0].get("delta", {})
                if "content" in delta:
                    output += delta["content"]

        if not output.strip():
            raise ValueError("Model returned an empty response")

        temp_id = str(uuid.uuid4())
        temp_dir = os.path.join("temp_projects", temp_id)
        os.makedirs(temp_dir, exist_ok=True)

        # Save full raw output for debugging
        raw_output_path = os.path.join(temp_dir, "raw_model_output.md")
        with open(raw_output_path, "w", encoding="utf-8") as f:
            f.write(output)
        logger.info(f"Saved raw model output to: {raw_output_path}")

        # Extract files from the output
        extract_files(output, temp_dir)

        return {
            "message": "Project files saved",
            "path": temp_dir,
            "example_files": os.listdir(temp_dir)
        }

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"message": "StudAI API running."}