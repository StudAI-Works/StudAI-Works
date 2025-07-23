"""
StudAI Works - AI Service
FastAPI service for code generation using Gemini 2.5
"""
import re
import json

def extract_json_from_llm(text: str):
    matches = re.findall(r"``````", text, re.DOTALL)
    if matches:
        json_str = matches[0].strip()
    else:
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            raise ValueError("No JSON found in model response")
    return json.loads(json_str)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from typing import Optional
import logging
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional
from fastapi import APIRouter
from typing import Dict

class AppSpecs(BaseModel):
    app_name: Optional[str] = None
    description: Optional[str] = None
    tech_stack_frontend: Optional[str] = None
    tech_stack_backend: Optional[str] = None
    database: Optional[str] = None
    main_features: Optional[List[str]] = None
    additional_notes: Optional[str] = None
# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="StudAI Works - AI Service",
    description="AI-powered code generation service",
    version="1.0.0"
)

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"GEMINI_API_KEY: {GEMINI_API_KEY}")  # Debugging line to check if key is loaded
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Request/Response models
class GenerateRequest(BaseModel):
    userInput: str
    specs: str = None  # Optional specs for context

class GenerateResponse(BaseModel):
    generatedPrompt: str
    generatedCode: str

def get_extraction_prompt(user_message: str, current_data: AppSpecs) -> str:
    prior = f"""Current gathered info (use these as defaults if user doesn't correct them):
{current_data.json(exclude_none=True)}

User message: "{user_message}"

Required fields (ask for missing): app_name, description, tech_stack_frontend, tech_stack_backend, database, main_features (as a list).
"""
    instruction = """
1. Parse the user message and extract any new or corrected info for these fields.
2. Return a JSON with all known fields filled.
3. Identify missing fields.
4. If any required fields remain missing, set "got_information" to false and write a short message asking the user *only* for those fields.
5. Otherwise, set "got_information" to true and return a message confirming readiness to proceed.

Format:
{
  "app_name": "...",
  "description": "...",
  "tech_stack_frontend": "...",
  "tech_stack_backend": "...",
  "database": "...",
  "main_features": ["...", "..."],
  "additional_notes": "...",
  "got_information": true/false,
  "followup": "Message to user"
}

Do not ask about fields that are already filled in unless the user changed them.
"""
    return prior + instruction

def create_meta_prompt(user_input: str) -> str:
    """
    Convert raw user input into a detailed, structured prompt for Gemini.
    This version improves reliability of required files and structure.
    """
    meta_prompt = f"""
You are an expert Full-Stack Developer and AI/ML Prompt Engineer with 15+ years of experience in building production-grade applications.

---

**🧠 Task**: Build a complete full-stack application based on the user's request:  
➡️ "{user_input}"

---

**📦 Folder Structure Guidelines**:
- All projects must include these root folders:
  - `frontend/` for all client-side code
  - `backend/` for all server-side code
- Within `frontend/src/`, you MUST include:
  - `App.tsx`, `index.tsx`, and a **global stylesheet** named `styles.css`

---

**📄 Required Files**:
- `frontend/src/styles.css`: Global stylesheet. Must always be created (even with minimal content).
- `frontend/src/index.tsx`: Must import `./styles.css`
- Ensure use of `.tsx` files for React components (no `.js` unless necessary)
- Include `package.json` files in both frontend and backend if dependencies exist.
- All imported files (e.g., `import X from './components/X'`) MUST be defined as actual code blocks with matching file paths.
- Missing or broken import paths are NOT allowed.

---

**🛠️Default Tech Stack**:
- Frontend: TypeScript, React, HTML5, CSS3
- Backend: Node.js with Express OR Python with FastAPI (based on use-case)
- Database: PostgreSQL, SQLite or NoSQL depending on app type
- Use clean, modular architecture with folders and reusable components
- Ensure error handling and API validation is included

---

**📂 Response Format**:
1. ✅ **Project Overview** - A short description of what the app does
2. 📁 **File Structure** - Tree view of folders and files
3. 🔢 **Code Blocks** - Each block MUST begin with a file path comment:
   - For TS/JS/CSS: `// path: frontend/src/styles.css`
   - For Python: `# path: backend/api/main.py`
   - For config: `// path: package.json`
4. 🚀 **Setup Instructions** - Clear steps to install and run the app
Each code block MUST begin exactly with a file path comment line as the first line inside the block:
**IMPORTANT:**  
- Use triple backticks (```) to start and end each code block.  
- The path comment must be the **very first line** inside the triple backticks, with no leading spaces or blank lines.  
- This format is strictly enforced to allow precise parsing.
---

**💡 Example for styles.css (must always include at least this):**
"""
    meta_prompt += """
```css
// path: frontend/src/styles.css
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}"""

    
    return meta_prompt

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "StudAI Works AI Service is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test Gemini API connection
        test_response = model.generate_content("Hello")
        return {
            "status": "healthy",
            "service": "StudAI Works AI Service",
            "gemini_api": "connected",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/generate", response_model=GenerateResponse)
async def generate_code(request: GenerateRequest):
    """
    Main endpoint to generate code from user input
    """
    try:
        logger.info(f"Received request: {request.userInput}")
        
        # Validate input
        if not request.userInput or len(request.userInput.strip()) < 10:
            raise HTTPException(
                status_code=400, 
                detail="User input must be at least 10 characters long"
            )
        
        # Create structured prompt
        detailed_prompt = create_meta_prompt(request.userInput)
        logger.info("Generated meta-prompt for Gemini")
        detailed_prompt += f"\n\nUser specs: {request.specs}" if request.specs else ""
        # Call Gemini API
        try:
            response = model.generate_content(detailed_prompt)
            generated_code = response.text
            logger.info("Successfully received response from Gemini")
            
        except Exception as gemini_error:
            logger.error(f"Gemini API error: {str(gemini_error)}")
            raise HTTPException(
                status_code=503,
                detail=f"AI service temporarily unavailable: {str(gemini_error)}"
            )
        
        # Validate response
        if not generated_code:
            raise HTTPException(
                status_code=500,
                detail="AI service returned empty response"
            )
        
        # Return structured response
        return GenerateResponse(
            generatedPrompt=detailed_prompt,
            generatedCode=generated_code
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_code: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

spec_sessions: Dict[str, AppSpecs] = {}
router = APIRouter()
class SpecChatRequest(BaseModel):
    user_message: str

@router.post("/spec-chat")
async def spec_chat(request: SpecChatRequest):
    user_id = 1
    user_message = request.user_message
    print("Hello from spec_chat")
    session = spec_sessions.get(user_id, AppSpecs())
    print(f"Current session for user {user_id}: {session}")
    prompt = get_extraction_prompt(user_message, session)
    try:
        response = model.generate_content(prompt)
        response = model.generate_content(prompt)
        result = extract_json_from_llm(response.text)
    except Exception as e:
        logger.error(f"Error parsing LLM response: {e}")
        raise HTTPException(500, f"Error parsing AI response: {str(e)}")
    # Convert empty dicts to None for Pydantic compatibility
    def clean_value(val):
        # Recursively handle nested lists/dicts if needed in future
        if val == {}:
            return None
        return val

    updated = AppSpecs(**{field: clean_value(result.get(field)) for field in AppSpecs.model_fields.keys()})
    spec_sessions[user_id] = updated

    return {
     "specs": updated.model_dump(),
     "got_information": result.get("got_information", False),
     "followup": result.get("followup", "Please provide more details."),
 }
    

@app.post("/generate-simple")
async def generate_simple(request: GenerateRequest):
    """
    Simplified endpoint for quick testing
    """
    try:
        simple_prompt = f"Create a simple web application for: {request.userInput}. Include HTML, CSS, and JavaScript code."
        
        response = model.generate_content(simple_prompt)
        
        return {
            "userInput": request.userInput,
            "generatedCode": response.text,
            "prompt": simple_prompt
        }
        
    except Exception as e:
        logger.error(f"Error in generate_simple: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
app.include_router(router)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
