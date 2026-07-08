import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { AIAgentPanel } from '../components/layout/AIAgentPanel';
import { EmailVerificationOverlay } from '../components/ui/dialogs/EmailVerificationOverlay';
import { useAuth } from '../hooks/useAuth';
import  { SignOutDialog } from '../components/ui/dialogs/SignOutDialog';

export const DashboardLayout = () => {
  const [isDark, setIsDark] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { showSignoutConfirmation, setSignoutConfirmationStatus, logout } = useAuth();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const handleToggle = () => setIsAiOpen(prev => !prev);
    window.addEventListener('toggle-ai-panel', handleToggle);
    return () => window.removeEventListener('toggle-ai-panel', handleToggle);
  }, []);

  // Show nothing while auth is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return (
    <div className="flex bg-background min-h-screen text-foreground font-sans transition-colors duration-200 relative overflow-hidden">
      <EmailVerificationOverlay />

      {
showSignoutConfirmation && (
        <SignOutDialog 
          isOpen={showSignoutConfirmation}
          handleClose={() => setSignoutConfirmationStatus(false)}
          onSignOut={ async (signOutAllDevices : boolean) => {
            try {
              await logout(signOutAllDevices); // Log out from all devices
            } catch (error) {
              console.error('Error during logout:', error);
            } finally {
              setSignoutConfirmationStatus(false);
            }
          }}
        />
      )
      }
      
      {/* Sidebar */}
      <Sidebar sidebarCollapsed={sidebarCollapsed} setIsAiOpen={setIsAiOpen} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <Topbar 
          sidebarCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed} 
          isDark={isDark} 
          setIsDark={setIsDark} 
          isAiOpen={isAiOpen}
          setIsAiOpen={setIsAiOpen}
        />

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* AI Agent Slide-out Panel */}
      <AIAgentPanel isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
};
