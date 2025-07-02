Here is a complete modular project for a student management system:

**Project Overview**
=====================

This project is a student management system built using React for the frontend and FastAPI for the backend. The system allows administrators to manage students, courses, and enrollments.

**Frontend Code**
================

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
import App from './App';
import { BrowserRouter } from 'react-router-dom';

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
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Enrollments from './pages/Enrollments';

function App() {
  return (
    <Switch>
      <Route path="/" exact component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/courses" component={Courses} />
      <Route path="/enrollments" component={Enrollments} />
    </Switch>
  );
}

export default App;
```

### `frontend/src/pages/Dashboard.jsx`
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

### `frontend/src/pages/Students.jsx`
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
          <li key={student.id}>{student.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Students;
```

### `frontend/src/pages/Courses.jsx`
```jsx
// frontend/src/pages/Courses.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Courses() {
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

export default Courses;
```

### `frontend/src/pages/Enrollments.jsx`
```jsx
// frontend/src/pages/Enrollments.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Enrollments() {
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

export default Enrollments;
```

**Backend Code**
================

### `backend/main.py`
```python
# backend/main.py
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi.encoders import jsonable_encoder
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
    Student(id=1, name="John Doe"),
    Student(id=2, name="Jane Doe")
]

courses = [
    Course(id=1, name="Math"),
    Course(id=2, name="Science")
]

enrollments = [
    Enrollment(id=1, student_id=1, course_id=1),
    Enrollment(id=2, student_id=1, course_id=2),
    Enrollment(id=3, student_id=2, course_id=1)
]

@app.get("/api/students")
async def read_students():
    return JSONResponse(content=jsonable_encoder(students), media_type="application/json")

@app.get("/api/courses")
async def read_courses():
    return JSONResponse(content=jsonable_encoder(courses), media_type="application/json")

@app.get("/api/enrollments")
async def read_enrollments():
    return JSONResponse(content=jsonable_encoder(enrollments), media_type="application/json")
```

**Database Schema**
=====================

The database schema is a simple relational database with three tables: `students`, `courses`, and `enrollments`.

### `students` table
| Column Name | Data Type | Description |
| --- | --- | --- |
| id | int | Unique identifier for the student |
| name | varchar(255) | Student name |

### `courses` table
| Column Name | Data Type | Description |
| --- | --- | --- |
| id | int | Unique identifier for the course |
| name | varchar(255) | Course name |

### `enrollments` table
| Column Name | Data Type | Description |
| --- | --- | --- |
| id | int | Unique identifier for the enrollment |
| student_id | int | Foreign key referencing the `students` table |
| course_id | int | Foreign key referencing the `courses` table |

**Setup Instructions**
=====================

1. Install Node.js and npm (the package manager for Node.js) on your system.
2. Install Python and pip (the package manager for Python) on your system.
3. Create a new directory for the project and navigate into it.
4. Run `npm init` to create a `package.json` file for the frontend.
5. Run `pip install fastapi` to install FastAPI for the backend.
6. Create a new file called `main.py` in the backend directory and add the backend code.
7. Create a new file called `index.js` in the frontend directory and add the frontend code.
8. Run `npm start` to start the frontend development server.
9. Run `python main.py` to start the backend development server.
10. Open a web browser and navigate to `http://localhost:3000` to access the frontend.

**API Endpoints**
================

### `GET /api/students`
Returns a list of all students.

### `GET /api/courses`
Returns a list of all courses.

### `GET /api/enrollments`
Returns a list of all enrollments.

Note: This is a basic implementation and you may want to add more features, error handling, and security measures to the system.