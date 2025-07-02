Here is a complete modular project for a student management system:

**Project Overview**
=====================

This project is a student management system built using React for the frontend and FastAPI for the backend. The system allows administrators to manage students, courses, and enrollments.

**Frontend Code**
===============

### `frontend/package.json`
```json
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

### `frontend/src/index.js`
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

### `frontend/src/App.js`
```jsx
// frontend/src/App.js
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StudentsPage from './pages/StudentsPage';
import CoursesPage from './pages/CoursesPage';
import EnrollmentsPage from './pages/EnrollmentsPage';

function App() {
  return (
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route path="/students" component={StudentsPage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/enrollments" component={EnrollmentsPage} />
    </Switch>
  );
}

export default App;
```

### `frontend/src/pages/HomePage.js`
```jsx
// frontend/src/pages/HomePage.js
import React from 'react';

function HomePage() {
  return <h1>Student Management System</h1>;
}

export default HomePage;
```

### `frontend/src/pages/StudentsPage.js`
```jsx
// frontend/src/pages/StudentsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StudentsPage() {
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
          <li key={student.id}>{student.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default StudentsPage;
```

### `frontend/src/pages/CoursesPage.js`
```jsx
// frontend/src/pages/CoursesPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CoursesPage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/courses')
      .then(response => {
        setCourses(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  return (
    <div>
      <h1>Courses</h1>
      <ul>
        {courses.map(course => (
          <li key={course.id}>{course.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default CoursesPage;
```

### `frontend/src/pages/EnrollmentsPage.js`
```jsx
// frontend/src/pages/EnrollmentsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/enrollments')
      .then(response => {
        setEnrollments(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  return (
    <div>
      <h1>Enrollments</h1>
      <ul>
        {enrollments.map(enrollment => (
          <li key={enrollment.id}>
            {enrollment.student.name} - {enrollment.course.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EnrollmentsPage;
```

**Backend Code**
===============

### `backend/main.py`
```python
# backend/main.py
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Student(BaseModel):
    id: int
    name: str

class Course(BaseModel):
    id: int
    name: str

class Enrollment(BaseModel):
    id: int
    student_id: int
    course_id: int

students = [
    Student(id=1, name='John Doe'),
    Student(id=2, name='Jane Doe'),
]

courses = [
    Course(id=1, name='Math'),
    Course(id=2, name='Science'),
]

enrollments = [
    Enrollment(id=1, student_id=1, course_id=1),
    Enrollment(id=2, student_id=1, course_id=2),
    Enrollment(id=3, student_id=2, course_id=1),
]

@app.get("/api/students")
async def get_students():
    return JSONResponse(content={"students": [student.dict() for student in students]})

@app.get("/api/courses")
async def get_courses():
    return JSONResponse(content={"courses": [course.dict() for course in courses]})

@app.get("/api/enrollments")
async def get_enrollments():
    return JSONResponse(content={"enrollments": [enrollment.dict() for enrollment in enrollments]})
```

**Database Schema**
=====================

### `database.sql`
```sql
-- database.sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students (id),
    FOREIGN KEY (course_id) REFERENCES courses (id)
);
```

**Setup Instructions**
=========================

1. Install Node.js and npm (if you haven't already)
2. Install Python and pip (if you haven't already)
3. Create a new directory for the project and navigate into it
4. Run `npm init` to create a `package.json` file
5. Run `npm install react react-dom react-router-dom axios` to install the frontend dependencies
6. Create a new directory for the frontend code and navigate into it
7. Create the frontend files as shown above
8. Run `pip install fastapi` to install the backend dependencies
9. Create a new directory for the backend code and navigate into it
10. Create the backend files as shown above
11. Run `python main.py` to start the backend server
12. Open a web browser and navigate to `http://localhost:3000` to access the frontend

**API Endpoints**
================

### `GET /api/students`

Returns a list of all students

### `GET /api/courses`

Returns a list of all courses

### `GET /api/enrollments`

Returns a list of all enrollments