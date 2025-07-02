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