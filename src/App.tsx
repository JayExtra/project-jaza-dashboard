import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { setAuthToken } from './lib/api';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { DashboardLayout } from './pages/DashboardLayout';
import { Home } from './pages/Home';
import { PotOnboarding } from './pages/PotOnboarding';
import { Campaign } from './pages/Campaign';
import { Payments } from './pages/Payments';
import { Donors } from './pages/Donors';
import { Analytics } from './pages/Analytics';
import { SmartReports } from './pages/SmartReports';
import { AIAgent } from './pages/AIAgent';
import { AISettings } from './pages/AISettings';
import { PageBuilder } from './pages/PageBuilder';
import { Challenges } from './pages/Challenges';
import { Integrations } from './pages/Integrations';
import { EmailSMS } from './pages/EmailSMS';
import { Rewards } from './pages/Rewards';
import { Reports } from './pages/Reports';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { SettingsPage } from './pages/Settings';

/**
 * Component that syncs the auth context token with the API module
 * and provides routes
 */
const AppRoutes = () => {
  const { accessToken } = useAuth();

  // Sync access token to API module whenever it changes
  useEffect(() => {
    setAuthToken(accessToken);
  }, [accessToken]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pot/new" element={<PotOnboarding />} />
        {/* Protected layout routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="campaign" element={<Campaign />} />
          <Route path="payments" element={<Payments />} />
          <Route path="donors" element={<Donors />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="smart-reports" element={<SmartReports />} />
          <Route path="ai-agent" element={<AIAgent />} />
          <Route path="ai-settings" element={<AISettings />} />
          <Route path="page-builder" element={<PageBuilder />} />
          <Route path="challenges" element={<Challenges />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="email-sms" element={<EmailSMS />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
