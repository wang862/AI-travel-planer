import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TripPlannerPage from './pages/TripPlannerPage'
import TripDetailPage from './pages/TripDetailPage'
import MyTripsPage from './pages/MyTripsPage'
import ProfilePage from './pages/ProfilePage'
import { AuthProvider } from './hooks/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/plan" element={<TripPlannerPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
          <Route path="/my-trips" element={<MyTripsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App