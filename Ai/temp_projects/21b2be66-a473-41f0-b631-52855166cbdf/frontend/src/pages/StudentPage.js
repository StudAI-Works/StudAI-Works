import React from 'react';
import axios from 'axios';

function StudentPage({ match }) {
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
      <p>Age: {student.age}</p>
    </div>
  );
}

export default StudentPage;