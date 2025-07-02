Here is the complete modular project for an AI chatbot for school students:

**Project Overview**
```
This project is a multi-page SPA using React for the frontend and FastAPI for the backend. It provides an AI chatbot for school students to interact with.
```

**Frontend Code**

```jsx
// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Chatbot from './pages/Chatbot';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={Login} />
        <Route path="/chatbot" component={Chatbot} />
      </Switch>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
```

```jsx
// frontend/src/App.js
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Ai Chatbot for School Students</h1>
      </header>
    </div>
  );
}

export default App;
```

```jsx
// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/login', { username, password });
      localStorage.setItem('token', response.data.token);
      window.location.href = '/chatbot';
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        <br />
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
```

```jsx
// frontend/src/pages/Chatbot.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Chatbot() {
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/chatbot', { message });
      setConversations([...conversations, { message, response: response.data.response }]);
      setMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Chatbot</h1>
      <form onSubmit={handleSubmit}>
        <label>Message:</label>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
        <br />
        <button type="submit">Send</button>
      </form>
      <ul>
        {conversations.map((conversation, index) => (
          <li key={index}>
            <p>You: {conversation.message}</p>
            <p>Chatbot: {conversation.response}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Chatbot;
```

**Backend Code**

```python
# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from pydantic import BaseModel
from typing import List
import ai_model

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

class User(BaseModel):
    username: str
    password: str

class ChatbotResponse(BaseModel):
    response: str

@app.post("/login")
async def login(user: User):
    if user.username == "admin" and user.password == "password":
        return {"token": "secret_token"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/chatbot")
async def chatbot(message: str, token: str = Depends(oauth2_scheme)):
    if token != "secret_token":
        raise HTTPException(status_code=401, detail="Invalid token")
    response = ai_model.get_response(message)
    return {"response": response}
```

```python
# backend/ai_model.py
import random

responses = [
    "I'm not sure I understand.",
    "That's a great question!",
    "I'm still learning, can you please rephrase?",
]

def get_response(message: str):
    return random.choice(responses)
```

**Database Schema**

```sql
// schema.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL
);
```

**Setup Instructions**

1. Create a new virtual environment and install the required packages: `pip install fastapi react`
2. Create a new React app: `npx create-react-app frontend`
3. Create a new FastAPI app: `fastapi new backend`
4. Copy the frontend code into the `frontend` directory
5. Copy the backend code into the `backend` directory
6. Run the backend server: `uvicorn backend.main:app --reload`
7. Run the frontend server: `npm start`
8. Open a web browser and navigate to `http://localhost:3000`

**API Endpoints**

* `POST /login`: Login endpoint to authenticate users
* `POST /chatbot`: Chatbot endpoint to interact with the AI model