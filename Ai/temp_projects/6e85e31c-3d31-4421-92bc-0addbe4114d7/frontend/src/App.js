import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Enrollments from './pages/Enrollments';
import Login from './pages/Login';

function App() {
  return (
    <Switch>
      <Route path="/" exact component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/courses" component={Courses} />
      <Route path="/enrollments" component={Enrollments} />
      <Route path="/login" component={Login} />
    </Switch>
  );
}

export default App;