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