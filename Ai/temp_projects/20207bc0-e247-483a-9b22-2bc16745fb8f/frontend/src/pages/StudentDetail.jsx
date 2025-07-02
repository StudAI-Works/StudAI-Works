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