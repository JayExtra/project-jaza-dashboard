import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search, Home, Megaphone, CreditCard, Users, Settings, ChevronDown, ChevronRight, Zap, LogOut,
  TrendingUp, Sparkles, Bot, BrainCircuit, LayoutGrid, Trophy, Mail, Gift, FileText
} from 'lucide-react';
import config from '../../lib/config';
import { useAuth } from '../../hooks/useAuth';

interface NavItemProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  path: string;
  active: boolean;
  hasChevron?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  isOpen?: boolean;
  badge?: string;
  badgeType?: 'ai' | 'new';
}

const NavItem = ({
  icon,
  label,
  path,
  active,
  hasChevron = false,
  collapsed = false,
  onClick = undefined,
  isOpen = false,
  badge = undefined,
  badgeType = undefined,
}: NavItemProps) => {
  const content = (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
        active
          ? 'bg-surface-low text-foreground font-semibold shadow-sm'
          : 'text-foreground/60 hover:text-foreground hover:bg-surface-low/50'
      }`}
    >
      <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
        <span className={active ? 'text-primary' : ''}>
          {icon}
        </span>
        {!collapsed && <span className="text-sm">{label}</span>}
      </div>
      {!collapsed && (
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase border ${
                badgeType === 'ai'
                  ? 'bg-purple-100/50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40'
                  : 'bg-secondary/10 text-secondary border-secondary/20'
              }`}
            >
              {badge}
            </span>
          )}
          {hasChevron && (
            isOpen ? <ChevronDown size={16} className="text-foreground/40" /> : <ChevronRight size={16} className="text-foreground/40" />
          )}
        </div>
      )}
    </div>
  );

  if (path && !onClick) {
    return <Link to={path} className="block">{content}</Link>;
  }

  return content;
};

interface SidebarProps {
  sidebarCollapsed: boolean;
  setIsAiOpen: (open: boolean) => void;
}

export const Sidebar = ({ sidebarCollapsed, setIsAiOpen }: SidebarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User Profile' : 'User Profile';
  const userEmail = user?.email || 'user@example.com';

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate even if logout fails, as we cleared local state
      navigate('/signin');
    }
  };

  return (
    <aside
      className={`${sidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out border-r border-border bg-surface-lowest flex flex-col justify-between h-screen overflow-hidden`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* User profile section */}
        <div className="p-6 flex items-center gap-3 shrink-0">
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

        {/* Search Bar */}
        <div className="px-4 mb-4 shrink-0">
          <div className={`flex items-center gap-2 bg-surface-low rounded-xl px-3 py-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Search size={16} className="text-foreground/50 shrink-0" />
            {!sidebarCollapsed && (
              <input
                type="text"
                placeholder="Search menu..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-foreground/50 text-foreground"
              />
            )}
          </div>
        </div>

        {/* Redesigned Menu Sections */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-4 pb-4 scrollbar-none">
          {/* WORKSPACE */}
          <div className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="text-[9px] font-bold text-foreground/40 tracking-widest uppercase px-3 mb-1.5">Workspace</p>
            )}
            <NavItem path="/" icon={<Home size={18} />} label="Home" active={isActive('/')} collapsed={sidebarCollapsed} />
            <NavItem path="/campaign" icon={<Megaphone size={18} />} label="Campaigns" active={isActive('/campaign')} collapsed={sidebarCollapsed} />
            <NavItem path="/payments" icon={<CreditCard size={18} />} label="Payments" active={isActive('/payments')} collapsed={sidebarCollapsed} />
            <NavItem path="/donors" icon={<Users size={18} />} label="Donors" active={isActive('/donors')} collapsed={sidebarCollapsed} />
            <NavItem path="/analytics" icon={<TrendingUp size={18} />} label="Analytics" active={isActive('/analytics')} collapsed={sidebarCollapsed} />
          </div>

          {/* AI FEATURES */}
          <div className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="text-[9px] font-bold text-foreground/40 tracking-widest uppercase px-3 mb-1.5">AI Features</p>
            )}
            <NavItem path="/smart-reports" icon={<Sparkles size={18} />} label="Smart Reports" active={isActive('/smart-reports')} collapsed={sidebarCollapsed} badge="AI" badgeType="ai" />
            <NavItem 
              path="/ai-agent" 
              icon={<Bot size={18} />} 
              label="AI Agent" 
              active={isActive('/ai-agent')} 
              collapsed={sidebarCollapsed} 
              badge="AI" 
              badgeType="ai"
              onClick={() => {
                setIsAiOpen(true);
                navigate('/ai-agent');
              }}
            />
            <NavItem path="/ai-settings" icon={<BrainCircuit size={18} />} label="AI Settings" active={isActive('/ai-settings')} collapsed={sidebarCollapsed} badge="AI" badgeType="ai" />
          </div>

          {/* PUBLISH */}
          <div className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="text-[9px] font-bold text-foreground/40 tracking-widest uppercase px-3 mb-1.5">Publish</p>
            )}
            <NavItem path="/page-builder" icon={<LayoutGrid size={18} />} label="Page Builder" active={isActive('/page-builder')} collapsed={sidebarCollapsed} badge="New" badgeType="new" />
            <NavItem path="/challenges" icon={<Trophy size={18} />} label="Challenges" active={isActive('/challenges')} collapsed={sidebarCollapsed} badge="New" badgeType="new" />
          </div>

          {/* GROWTH */}
          <div className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="text-[9px] font-bold text-foreground/40 tracking-widest uppercase px-3 mb-1.5">Growth</p>
            )}
            <NavItem path="/integrations" icon={<Zap size={18} />} label="Integrations" active={isActive('/integrations')} collapsed={sidebarCollapsed} />
            <NavItem path="/email-sms" icon={<Mail size={18} />} label="Email & SMS" active={isActive('/email-sms')} collapsed={sidebarCollapsed} />
            <NavItem path="/rewards" icon={<Gift size={18} />} label="Rewards" active={isActive('/rewards')} collapsed={sidebarCollapsed} />
          </div>

          {/* MANAGE */}
          <div className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="text-[9px] font-bold text-foreground/40 tracking-widest uppercase px-3 mb-1.5">Manage</p>
            )}
            <NavItem path="/reports" icon={<FileText size={18} />} label="Reports" active={isActive('/reports')} collapsed={sidebarCollapsed} />
            
            <div className="mt-1">
              <NavItem
                path="/settings"
                icon={<Settings size={18} />}
                label="Settings"
                hasChevron
                collapsed={sidebarCollapsed}
                onClick={() => {
                  setSettingsOpen(!settingsOpen);
                  navigate('/settings');
                }}
                isOpen={settingsOpen}
                active={isActive('/settings')}
              />
              {(!sidebarCollapsed && settingsOpen) && (
                <div className="ml-10 mt-1 space-y-1 py-1 text-sm text-foreground/60">
                  <div className="cursor-pointer hover:text-foreground transition-colors py-1" onClick={() => navigate('/settings?tab=account')}>Account</div>
                  <div className="cursor-pointer hover:text-foreground transition-colors py-1" onClick={() => navigate('/settings?tab=notification')}>Notification</div>
                  <div className="cursor-pointer hover:text-foreground transition-colors py-1" onClick={() => navigate('/settings?tab=general')}>General</div>
                  <div className="cursor-pointer hover:text-foreground transition-colors py-1" onClick={() => navigate('/settings?tab=billing')}>Billing</div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Upgrade Pro Card & Sign Out */}
      <div className="p-4 shrink-0 border-t border-border/40 bg-surface-lowest">
        <div className={`bg-primary text-on-primary rounded-2xl p-4 transition-all mb-4 ${sidebarCollapsed && 'flex justify-center items-center h-14 w-14 p-0 mx-auto'}`}>
          {sidebarCollapsed ? (
            <Zap size={20} className="text-secondary" />
          ) : (
            <>
              <h4 className="font-semibold text-sm mb-1">Become Pro Access</h4>
              <p className="text-xs text-on-primary/70 mb-4 opacity-80 leading-relaxed">
                Custom domains, unlimited pages & challenges.
              </p>
              <button className="w-full bg-secondary hover:bg-secondary/90 text-white text-sm font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Zap size={16} />
                Upgrade Pro
              </button>
            </>
          )}
        </div>

        <NavItem
          icon={<LogOut size={18} className="text-red-500" />}
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

