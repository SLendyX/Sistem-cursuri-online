// client/src/main.jsx (Updated)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import './index.css'

// Layouts & Providers
import AuthProvider from './context/AuthProvider.jsx';
import StudentLayout from './page_elements/StudentLayout.jsx';
import ProfessorLayout from './page_elements/ProfessorLayout.jsx';
import CoursePlayerLayout from './CoursePlayerLayout.jsx'; // NEW

// Pages
import Home from './Home.jsx'
import Login from "./Login.jsx"
import Profile from "./Profil.jsx"
import Courses from "./Cursuri.jsx"
import CourseLanding from './CourseLanding.jsx'; // NEW - Public course page
import LessonPlayer from './LessonPlayer.jsx'; // NEW - Student lesson view
import About from './About.jsx';
import Register from './Register.jsx';
import CreateCourse from './CreateCourse.jsx';
import CourseEditorLayout from './CourseEditorLayout.jsx';
import CreatedCourses from './CreatedCourses.jsx';
import LessonEditor from './LessonEditor.jsx';
import ChapterEditor from './ChapterEditor.jsx';
import CourseEditor from './CourseEditor.jsx';

// Guards
import RequireAuth from './RequireAuth.jsx';
import PublicOnlyRoute from './PublicOnlyRoute.jsx';
import TeacherOnlyRoute from './TeacherOnlyRoute.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ================================================= */}
          {/* STUDENT & PUBLIC ROUTES */}
          {/* ================================================= */}
          <Route element={<StudentLayout />}>
            <Route index element={<Home />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path='login' element={<Login />} />
              <Route path='register' element={<Register />} />
            </Route>

            <Route path='about' element={<About />} />

            <Route element={<RequireAuth />}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Course Browse & Landing Pages */}
            <Route path='courses'>
              <Route index element={<Courses />} />
              <Route path=":courseId" element={<CourseLanding />} /> {/* Public landing */}
            </Route>
          </Route>

          {/* ================================================= */}
          {/* COURSE PLAYER (Student Learning View) */}
          {/* ================================================= */}
          <Route path="course/:courseId/learn" element={<RequireAuth />}>
            <Route element={<CoursePlayerLayout />}>
              <Route index element={
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <h3>Select a lesson from the sidebar to begin</h3>
                </div>
              } />
              <Route path="lesson/:lessonId" element={<LessonPlayer />} />
            </Route>
          </Route>

          {/* ================================================= */}
          {/* PROFESSOR ROUTES */}
          {/* ================================================= */}
          <Route path="instructor" element={<TeacherOnlyRoute />}>
            <Route element={<ProfessorLayout />}>
              <Route index element={<h1>Dashboard Instructor</h1>} />
              <Route path="profile" element={<Profile />} />
              <Route path="create_course" element={<CreateCourse />} />
              <Route path='my_courses' element={<CreatedCourses />} />

              {/* Course Editor Routes */}
              <Route path="course/:courseId/edit" element={<CourseEditorLayout />}>
                <Route index element={<CourseEditor />} />
                <Route path="chapter/:chapterId">
                  <Route index element={<ChapterEditor />} />
                  <Route path="lesson/:lessonId" element={<LessonEditor />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)