### Clone respository
```
git clone https://github.com/StudAI-Works/StudAI-Works
```

### To Start Frontend
```bash
cd frontend
npm run dev
```
### To Start Backend
```bash
cd backend
npm run dev
```
### To Start Ai
- You need to install the packages in requirements.txt and also need to create an environment
- For windows
```bash
  python -m venv myvenv
  cd myvenv\Scripts\activate
```
- For linux
```bash
  python -m venv myvenv
  cd myvenv\Scripts
  source activate
```
- Start the file
```bash
cd Ai
python main.py
```
## Project Structure & Tech Stack

### 🖥️ Frontend
- **Framework:** React.js
- **Language:** TypeScript
- **Styling:** Tailwind CSS

### ⚙️ Backend
- **Framework:** Express.js (Node.js)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Client Library:** `@supabase/supabase-js`

### 🤖 AI Layer
- **Framework:** Python (FastAPI)
- **Orchestration:** LangChain
- **LLMs Used:** GPT-4, Gemini Pro, Claude 3 *(simplified to a single model for MVP)*

### ☁️ Cloud & DevOps
- **Cloud Provider:** Microsoft Azure
- **Containerization:** Docker
- **Infrastructure as Code:** Terraform
- **CI/CD:** GitHub Actions
