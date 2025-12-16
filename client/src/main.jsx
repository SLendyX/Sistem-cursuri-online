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
import CreateCourse from './CreateCourse.jsx';
import RequireAuth from './RequireAuth.jsx';
import PublicOnlyRoute from './PublicOnlyRoute.jsx';
import TeacherOnlyRoute from './TeacherOnlyRoute.jsx';
import CourseEditorLayout from './CourseEditorLayout.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<DashBoard />}>
          <Route index element={<Home />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path='login' element={<Login />} />
            <Route path='register' element={<Register />} />
          </Route>
          <Route path='about' element={<About />} />
          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<Profile />} />
            <Route element={<TeacherOnlyRoute />}>
              <Route path="create_course" element={<CreateCourse />} />
            </Route>
          </Route>
          <Route path='courses'>
            <Route index element={<Courses />} />
            <Route path=":courseId" element={<Course />} />
          </Route>
          <Route path="instructor/course/:courseId/edit" element={<CourseEditorLayout />}>
            {/* <Route index element={<CourseCurriculumEditor />} />
            <Route path="lesson/:lessonId" element={<LessonContentEditor />} /> */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
  ,)
