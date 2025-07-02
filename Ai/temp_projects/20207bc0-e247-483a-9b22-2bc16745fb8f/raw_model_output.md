Here is the complete modular project for a student management system:

**Project Overview**
```
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
// frontend/src/App.jsx
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';

function App() {
  return (
    <Switch>
      <Route path="/" exact component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/students/:id" component={StudentDetail} />
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/token', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.access_token);
      window.location.href = '/dashboard';
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <br />
        <label>
          Password:
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <br />
        <button type="submit">Login</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const response = await axios.get('http://localhost:8000/api/students');
      setStudents(response.data);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  return (
    <div>
      <h1>Students</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {students.map((student) => (
            <li key={student.id}>
              <a href={`/students/${student.id}`}>{student.name}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Students;
```

```jsx
// frontend/src/pages/StudentDetail.jsx
import React from 'react';
import axios from 'axios';

function StudentDetail({ match }) {
  const [student, setStudent] = useState({});

  useEffect(() => {
    const fetchStudent = async () => {
      const response = await axios.get(`http://localhost:8000/api/students/${match.params.id}`);
      setStudent(response.data);
    };
    fetchStudent();
  }, [match.params.id]);

  return (
    <div>
      <h1>{student.name}</h1>
      <p>Grade: {student.grade}</p>
      <p>Age: {student.age}</p>
    </div>
  );
}

export default StudentDetail;
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
from fastapi import FastAPI
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String

app = FastAPI()

engine = create_engine('sqlite:///student_management_system.db')
Session = sessionmaker(bind=engine)
Base = declarative_base()

class Student(Base):
    __tablename__ = 'students'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    grade = Column(Integer)
    age = Column(Integer)

Base.metadata.create_all(engine)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')

@app.post('/api/token')
async def login(username: str, password: str):
    # todo: implement authentication logic
    return {'access_token': 'fake_token'}

@app.get('/api/students')
async def get_students(token: str = Depends(oauth2_scheme)):
    session = Session()
    students = session.query(Student).all()
    return [{'id': student.id, 'name': student.name, 'grade': student.grade, 'age': student.age} for student in students]

@app.get('/api/students/{id}')
async def get_student(id: int, token: str = Depends(oauth2_scheme)):
    session = Session()
    student = session.query(Student).filter_by(id=id).first()
    if student:
        return {'id': student.id, 'name': student.name, 'grade': student.grade, 'age': student.age}
    else:
        return JSONResponse(status_code=404, content={'error': 'Student not found'})
```

**Database Schema**
```sql
// backend/schema.sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grade INTEGER NOT NULL,
    age INTEGER NOT NULL
);
```

**Setup Instructions**
```
// setup instructions
1. Install Node.js and Python on your system.
2. Create a new directory for the project and navigate into it.
3. Run `npm init` and follow the prompts to create a `package.json` file.
4. Run `npm install react react-dom react-router-dom axios` to install frontend dependencies.
5. Create a new directory `frontend` and navigate into it.
6. Run `npx create-react-app .` to create a new React app.
7. Create a new directory `backend` and navigate into it.
8. Run `pip install fastapi uvicorn sqlalchemy` to install backend dependencies.
9. Create a new file `main.py` and add the backend code.
10. Create a new file `schema.sql` and add the database schema.
11. Run `uvicorn main:app --reload` to start the backend server.
12. Run `npm start` to start the frontend server.
13. Open `http://localhost:3000` in your browser to access the student management system.
```

**API Endpoints**
```
GET /api/students
GET /api/students/{id}
POST /api/token
```