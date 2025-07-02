import React from 'react';
import { Route, Switch } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StudentsPage from './pages/StudentsPage';
import CoursesPage from './pages/CoursesPage';
import EnrollmentsPage from './pages/EnrollmentsPage';

function App() {
  return (
    <Switch>
      <Route path="/" exact component={HomePage} />
      <Route path="/students" component={StudentsPage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/enrollments" component={EnrollmentsPage} />
    </Switch>
  );
}

export default App;