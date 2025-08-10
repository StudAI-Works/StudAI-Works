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
import google.generativeai as genai
import re
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
        "py": "python"
    }.get(ext, "")
# --- Gemini Client Setup ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY environment variable not set.")
genai.configure(api_key=GOOGLE_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")


# --- In-Memory Session Storage ---
CONVERSATION_SESSIONS = {}

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
> | const useAppStore = create<AppState>((set) => ({
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


1. **Project Overview**: A high-level description based on the conversation.
2. **Folder Structure**: A markdown tree(Always include in README.md).
3. **Code Files**: All frontend and backend code. Use markdown headers for each file path (e.g., `#### path/to/file.ext`).
4. **README.md**: Complete setup and run instructions.
"""


CODE_GEN_PLAN = {
"Project Overview": "First, provide the 'Project Overview'. Summarize the app's features based on the entire conversation history.",
"Folder Structure": "Next, generate the complete 'Folder Structure' in a markdown tree format.",
"Code Files": "Now, generate all the code files (Frontend and Backend). Ensure each file is in its own markdown block with a `#### path/to/file.ext` header as well as make sure to include all files like index etc so that no import fails as well as make sure of having all necessary libraries in the package.json for frontend.",
"README.md": "Finally, create the `README.md` file with complete setup instructions. and dont use #### the four # header inside the readme",
"Validate Project": "Finally, double-check that the project is complete and functional. Ensure all important files exist (vite.config.ts, index.html(including the initialisation of tsx in it if necessary), package.json(recheck if all imports are included), tailwind.config.js in frontend; server.ts or main.py and requirements.txt in backend). Check that the README covers everything necessary to run the project. Then confirm that this app should build and run end-to-end without errors. Respond with your validation checklist and a final confirmation message."
}
import re
def parse_markdown_to_dict(markdown: str):
    """
    Extracts code files from markdown output in format:
    #### path/to/file.ext
    ```<optional lang>
    ...content...
    ```
    Returns dict: {file_path: content}
    """
    # Matches: #### filename\n```[optional lang]\n(content)\n```
    file_pattern = r'#### (.+?)\s*\n```(?:[a-zA-Z0-9]*)\s*\n([\s\S]*?)```'
    files = {}
    for match in re.finditer(file_pattern, markdown, re.DOTALL):
        path, content = match.groups()
        files[path.strip()] = content.strip()
    return files

def extract_project_summary(markdown: str):
    """
    Pull Project Overview section from markdown output.
    Looks for "## 🔹 Project Overview" ... until next "---"
    """
    summary_re = r'## 🔹 Project Overview\s*\n([\s\S]*?)(?:\n---|\Z)'
    m = re.search(summary_re, markdown, re.DOTALL)
    if m:
        return m.group(1).strip()
    return ""

def extract_readme(markdown_output: str) -> str:
    """
    Extracts README.md content from markdown output formatted like:
    #### README.md
    ```markdown
    ...content...
    ```
    """
    pattern = r"#### README\.md\s+```(?:markdown)?\s*([\s\S]*?)```"
    match = re.search(pattern, markdown_output, re.DOTALL)
    print(match)
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


    # Prepare messages for Gemini
    gemini_history = []
    for m in history:
        if m["role"] == "system":
            gemini_history.append({"role": "user", "parts": [m["content"]]})
        elif m["role"] == "assistant":
            gemini_history.append({"role": "model", "parts": [m["content"]]})
        else:
            gemini_history.append({"role": "user", "parts": [m["content"]]})


    try:
        response = await asyncio.to_thread(
            lambda: gemini_model.generate_content(gemini_history)
        )
        reply = response.text
        history.append({"role": "assistant", "content": reply})
        CONVERSATION_SESSIONS[request.session_id] = history
        return ConversationResponse(reply=reply, session_id=request.session_id)
    except Exception as e:
        logger.error(f"Error during refinement: {e}")
    raise HTTPException(status_code=500, detail="AI conversation failed.")


# New function: Non-streamed generation
async def run_code_generation(request: GenerateRequest) -> str:
    if request.session_id not in CONVERSATION_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found to generate code from.")


    conversation_history = copy.deepcopy(CONVERSATION_SESSIONS[request.session_id])


    # Prepare messages for Gemini
    gemini_history = [
        {"role": "user", "parts": [CODE_GEN_SYSTEM_PROMPT]},
        {"role": "user", "parts": [
            "Here is the full conversation history. Please generate the application based on this.\n\n" +
            "\n".join([f"{m['role']}: {m['content']}" for m in conversation_history if m['role'] != 'system'])
        ]}
    ]


    full_output = ""
    try:
        for section_title, section_task in CODE_GEN_PLAN.items():
            gemini_history.append({"role": "user", "parts": [section_task]})


            response = await asyncio.to_thread(
                lambda: gemini_model.generate_content(gemini_history)
            )


            section_response = response.text
            gemini_history.append({"role": "model", "parts": [section_response]})

            
            CONVERSATION_SESSIONS[request.session_id] = conversation_history + gemini_history
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
        files_dict = parse_markdown_to_dict(full_output)
        summary = extract_project_summary(full_output)
        readme_content = extract_readme(full_output)
        # Always store session as a dict
        old_session = CONVERSATION_SESSIONS.get(request.session_id)
        if isinstance(old_session, dict):
            session = old_session
        else:
            session = {}
        session["files"] = files_dict
        session["summary"] = summary
        session["readme"] = readme_content
        session["full_markdown"] = full_output
        CONVERSATION_SESSIONS[request.session_id] = session
        return Response(content=full_output, media_type='text/markdown')
    except Exception as e:
        logger.error(f"Error during generation: {str(e)}")
        logger.error(f"Error during generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-text", response_model=ConversationResponse)
async def parse_text(request: ConversationRequest):
    session_data = CONVERSATION_SESSIONS.get(request.session_id)
    if not session_data or "files" not in session_data or "readme" not in session_data:
        raise HTTPException(status_code=404, detail="Session or project not found.")

    readme_content = session_data["readme"]
    print(f"Using README content for session {request.session_id}:\n{readme_content[:100]}...")  # Log first 100 chars
    all_files = session_data["files"]
    print(f"Parsing text for session {request.session_id} with {len(all_files)} files.")
    # STEP 1: Figure out affected file(s)
    file_list_prompt = f"""
Project README.md:
{readme_content}

User request:
{request.message}

From the project files list below, identify exactly which file(s) should be modified:
{list(all_files.keys())}

Return only the file paths, one per line. No explanations.
"""
    files_resp = await asyncio.to_thread(
        lambda: gemini_model.generate_content([{"role": "user", "parts": [file_list_prompt]}])
    )
    affected_files = [f.strip() for f in files_resp.text.splitlines() if f.strip() in all_files]

    if not affected_files:
        raise HTTPException(status_code=400, detail="Could not determine affected files.")
    print(f"Affected files for session {request.session_id}: {affected_files}")
    # STEP 2: Give LLM README + only relevant file(s)
    files_context = ""
    for fname in affected_files:
        file_content = all_files.get(fname, "")
        files_context += f"\n#### {fname}\n```{get_file_language(fname)}\n{file_content}\n```\n"
    print(f"Files context for session {request.session_id}:\n{files_context}...")  # Log first 1000 chars
    edit_prompt = f"""
You are an expert full-stack developer.

Use the README.md below for full project context:
{readme_content}

The following is the current content of the file(s) that need modification:
{files_context}

User's change request:
{request.message}

Rules:
- Keep the file name exactly the same.
- Only apply the requested changes.
- Preserve coding style, formatting, and imports from the existing file.
- Return the changed file(s) in this EXACT markdown format:

#### filename.ext
//updated content here
"""
    edit_resp = await asyncio.to_thread(
        lambda: gemini_model.generate_content([{"role": "user", "parts": [edit_prompt]}])
    )

    updated_files = parse_markdown_to_dict(edit_resp.text)
    for fpath, content in updated_files.items():
        all_files[fpath] = content
    session_data["files"] = all_files
    CONVERSATION_SESSIONS[request.session_id] = session_data

    return ConversationResponse(reply=edit_resp.text.strip(), session_id=request.session_id)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)