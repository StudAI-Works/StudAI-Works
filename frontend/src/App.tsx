import React from 'react'
// import Home from './Pages/Home'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardPage from './app/dashboard/page'
import LandingPage from './app/page'
import { ModeToggle } from './components/mode-toggle'
import AuthPage from './app/auth/page'
import AccountPage from './app/account/page'
import Loading from './app/dashboard/loading'
import EditorPage from './app/editor/page'
import GeneratePage from './app/generate/page'
import HelpPage from './app/help/page'
import OrganizationPage from './app/organization/page'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path='/' element={<Home />} /> */}
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/' element={<LandingPage />} />
        <Route path='/modetoggle' element={<ModeToggle />} />
        <Route path='/auth' element={<AuthPage />} />
        <Route path='/account' element={<AccountPage />} />
        <Route path='/loading' element={<Loading />} />
        <Route path='/editorpage' element={<EditorPage />} />
        <Route path='/generate' element={<GeneratePage />} />
        <Route path='/help' element={<HelpPage />} />
        <Route path='/organization' element={<OrganizationPage />} />


        GeneratePage



    </Routes>
    </BrowserRouter>
  )
}

export default App
