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