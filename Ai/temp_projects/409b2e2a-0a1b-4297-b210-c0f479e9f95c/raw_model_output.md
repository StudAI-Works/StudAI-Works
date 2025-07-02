Here is the complete modular project for a student management system:

**Project Overview**
```txt
Student Management System
=========================

A multi-page SPA built with React for frontend and FastAPI for backend.
```

**Frontend Code**

```jsx
// frontend/package.json
{
  "name": "student-management-system-frontend",
  "version": "0.1.0",
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-router-dom": "^5.2.0",
    "axios": "^0.21.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}
```

```jsx
// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
```

```jsx
// frontend/src/App.js
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetails from './pages/StudentDetails';

function App() {
  return (
    <Switch>
      <Route path="/" exact component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/students/:id" component={StudentDetails} />
    </Switch>
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
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/login', { username, password });
      localStorage.setItem('token', response.data.token);
      window.location.href = '/dashboard';
    } catch (error) {
      setError(error.response.data.error);
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
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </div>
  );
}

export default Login;
```

```jsx
// frontend/src/pages/Dashboard.jsx
import React from 'react';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the student management system!</p>
    </div>
  );
}

export default Dashboard;
```

```jsx
// frontend/src/pages/Students.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Students() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/students')
      .then(response => {
        setStudents(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  return (
    <div>
      <h1>Students</h1>
      <ul>
        {students.map(student => (
          <li key={student.id}>
            <a href={`/students/${student.id}`}>{student.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Students;
```

```jsx
// frontend/src/pages/StudentDetails.jsx
import React from 'react';
import axios from 'axios';

function StudentDetails({ match }) {
  const [student, setStudent] = useState({});

  useEffect(() => {
    axios.get(`http://localhost:8000/api/students/${match.params.id}`)
      .then(response => {
        setStudent(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, [match.params.id]);

  return (
    <div>
      <h1>{student.name}</h1>
      <p>Grade: {student.grade}</p>
      <p>Age: {student.age}</p>
    </div>
  );
}

export default StudentDetails;
```

**Backend Code**

```python
// backend/requirements.txt
fastapi
uvicorn
sqlalchemy
```

```python
// backend/main.py
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models, schemas
from .database import engine, get_db

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/api/login")
async def login(username: str, password: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not user.verify_password(password):
        return {"error": "Invalid credentials"}
    return {"token": user.generate_token()}

@app.get("/api/students")
async def get_students(db: Session = Depends(get_db)):
    students = db.query(models.Student).all()
    return [{"id": student.id, "name": student.name, "grade": student.grade, "age": student.age} for student in students]

@app.get("/api/students/{id}")
async def get_student(id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == id).first()
    if not student:
        return {"error": "Student not found"}
    return {"id": student.id, "name": student.name, "grade": student.grade, "age": student.age}
```

```python
// backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///student_management_system.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

```python
// backend/models.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password = Column(String)

    def verify_password(self, password):
        return self.password == password

    def generate_token(self):
        return "token-" + str(self.id)

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    grade = Column(Integer)
    age = Column(Integer)
```

**Database Schema**

```sql
-- schema.sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(100)
);

CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    grade INTEGER,
    age INTEGER
);
```

**Setup Instructions**

1. Run `pip install -r backend/requirements.txt` to install backend dependencies.
2. Run `python backend/main.py` to start the backend server.
3. Run `npm install` to install frontend dependencies.
4. Run `npm start` to start the frontend server.
5. Open `http://localhost:3000` in your browser to access the student management system.

**API Endpoints**

1. `POST /api/login`: Login with username and password.
2. `GET /api/students`: Get a list of all students.
3. `GET /api/students/{id}`: Get a student by ID.