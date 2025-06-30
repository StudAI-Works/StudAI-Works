import React from 'react'
import Home from './Pages/Home'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardPage from './app/dashboard/page'
import LandingPage from './app/page'
import { ModeToggle } from './components/mode-toggle'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/home' element={<Home />} />
        <Route path='/dash' element={<DashboardPage />} />
        <Route path='/landingpage' element={<LandingPage />} />
        <Route path='/modetoggle' element={<ModeToggle />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
