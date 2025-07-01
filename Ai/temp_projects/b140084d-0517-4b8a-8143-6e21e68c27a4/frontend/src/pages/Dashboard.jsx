import React from 'react';
import axios from 'axios';

function Dashboard() {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login';
  }

  const [student, setStudent] = useState({});

  axios.get('http://localhost:8000/student', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      setStudent(response.data);
    })
    .catch((error) => {
      console.error(error);
    });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {student.name}!</p>
    </div>
  );
}

export default Dashboard;