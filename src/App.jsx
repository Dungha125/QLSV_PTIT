
import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './component/Login.jsx'; 
import Home from './component/Home.jsx';   
import EventDetail from './component/EventDetail.jsx';
import Account from './component/Account.jsx';
import Semester from './component/Semester.jsx';
import SemesterDetail from './component/SemesterDetail.jsx';
import Organization from './component/Organization.jsx';
import Tracuu from './component/Tracuu.jsx';
import Vanphongdoan from './component/Vanphongdoan.jsx';
import RequireAuth from "./auth/RequireAuth";
import RequirePermission from "./auth/RequirePermission";
import Blacklist from "./pages/Blacklist";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/quanly" element={<Login />} />
        <Route path="/quanly/home" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/quanly/home/events/:eventId" element={<RequireAuth><EventDetail /></RequireAuth>} />
        <Route path="/quanly/account" element={<RequireAuth><Account/></RequireAuth>}/>
        <Route path="/quanly/semester" element={<RequireAuth><Semester/></RequireAuth>} />
        <Route path="/quanly/semester/:semesterId" element={<RequireAuth><SemesterDetail /></RequireAuth>} />
        <Route path="/quanly/organization" element={<RequireAuth><Organization /></RequireAuth>} />
        <Route path="/vpdptit" element={<Vanphongdoan />}/>
        <Route path="/" element={<Tracuu />} />
        <Route
            path="/quanly/blacklist"
            element={
              <RequireAuth>
                <RequirePermission allow="admin">
                  <Blacklist />
                </RequirePermission>
              </RequireAuth>
            }
        />
      </Routes>
    </Router>

  );
}

export default App;
