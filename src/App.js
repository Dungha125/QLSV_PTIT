
import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './component/Login.jsx'; 
import Home from './component/Home.jsx';   
import EventDetail from './component/EventDetail.jsx';
import Account from './component/Account.jsx';
import Semester from './component/Semester.jsx';
import SemesterDetail from './component/SemesterDetail.jsx';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/account" element={<Account/>}/>
        <Route path="/semester" element={<Semester/>} />
        <Route path="/semester/:semesterId" element={<SemesterDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
