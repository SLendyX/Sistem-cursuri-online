import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import './index.css'
import Home from './Home.jsx'
import Login from "./Login.jsx"
import Profile from "./Profil.jsx"
import DashBoard from "./page_elements/DashBoard.jsx"
import Courses from "./Cursuri.jsx"
import Course from "./Curs.jsx"
import About from './About.jsx';
import Register from './Register.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<DashBoard />}>
        <Route index element={<Home />} />
        <Route path='login' element={<Login />} />
        <Route path='register' element={<Register />} />
        <Route path='profile' element={<Profile />}/>
        <Route path='about' element={<About />} />
        <Route path='courses' element={<Courses />}>
          <Route path=":courseId" element={<Course />} />
        </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
,)
