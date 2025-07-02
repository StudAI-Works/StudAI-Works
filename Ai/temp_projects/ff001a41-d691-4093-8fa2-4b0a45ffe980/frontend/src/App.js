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