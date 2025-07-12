import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import LandingPage from './app/page';
import AuthPage from './app/auth/page';
import DashboardPage from './app/dashboard/page';
import AccountPage from './app/account/page';
import EditorPage from './app/editor/page';
import GeneratePage from './app/generate/page';
import HelpPage from './app/help/page';
import OrganizationPage from './app/organization/page';

// Import Providers and Guards
import { AuthProvider } from './app/context/authContext';
import { ThemeProvider } from './components/theme-provider'; 
import ProtectedRoute from './components/protectedRoute';
import PublicRoute from './components/publicRoutes';

function App() {
  return (
    // --- WRAP EVERYTHING IN THE THEME PROVIDER ---
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* All your routes stay the same */}
            <Route path='/' element={<LandingPage />} />
            <Route element={<PublicRoute />}>
              <Route path='/auth' element={<AuthPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<DashboardPage />} />
              <Route path='/account' element={<AccountPage />} />
              <Route path='/editor' element={<EditorPage />} />
              <Route path='/generate' element={<GeneratePage />} />
              <Route path='/help' element={<HelpPage />} />
              <Route path='/organization' element={<OrganizationPage />} />
            </Route>
            <Route path='*' element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;