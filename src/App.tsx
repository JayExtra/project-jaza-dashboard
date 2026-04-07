import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn } from './pages/SignIn';
import { DashboardLayout } from './pages/DashboardLayout';
import { Home } from './pages/Home';
import { Campaign } from './pages/Campaign';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        
        {/* Protected layout routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="campaign" element={<Campaign />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
