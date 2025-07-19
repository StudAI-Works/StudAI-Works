"""
StudAI Works - AI Service
FastAPI service for code generation using Gemini 2.5
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from typing import Optional
import logging
from dotenv import load_dotenv

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

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Request/Response models
class GenerateRequest(BaseModel):
    userInput: str

class GenerateResponse(BaseModel):
    generatedPrompt: str
    generatedCode: str


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

**🛠️ Tech Stack**:
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )