import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SpeechTestPage from './pages/SpeechTestPage'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SpeechTestPage />} />
        <Route path="/speech-test" element={<SpeechTestPage />} />
      </Routes>
    </Router>
  )
}

export default App