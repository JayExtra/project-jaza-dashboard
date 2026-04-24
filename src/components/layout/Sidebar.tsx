import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search, Home, Megaphone, CreditCard, Users, Settings, ChevronDown, ChevronRight, Zap, LogOut
} from 'lucide-react';
import config from '../../lib/config';

const NavItem = ({ icon, label, path, active, hasChevron = false, collapsed = false, onClick = undefined, isOpen = false }) => {
  const content = (
    <div onClick={onClick} className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${active ? 'bg-surface-low text-foreground font-semibold' : 'text-foreground/60 hover:text-foreground hover:bg-surface-low/50'}`}>
      <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
        <span className={active ? 'text-primary' : ''}>
          {icon}
        </span>
        {!collapsed && <span className="text-sm">{label}</span>}
      </div>
      {!collapsed && hasChevron && (
        isOpen ? <ChevronDown size={16} className="text-foreground/40" /> : <ChevronRight size={16} className="text-foreground/40" />
      )}
    </div>
  );

  if (path && !onClick) {
    return <Link to={path} className="block">{content}</Link>;
  }

  return content;
};

export const Sidebar = ({ sidebarCollapsed }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage', e);
  }

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User Profile' : 'User Profile';
  const userEmail = user?.email || 'user@example.com';

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');
      console.log("Logout request accessToken: ", accessToken);
      const response = await fetch(`${config.apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          refreshToken,
          allDevices: true
        }),
        credentials: 'include',
      });

      console.log("Logout response: ", response);

      if (response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('isAuthenticated');
        navigate('/signin');
      } else {
        console.error('Logout failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <aside
      className={`${sidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out border-r border-border bg-surface-lowest flex flex-col justify-between`}
    >
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary overflow-hidden shrink-0 flex items-center justify-center text-on-primary font-bold text-lg">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate w-40">{userName}</span>
              <span className="text-xs text-foreground/60 truncate w-40">{userEmail}</span>
            </div>
          )}
        </div>

        <div className="px-4 mb-6">
          <div className={`flex items-center gap-2 bg-surface-low rounded-xl px-3 py-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Search size={16} className="text-foreground/50 shrink-0" />
            {!sidebarCollapsed && (
              <input
                type="text"
                placeholder="Search menu..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-foreground/50"
              />
            )}
          </div>
        </div>

        <nav className="px-2 space-y-1">
          <NavItem path="/" icon={<Home size={20} />} label="Home" active={isActive('/')} collapsed={sidebarCollapsed} />
          <NavItem path="/campaign" icon={<Megaphone size={20} />} label="Campaign" active={isActive('/campaign')} collapsed={sidebarCollapsed} />
          <NavItem path="/payments" icon={<CreditCard size={20} />} label="Payments" active={isActive('/payments')} collapsed={sidebarCollapsed} />
          <NavItem path="/influencer" icon={<Users size={20} />} label="Influencer" active={isActive('/influencer')} collapsed={sidebarCollapsed} />

          <div className="mt-4">
            <NavItem
              path=""
              icon={<Settings size={20} />}
              label="Settings"
              hasChevron
              collapsed={sidebarCollapsed}
              onClick={() => setSettingsOpen(!settingsOpen)}
              isOpen={settingsOpen}
              active={false}
            />
            {(!sidebarCollapsed && settingsOpen) && (
              <div className="ml-10 mt-1 space-y-3 py-2 text-sm text-foreground/60">
                <div className="cursor-pointer hover:text-foreground transition-colors">Connected Service</div>
                <div className="cursor-pointer hover:text-foreground transition-colors">Password & Security</div>
              </div>
            )}
          </div>

          <NavItem path="/team" icon={<Users size={20} />} label="Team" active={isActive('/team')} collapsed={sidebarCollapsed} />

          <div className="mt-8 mb-2">
            <hr className="border-border mx-4" />
          </div>

          <NavItem path="/campaign-2" icon={<Megaphone size={20} />} label="Campaign 2" active={isActive('/campaign-2')} collapsed={sidebarCollapsed} />
          <NavItem path="/payments-2" icon={<CreditCard size={20} />} label="Payments 2" active={isActive('/payments-2')} collapsed={sidebarCollapsed} />
          <NavItem path="/influencer-2" icon={<Users size={20} />} label="Influencer 2" active={isActive('/influencer-2')} collapsed={sidebarCollapsed} />
        </nav>
      </div>

      <div className="p-4">
        <div className={`bg-primary text-on-primary rounded-2xl p-4 transition-all mb-4 ${sidebarCollapsed && 'flex justify-center items-center h-14 w-14 p-0 mx-auto'}`}>
          {sidebarCollapsed ? (
            <Zap size={20} className="text-secondary" />
          ) : (
            <>
              <h4 className="font-semibold text-sm mb-1">Become Pro Access</h4>
              <p className="text-xs text-on-primary/70 mb-4 opacity-80 leading-relaxed">
                Unlock advanced campaign tracking and priority payouts.
              </p>
              <button className="w-full bg-secondary hover:bg-secondary/90 text-white text-sm font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Zap size={16} />
                Upgrade Pro
              </button>
            </>
          )}
        </div>

        <NavItem
          icon={<LogOut size={20} className="text-red-500" />}
          label={<span className="text-red-500">Sign Out</span>}
          path=""
          onClick={handleSignOut}
          collapsed={sidebarCollapsed}
          active={false}
        />
      </div>
    </aside>
  );
};

