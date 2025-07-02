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