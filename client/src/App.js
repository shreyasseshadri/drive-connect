import logo from './logo.svg';
import './App.css';

import React from 'react';
import GoogleAuthButton from './components/authenticator';
import FileList from './components/explorer'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={GoogleAuthButton} />
        <Route path="/explorer" component={FileList} />
      </Switch>
    </Router>
  );
};

export default App;
