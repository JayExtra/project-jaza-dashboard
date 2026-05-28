import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn } from './pages/SignIn';
import { DashboardLayout } from './pages/DashboardLayout';
import { Home } from './pages/Home';
import { Campaign } from './pages/Campaign';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { SettingsPage } from './pages/Settings';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Protected layout routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="campaign" element={<Campaign />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
