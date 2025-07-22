"""
StudAI Works - AI Service
FastAPI service for code generation using Azure OpenAI (GPT-4 Turbo)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional
import logging
from dotenv import load_dotenv
import openai   
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="StudAI Works - AI Service",
    description="AI-powered code generation service using Azure OpenAI",
    version="2.0.0"
)

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Azure OpenAI configuration
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")  # Deployment name from Azure OpenAI Studio
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")

if not all([AZURE_OPENAI_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME, AZURE_OPENAI_API_VERSION]):
    raise ValueError("Missing Azure OpenAI configuration in environment variables")

# Azure OpenAI Configuration (Updated for GPT-4.1)


openai.api_key = AZURE_OPENAI_KEY
openai.api_base = AZURE_OPENAI_ENDPOINT  # Just the base URL
openai.api_type = "azure"
openai.api_version = AZURE_OPENAI_API_VERSION

def get_completion_with_continuation(user_input: str, initial_prompt: str, previous_response: str = "") -> str:
    messages = [
        {"role": "system", "content": "You are an expert software developer with a focus on clean, production-ready code."},
        {"role": "user", "content": initial_prompt if not previous_response else f"{previous_response}\n[CONTINUE]"}
    ]
    completion = openai.ChatCompletion.create(
        engine=AZURE_OPENAI_DEPLOYMENT_NAME,
        messages=messages,
        temperature=0.3,
        max_tokens=8192,  # Set to a high value within your deployment's limit
        top_p=0.9,
        frequency_penalty=0.1,
        presence_penalty=0.1
    )
    return completion.choices[0].message["content"]

# Request/Response models
class GenerateRequest(BaseModel):
    userInput: str

class GenerateResponse(BaseModel):
    generatedPrompt: str
    generatedCode: str

def create_meta_prompt(user_input: str) -> str:
    meta_prompt = f"""
You are an expert Full-Stack Developer and AI/ML Prompt Engineer with 25+ years of experience. Your task is to generate **production-ready, complex, and well-documented** code for a full-stack application based on the user's request: "{user_input}"

---

### 📋 Requirements
- **Objective**: Build a modular, scalable, and maintainable full-stack application.
- **Tech Stack**:
  - Use vite unless anything else specified previously
  - **Frontend**: React (TypeScript) with Tailwind CSS and save postcssconfig as a cjs file or Material-UI for styling, React Router for navigation, and Zustand or Redux Toolkit for state management.
  - **Backend**: Python FastAPI with Pydantic for validation, SQLAlchemy with PostgreSQL for ORM, or Node.js with Express and TypeORM.
  - **Database**: PostgreSQL (preferred) or MongoDB for NoSQL use cases.
  - **Additional Features**: Include authentication (JWT or OAuth2), error handling, logging, and unit tests with pytest (Python) or Jest (Node.js).
  - Make sure to include package.json with all dependencies like libraries or vite etc, and keep on updating in based on imports in files so that there is no error when i run npm install
  - Also make sure that the index.html is complete and not empty without proper calls to files like main.tsx or any other as necessary and keep it in the root folder
- **Code Quality**:
  - Write clean, modular, and reusable code adhering to best practices (e.g., DRY, SOLID principles).
  - Include detailed comments explaining key logic and design decisions.
  - Ensure no broken imports or missing dependencies.
  - Provide a complete folder structure with all necessary files.
- **Constraints**:
  - Use `.tsx` for React components.
  - Ensure all imported files exist in the provided folder structure.
  - Include a `README.md` with setup and usage instructions.

### 📂 Response Format
1. **✅ Project Overview**: Describe the application’s purpose, features, and architecture (e.g., REST API, SPA).
2. **📁 Folder Structure**: Show the complete file structure as a markdown tree.
3. **🔢 Code Blocks**: For each file:
   - Use a markdown header like `#### path/to/file`.
   - Provide a code block with the correct language identifier (e.g., ```typescript, ```python
   - Ensure the code is syntactically correct, complete, and production-ready.
   - Include comments for clarity.
4. **🚀 Setup Instructions**: Provide step-by-step commands to install dependencies, set up the database, and run the application.
5. **🧪 Testing Instructions**: Include example unit tests and how to run them.
6. **📝 Notes**: Highlight any assumptions or additional features.

### 🛑 Handling Large Responses
- If the response exceeds token limits, end with `[CONTINUE]` and complete the remaining content in the next section when prompted.
- Ensure continuity by referencing the previous response’s content.

### 🧠 Example
For a request like "a task management app," generate:
- A React frontend with components for task creation, listing, and filtering.
- A FastAPI backend with CRUD endpoints for tasks and user authentication.
- A PostgreSQL schema with tables for users and tasks.
- Unit tests for key backend routes and frontend components.

Now, generate the complete application for: "{user_input}"
"""
    return meta_prompt

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

# Update the /generate route logic with enhanced debugging:
@app.post("/generate", response_model=GenerateResponse)
@retry(retry=retry_if_exception_type(openai.error.OpenAIError), stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def generate_code(request: GenerateRequest):
    try:
        if not request.userInput or len(request.userInput.strip()) < 10:
            raise HTTPException(status_code=400, detail="Input too short")

        detailed_prompt = create_meta_prompt(request.userInput)
        logger.info(f"Sending structured prompt to Azure: {request.userInput}")

        # Initial call
        generated_code = get_completion_with_continuation(request.userInput, detailed_prompt)
        full_response = generated_code

        logger.debug(f"Initial response (first 500 chars): {full_response[:500]}...")  # Log initial response

        # Continue if [CONTINUE] is detected
        while "[CONTINUE]" in full_response:
            logger.info("Detected truncation, continuing response...")
            generated_code = get_completion_with_continuation(request.userInput, detailed_prompt, full_response)
            full_response = full_response.replace("[CONTINUE]", "") + generated_code
            logger.debug(f"Continued response (first 500 chars): {full_response[:500]}...")  # Log after each continuation

        # Enhanced validation with detailed logging
        logger.debug(f"Final response (first 1000 chars): {full_response[:1000]}...")  # Log final response
        if not full_response:
            logger.warning("Response is empty")
            raise HTTPException(status_code=500, detail="Generated code is empty")
        # if "✅ Project Overview" not in full_response:
        #     logger.warning("Missing '✅ Project Overview' marker")
        #     logger.debug(f"Full response for debug: {full_response}")  # Log full response on failure
        if "####" not in full_response:
            logger.warning("Missing '####' header marker")
            logger.debug(f"Full response for debug: {full_response}")  # Log full response on failure
        # if "✅ Project Overview" not in full_response or "####" not in full_response:
        #     raise HTTPException(status_code=500, detail="Generated code format invalid")

        return GenerateResponse(
            generatedPrompt=detailed_prompt,
            generatedCode=full_response
        )

    except Exception as e:
        logger.error(f"Error in /generate: {str(e)}")
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