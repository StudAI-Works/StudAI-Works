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
    Convert raw user input into a detailed, structured prompt for Gemini
    """
    meta_prompt = f"""You are an expert Full-Stack Developer and AI/ML Prompt Engineer with 15+ years of experience in web development, specializing in creating production-ready applications.

**Task**: Generate a complete, functional full-stack application based on the user's request: "{user_input}"

**Context**: 
- Create a modern, responsive web application
- Include both frontend and backend components
- Use industry best practices and clean code principles
- Ensure the application is production-ready with proper error handling
- Include database schema if data storage is needed

**Technical Requirements**:
- Frontend: Use modern HTML5, CSS3, JavaScript (ES6+), and responsive design
- Backend: Use Node.js with Express.js or Python with FastAPI
- Database: Use appropriate database (SQL/NoSQL) based on requirements
- Include proper API endpoints and routing
- Add input validation and error handling
- Include basic authentication if user management is needed

**Format**: Structure your response with clear markdown sections:
1. **Project Overview** - Brief description and features
2. **Database Schema** - If applicable, include table structures
3. **Backend Code** - API endpoints, routes, and server logic
4. **Frontend Code** - HTML, CSS, and JavaScript
5. **Setup Instructions** - How to run the application
6. **API Documentation** - Endpoint descriptions and usage examples

**Code Quality Standards**:
- Write clean, well-commented code
- Use proper naming conventions
- Include error handling and validation
- Make code modular and reusable
- Follow security best practices

**Tone**: Technical, professional, and comprehensive. Provide complete working code that can be immediately implemented.

Generate the complete application code now:"""

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