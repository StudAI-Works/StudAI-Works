import React from 'react';
import { Route, Switch } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StudentsPage from './pages/StudentsPage';
import StudentPage from './pages/StudentPage';

function App() {
  return (
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route path="/students" component={StudentsPage} />
      <Route path="/students/:id" component={StudentPage} />
    </Switch>
  );
}

export default App;