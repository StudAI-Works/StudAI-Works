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