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
2. **Folder Structure**: A markdown tree.
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


@app.post("/parse-text", response_model=ConversationResponse)
async def parse_text(request: ConversationRequest):
    print("Parse text request:", request)
    if request.session_id not in CONVERSATION_SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")

    conversation_history = copy.deepcopy(CONVERSATION_SESSIONS[request.session_id])

    prompt = f"""
You are an expert full-stack developer and code reviewer aware of the entire project.

Here is the prior conversation history summarizing the project:
{chr(10).join([m['content'] for m in conversation_history if m['role'] != 'system'])}

The user now provides the following new input or change request:
{request.message}
Your task:
- Analyze the new input and decide which file(s) in the project need to be changed to reflect it.
- Provide the updated or corrected code for only those file(s).
- For each file, return the filename and the full corrected code (not partial lines).
- Respond in this EXACT markdown format for each file (only these sections, concatenated):


#### filename.ext
// full corrected code here

Return the response as a markdown string containing one or more such file sections.
"""

    try:
        response = await asyncio.to_thread(
            lambda: gemini_model.generate_content([
                {"role": "user", "parts": [prompt]}
            ])
        )
        print("Response from Gemini:", response.text)
        markdown_response = response.text.strip()
        return ConversationResponse(reply=markdown_response, session_id=request.session_id)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)