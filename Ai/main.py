import os
import copy
import asyncio
import logging
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
import re
from openai import AsyncAzureOpenAI, RateLimitError
from supabase._async.client import AsyncClient, create_client
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type
from datetime import datetime
from fastapi import Depends

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

def get_file_language(filename: str) -> str:
    ext = filename.split('.')[-1]
    return {
        "ts": "typescript",
        "tsx": "typescript",
        "js": "javascript",
        "jsx": "javascript",
        "css": "css",
        "json": "json",
        "html": "html",
        "md": "markdown",
        "py": "python",
        "txt": "plaintext",
    }.get(ext, "")

# --- Azure OpenAI Client Setup ---
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")  # e.g. "gpt-4-1"
if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_KEY or not AZURE_OPENAI_DEPLOYMENT:
    raise RuntimeError("Azure OpenAI environment variables not set.")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
async def get_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase URL or key not set in environment variables.")
    return await create_client(SUPABASE_URL, SUPABASE_KEY)

async def save_llm_output(session_id: str, llm_output: dict, supabase: AsyncClient):
    response = await supabase.table("LLM").insert({
        "id": session_id,
        "session_id": session_id,
        "llm_output": llm_output,
        "created_at": datetime.utcnow().isoformat()
    }).execute()
    return response

async def get_llm_outputs(session_id: str, supabase: AsyncClient):
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required.")
    response = await supabase.table("LLM").select("*").eq("id", session_id).execute()
    return response.data


openai.api_type = "azure"
openai.api_base = AZURE_OPENAI_ENDPOINT
openai.api_key = AZURE_OPENAI_KEY
openai.api_version = "2024-02-15-preview"  # Use the correct API version for GPT-4.1


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

class ConversationRequest(BaseModel):
    session_id: str
    message: str

class ConversationResponse(BaseModel):
    reply: str
    session_id: str
    work_summary: str | None = None

class GenerateRequest(BaseModel):
    session_id: str

class StartResponse(BaseModel):
    session_id: str
    message: str

# --- System Prompts ---
REFINEMENT_SYSTEM_PROMPT = """
You are a friendly and brilliant project manager. Your goal is to talk to the user and help them clarify the features for a web application they want to build. Ask clarifying questions, suggest features, and help them create a solid plan. Keep your responses concise and guide the conversation forward. Once you feel the plan is clear, confirm with the user if they are ready to generate the code. Keep in mind that this is for a future prompt.
"""

CODE_GEN_SYSTEM_PROMPT = """
You are an expert Full-Stack Developer with 25+ years of experience. Your task is to generate a complete, production-grade, and well-documented web application based on the provided conversation history.


The user and a project manager have already discussed the features. Your job is to read their entire conversation and build the application exactly as specified.
###You need to use CSS not tailwind and also you need to generate it inside the index.css file not in any other files and the website modren look like a webiste that goning to come look beautiful and naturally with that much styles and animations and make sure one more time everyting importted perfectly tis is very important

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
#### README.md
```markdown
// README content here
```
> All frontend-related files (e.g., `vite.config.ts`, `tsconfig.json`, `tailwind.config.cjs`, `index.html`, `package.json`) must be under the `frontend/` folder.  
> All backend files (e.g., `requirements.txt`, `main.py`, `pyproject.toml`) must be under the `backend/` folder.  
> No files should exist at the project root except the `README.md`.
---

1. **Folder Structure**: A markdown tree(include within README.md).
2. **Code Files**: All frontend and backend code. Use markdown headers for each file path (e.g., `#### path/to/file.ext`).
3. **README.md**: Complete setup and run instructions.(All readme content should use ... instead of ```).
"""

CODE_GEN_PLAN = {
    "Project Overview": (
        "Write the 'Project Overview' section as plain markdown text that will go INSIDE README.md. "
        "Do not output it as a separate file or with a 4-hash header."
    ),
    "Folder Structure": (
        "Write the complete 'Folder Structure' as a markdown code block inside README.md under the heading '## 📂 Folder Structure' and start body with ... instead of ```. "
        "Do not output it as a file or with a 4-hash header."
    ),
    "Code Files": (
        "Now, output all frontend and backend code files. Each code file MUST be in its own markdown block "
        "with a `#### path/to/file.ext` header. Ensure all imports work."
    ),
    "README.md": (
        "Finally, output the full README.md file as a single block, with '#### README.md' followed by the full markdown "
        "including 'Project Overview' and 'Folder Structure' inside it."
    ),
    "Validate Project": (
        "Double-check the project is complete and functional. Ensure all important files exist. "
        "Output the validation checklist in plain markdown, not as a file."
    )
}

import re

def parse_markdown_to_dict(markdown: str):
    file_pattern = r'####\s+(.+?)\s*\r?\n```[ \t]*([a-zA-Z0-9+\-_.]*)?\s*\r?\n([\s\S]*?)```'
    files = {}
    for match in re.finditer(file_pattern, markdown, re.DOTALL):
        raw_path = match.group(1).strip()
        path= raw_path.strip()  # Replace spaces with underscores for file paths
        # Ensure no accidental absolute paths or backslashes
        path = path.replace("\\", "/").lstrip("/")
        content = match.group(3).strip()
        files[path] = content
    return files


def extract_readme(markdown_output: str) -> str:
    """
    Extracts README.md contents from a markdown block:
    #### README.md
    ```markdown
    ...content...
    ```
    """
    pattern = r'####+\s*(?:🔹\s*)?README\.md\s*\r?\n([\s\S]*?)(?=\r?\n#+\s|\Z)'
    match = re.search(pattern, markdown_output, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""

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
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=history,
            temperature=0.7,
            max_tokens=100,
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

    chat_history = [
        {"role": "system", "content": CODE_GEN_SYSTEM_PROMPT},
        {"role": "user", "content":
            "Here is the full conversation history. Please generate the application based on this.\n\n" +
            "\n".join([f"{m['role']}: {m['content']}" for m in conversation_history if m['role'] != 'system'])
        }
    ]

    full_output = ""
    try:
        for section_title, section_task in CODE_GEN_PLAN.items():
            chat_history.append({"role": "user", "content": section_task})
            section_response = await client.chat.completions.create(
                model=AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=chat_history,
                temperature=0.2,
                max_tokens=10192,
            )
            section_response = section_response.choices[0].message.content
            logger.info(f"Generated section '{section_title}': {section_response}...")  # Log first 500 chars for debugging
            chat_history.append({"role": "assistant", "content": section_response})
            CONVERSATION_SESSIONS[request.session_id] = conversation_history + chat_history
            full_output += f"\n\n---\n## 🔹 {section_title}\n\n{section_response}"

    except Exception as e:
        logger.error(f"Error during generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during code generation: {str(e)}")

    return full_output

@app.post("/generate")
async def generate_code(
    request: GenerateRequest,
    supabase: AsyncClient = Depends(get_supabase)
):
    try:
        full_output = await run_code_generation(request)
        files_dict = parse_markdown_to_dict(full_output)
        readme_content = extract_readme(full_output)
        # Save outputs in session as before...

        # Save the generated code to Supabase
        await save_llm_output(
            session_id=request.session_id,
            llm_output={"full_markdown": full_output, "files": files_dict, "readme": readme_content},
            supabase=supabase
        )

        return Response(content=full_output, media_type='text/markdown')
    except Exception as e:
        logger.error(f"Error during generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/db-health")
async def db_health(supabase: AsyncClient = Depends(get_supabase)):
    try:
        result = await supabase.table("LLM").select("*").limit(1).execute()
        return {"status": "connected", "rows_returned": len(result.data)}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@app.post("/parse-text", response_model=ConversationResponse)
async def parse_text(request: ConversationRequest, supabase: AsyncClient = Depends(get_supabase)):
    print(f"Received request to parse text: {request.message} for session {request.session_id}")
    db_response = await get_llm_outputs(request.session_id, supabase)

    if not db_response:
        raise HTTPException(status_code=404, detail="No LLM outputs found for this session.")
    session_data = db_response[0].get("llm_output", {})
    if not session_data or "files" not in session_data or "readme" not in session_data:
        raise HTTPException(status_code=404, detail="Session or project not found.")
    llm_record = db_response[0]

    # Extract stored JSON output
    stored_llm_output = llm_record["llm_output"]
    print(f"Stored LLM output: {stored_llm_output}")
    readme_content = stored_llm_output.get("files").get("README.md", "") 
    if not readme_content:
        readme_content = stored_llm_output.get("files").get("readme", "")
    all_files = stored_llm_output.get("files")
    print(f"Stored README content: {readme_content}")
    print(f"Stored files: {all_files}")
    if not readme_content or not all_files:
        raise HTTPException(status_code=404, detail="Incomplete project data in database.")
    # Step 1: Ask AI which files to modify
    file_list_prompt = f"""
Project README.md:
{readme_content}

User request:
{request.message}

From the project files list below, identify exactly which file(s) should be modified:
{list(all_files.keys())}

Return only the file paths, one per line. No explanations.
"""

    # FIX — messages should be a list of dicts, not a raw string
    file_resp = await client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_NAME,
        messages=[
            {"role": "system", "content": "You are an AI that can read project context and identify relevant files."},
            {"role": "user", "content": file_list_prompt}
        ],
        temperature=0.2,
        max_tokens=500,
    )

    file_resp = file_resp.choices[0].message.content.strip()
    affected_files = [f.strip() for f in file_resp.splitlines() if f.strip() in all_files]

    if not affected_files:
        raise HTTPException(status_code=400, detail="Could not determine affected files.")

    # Step 2: Collect file contents for editing
    files_context = ""
    for fname in affected_files:
        file_content = all_files.get(fname, "")
        files_context += f"\n#### {fname}\n```{get_file_language(fname)}\n{file_content}\n```"
    # Step 3: Ask AI to edit the files
    edit_prompt = f"""
You are an expert full-stack developer.

Use the README.md below for full project context:
{readme_content}

The following is the current content of the file(s) that need modification:
{files_context}

User's change request:
{request.message}

Rules:
- Keep the file name exactly the same as per the directory.
- Only apply the requested changes and output the full file code.
- Preserve coding style, formatting, and imports from the existing file.
- Return the changed file(s) in this EXACT markdown format:

#### filename.ext
//updated content here

Additionally, after the code files, ALWAYS include a file named 'Work.txt' in EXACTLY the same markdown format as the other files, so it matches this template:

#### Work.txt
<A summary of what you changed, and any next steps or instructions for the user (e.g., "Get an API key and add it to .env", "Run npm install", etc.)>```
Rules for Work.txt:

Use "plaintext" after the triple backticks.
Do NOT skip the opening or closing triple backticks.
Do NOT add extra headings or text outside the fenced block.
This formatting is mandatory so the file is machine‑parsed.
"""

    edit_resp = await client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_NAME,
        messages=[
            {"role": "system", "content": "You are an expert full-stack developer who can modify project files based on user requests."},
            {"role": "user", "content": edit_prompt}
        ],
        temperature=0.2,
        max_tokens=5000,
    )

    edit_resp = edit_resp.choices[0].message.content.strip()
    updated_files = parse_markdown_to_dict(edit_resp)
    work_summary = updated_files.get("Work.txt")
    
    if work_summary:
        work_summary = work_summary.removeprefix("plaintext").lstrip()

    for fpath, content in updated_files.items():
        all_files[fpath] = content

    # Prepare updated llm_output dict
    updated_llm_output = {
        **stored_llm_output,
        "files": all_files,
    }

    # Update the record in Supabase by id
    await supabase.table("LLM").update({"llm_output": updated_llm_output}).eq("id", request.session_id).execute()


    return ConversationResponse(reply=edit_resp, session_id=request.session_id, work_summary=work_summary)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)