import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/home/Home'
import Calendar from './pages/calendar/Calendar'
import Mypage from './pages/mypage/Mypage'
import People from './pages/people/People'
import RequireAuth from './components/auth/RequireAuth'
import Onboarding from './pages/onboarding/Onboarding'
import Login from './pages/login/Login'

const App = () => {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <RootLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/people" element={<People />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/mypage" element={<Mypage />} />
      </Route>

      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>
  )
}

export default App
