import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, Bell, Sliders, CreditCard, Camera, Trash2, LogOut, Check, Sun, Moon, Laptop, ChevronDown, CheckCircle
} from 'lucide-react';
import config from '../lib/config';

export const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'account';

  // State values for forms and settings
  const [firstName, setFirstName] = useState('Brian');
  const [lastName, setLastName] = useState('Frederin');
  const [twoStep, setTwoStep] = useState(false);
  const [supportAccess, setSupportAccess] = useState(true);

  // Parse user from localStorage
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage', e);
  }

  const userEmail = user?.email || 'brianfrederin@email.com';

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
    }
  }, []);

  // Update URL active tab
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // Notification States
  const [emailPromo, setEmailPromo] = useState(false);
  const [emailSecurity, setEmailSecurity] = useState(true);
  const [emailBilling, setEmailBilling] = useState(true);
  const [mobileCampaign, setMobileCampaign] = useState(true);
  const [mobileMentions, setMobileMentions] = useState(true);
  const [pcAlerts, setPcAlerts] = useState(true);
  const [pcSound, setPcSound] = useState(false);

  // General States
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const isDark = document.documentElement.classList.contains('dark');
    return isDark ? 'dark' : 'light';
  });
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [defaultPage, setDefaultPage] = useState('Home');
  const [syncInterval, setSyncInterval] = useState('5m');
  const [compactMode, setCompactMode] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Handle Theme Switch directly in DOM
  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      // System default
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.removeItem('theme');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground font-sans">
      
      {/* Secondary Navigation Pane (Left Column) */}
      <div className="w-full lg:w-64 bg-surface-low border-r border-border/10 p-6 flex flex-col gap-6 shrink-0">
        <div>
          <span className="text-[10px] font-bold text-foreground/40 tracking-widest uppercase block mb-3 px-3">
            General Settings
          </span>
          <nav className="space-y-1">
            <button
              onClick={() => handleTabChange('account')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'account' 
                  ? 'bg-surface-lowest text-foreground shadow-sm border border-border/5' 
                  : 'text-foreground/60 hover:text-foreground hover:bg-surface-lowest/40'
              }`}
            >
              <User size={18} className={activeTab === 'account' ? 'text-primary' : 'text-foreground/50'} />
              <span>Account</span>
            </button>

            <button
              onClick={() => handleTabChange('notification')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'notification' 
                  ? 'bg-surface-lowest text-foreground shadow-sm border border-border/5' 
                  : 'text-foreground/60 hover:text-foreground hover:bg-surface-lowest/40'
              }`}
            >
              <Bell size={18} className={activeTab === 'notification' ? 'text-primary' : 'text-foreground/50'} />
              <span>Notification</span>
            </button>
          </nav>
        </div>

        <div>
          <span className="text-[10px] font-bold text-foreground/40 tracking-widest uppercase block mb-3 px-3">
            Workspace Settings
          </span>
          <nav className="space-y-1">
            <button
              onClick={() => handleTabChange('general')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'general' 
                  ? 'bg-surface-lowest text-foreground shadow-sm border border-border/5' 
                  : 'text-foreground/60 hover:text-foreground hover:bg-surface-lowest/40'
              }`}
            >
              <Sliders size={18} className={activeTab === 'general' ? 'text-primary' : 'text-foreground/50'} />
              <span>General</span>
            </button>

            <button
              onClick={() => handleTabChange('billing')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'billing' 
                  ? 'bg-surface-lowest text-foreground shadow-sm border border-border/5' 
                  : 'text-foreground/60 hover:text-foreground hover:bg-surface-lowest/40'
              }`}
            >
              <CreditCard size={18} className={activeTab === 'billing' ? 'text-primary' : 'text-foreground/50'} />
              <span>Billing</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Details Pane (Right Column) */}
      <div className="flex-1 bg-surface-lowest p-8 md:p-12 overflow-y-auto max-w-4xl">
        
        {/* Render ACTIVE TAB View */}
        
        {/* TABS - ACCOUNT */}
        {activeTab === 'account' && (
          <div className="space-y-10">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Account Settings</h1>
              <p className="text-sm text-foreground/60">Manage your profile information and security preferences.</p>
            </div>

            {/* My Profile */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight">My Profile</h2>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-surface-low/30 rounded-2xl">
                {/* Circular Profile Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary bg-surface-low shadow-sm flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200" 
                      alt="Profile Avatar"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={18} className="text-white" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-center sm:text-left">
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button className="bg-primary text-on-primary hover:bg-primary/95 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors">
                      Change Image
                    </button>
                    <button className="bg-surface-low hover:bg-surface-low/75 text-foreground text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-border/10 transition-colors">
                      Remove Image
                    </button>
                  </div>
                  <span className="text-[10px] text-foreground/40 font-bold tracking-widest uppercase">
                    SUPPORT FORMATS: PNG, JPEG (MAX 2MB)
                  </span>
                </div>
              </div>

              {/* Form Input fields - customized with Jaza styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Brian"
                    className="w-full bg-surface-container-highest border-transparent rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Frederin"
                    className="w-full bg-surface-container-highest border-transparent rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight">Account Security</h2>
              <div className="space-y-4">
                {/* Email address Card */}
                <div className="bg-surface-low/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] font-bold text-foreground/50 tracking-widest uppercase mb-1">
                      Email Address
                    </span>
                    <span className="text-sm font-medium text-foreground">{userEmail}</span>
                  </div>
                  <button className="bg-surface-low hover:bg-surface-low/80 text-foreground px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-border/10 shrink-0">
                    Change email
                  </button>
                </div>

                {/* Password Card */}
                <div className="bg-surface-low/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] font-bold text-foreground/50 tracking-widest uppercase mb-1">
                      Password
                    </span>
                    <span className="text-sm tracking-widest font-mono text-foreground/60">••••••••</span>
                  </div>
                  <button className="bg-surface-low hover:bg-surface-low/80 text-foreground px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-border/10 shrink-0">
                    Change password
                  </button>
                </div>
              </div>
            </div>

            {/* 2-Step Verification */}
            <div className="bg-surface-low/30 rounded-2xl p-6 flex items-center justify-between gap-4">
              <div className="max-w-xl">
                <h3 className="font-bold text-base mb-1">2-Step Verification</h3>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  Add an additional layer of security to your account during login.
                </p>
              </div>
              <button 
                onClick={() => setTwoStep(!twoStep)} 
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                  twoStep ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  twoStep ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Support Access */}
            <div className="bg-surface-low/30 rounded-2xl p-6 flex items-center justify-between gap-4">
              <div className="max-w-xl">
                <h3 className="font-bold text-base mb-1">Support Access</h3>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  You have granted us access to your account for support purposes until <span className="font-semibold text-foreground">Aug 31, 2026, 9:40 PM</span>.
                </p>
              </div>
              <button 
                onClick={() => setSupportAccess(!supportAccess)} 
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                  supportAccess ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  supportAccess ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Log out of all devices */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
              <div>
                <h3 className="font-bold text-base mb-1">Log out of all devices</h3>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  Log out of all other active sessions on other devices besides this one.
                </p>
              </div>
              <button className="bg-surface-low hover:bg-surface-low/85 text-foreground border border-border/10 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-xl transition-colors shrink-0">
                Log Out
              </button>
            </div>

            {/* Delete Account (Destructive red block) */}
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="max-w-xl">
                <h3 className="font-bold text-base text-secondary mb-1">Delete my account</h3>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  Permanently delete the account and remove access from all workspaces. This action is irreversible.
                </p>
              </div>
              <button className="bg-secondary hover:bg-secondary/95 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-xl transition-colors shrink-0">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* TABS - NOTIFICATION */}
        {activeTab === 'notification' && (
          <div className="space-y-10">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Notification Settings</h1>
              <p className="text-sm text-foreground/60">Configure how and where you receive alerts and updates.</p>
            </div>

            {/* Email Notifications */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold tracking-tight border-b border-border/5 pb-2">Email Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Promotional Emails</h4>
                    <p className="text-xs text-foreground/60">Receive news, campaign tips, and promotional offers.</p>
                  </div>
                  <button 
                    onClick={() => setEmailPromo(!emailPromo)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      emailPromo ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      emailPromo ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Security Alerts</h4>
                    <p className="text-xs text-foreground/60">Get notified of new device logins, password changes, and OTPs.</p>
                  </div>
                  <button 
                    onClick={() => setEmailSecurity(!emailSecurity)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      emailSecurity ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      emailSecurity ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Account Updates</h4>
                    <p className="text-xs text-foreground/60">Receive critical notifications regarding billing and workspace shifts.</p>
                  </div>
                  <button 
                    onClick={() => setEmailBilling(!emailBilling)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      emailBilling ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      emailBilling ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Push Notifications */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold tracking-tight border-b border-border/5 pb-2">Mobile Push Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Campaign Invitations & Payouts</h4>
                    <p className="text-xs text-foreground/60">Receive instant push messages for campaign requests or payout confirmations.</p>
                  </div>
                  <button 
                    onClick={() => setMobileCampaign(!mobileCampaign)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      mobileCampaign ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      mobileCampaign ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Workspace Chat & Mentions</h4>
                    <p className="text-xs text-foreground/60">Get push alerts when tagged by team members or in discussions.</p>
                  </div>
                  <button 
                    onClick={() => setMobileMentions(!mobileMentions)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      mobileMentions ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      mobileMentions ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* PC Device / Browser Notifications */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold tracking-tight border-b border-border/5 pb-2">PC Device Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">In-App Browser Alerts</h4>
                    <p className="text-xs text-foreground/60">Show toast notifications and update the Topbar Bell badge on new updates.</p>
                  </div>
                  <button 
                    onClick={() => setPcAlerts(!pcAlerts)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      pcAlerts ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      pcAlerts ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Sound Notifications</h4>
                    <p className="text-xs text-foreground/60">Play a subtle ambient click audio cue when in-app alerts hit your dashboard.</p>
                  </div>
                  <button 
                    onClick={() => setPcSound(!pcSound)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      pcSound ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      pcSound ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Save preferences notification button */}
            <div className="flex justify-end pt-4">
              <button className="bg-primary text-on-primary hover:bg-primary/95 text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl transition-colors">
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* TABS - GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-10">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight mb-2">General Settings</h1>
              <p className="text-sm text-foreground/60">Customize the appearance, font size, and layout settings of your dashboard.</p>
            </div>

            {/* Theme selector */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight">Interface Theme</h2>
              <p className="text-xs text-foreground/60">Choose your preferred visual look for the dashboard application.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex flex-col items-center gap-4 p-5 rounded-2xl border text-center transition-all ${
                    themeMode === 'light'
                      ? 'border-primary bg-surface-low shadow-sm ring-1 ring-primary'
                      : 'border-border/10 bg-surface-low/10 hover:bg-surface-low/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Sun size={20} />
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-foreground">Light Mode</span>
                    <span className="text-[10px] text-foreground/50">Clean paper finish</span>
                  </div>
                  {themeMode === 'light' && <CheckCircle size={16} className="text-primary mt-auto" />}
                </button>

                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex flex-col items-center gap-4 p-5 rounded-2xl border text-center transition-all ${
                    themeMode === 'dark'
                      ? 'border-primary bg-surface-low shadow-sm ring-1 ring-primary'
                      : 'border-border/10 bg-surface-low/10 hover:bg-surface-low/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                    <Moon size={20} />
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-foreground">Dark Mode</span>
                    <span className="text-[10px] text-foreground/50">Heritage high-contrast teal</span>
                  </div>
                  {themeMode === 'dark' && <CheckCircle size={16} className="text-primary mt-auto" />}
                </button>

                <button
                  onClick={() => handleThemeChange('system')}
                  className={`flex flex-col items-center gap-4 p-5 rounded-2xl border text-center transition-all ${
                    themeMode === 'system'
                      ? 'border-primary bg-surface-low shadow-sm ring-1 ring-primary'
                      : 'border-border/10 bg-surface-low/10 hover:bg-surface-low/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Laptop size={20} />
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-foreground">System Theme</span>
                    <span className="text-[10px] text-foreground/50">Matches computer default</span>
                  </div>
                  {themeMode === 'system' && <CheckCircle size={16} className="text-primary mt-auto" />}
                </button>
              </div>
            </div>

            {/* Font Size Adjuster */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight">Dashboard Font Size</h2>
              <p className="text-xs text-foreground/60">Scale typographical elements for maximum financial data legibility.</p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      fontSize === size
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-low/20 border-border/15 text-foreground hover:bg-surface-low/50'
                    }`}
                  >
                    {size === 'sm' && 'Small (13px)'}
                    {size === 'md' && 'Medium (Default)'}
                    {size === 'lg' && 'Large (16px)'}
                    {size === 'xl' && 'Extra Large (18px)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferences Options */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold tracking-tight">Interface Layout & Performance</h2>
              
              <div className="space-y-4">
                {/* Compact mode toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Compact Ledger View</h4>
                    <p className="text-xs text-foreground/60">Reduces vertical padding and element sizing across campaigns and transaction listings.</p>
                  </div>
                  <button 
                    onClick={() => setCompactMode(!compactMode)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      compactMode ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      compactMode ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Show Stats toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Display Metric Cards</h4>
                    <p className="text-xs text-foreground/60">Renders high-contrast summaries and geometric overlays on the landing deck.</p>
                  </div>
                  <button 
                    onClick={() => setShowStats(!showStats)} 
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                      showStats ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      showStats ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Select drop-downs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="block text-[10px] font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                    Default Landing Deck
                  </label>
                  <div className="relative">
                    <select
                      value={defaultPage}
                      onChange={(e) => setDefaultPage(e.target.value)}
                      className="w-full bg-surface-container-highest border-transparent rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground appearance-none cursor-pointer"
                    >
                      <option value="Home">Home Overview</option>
                      <option value="Campaign">Campaign Desk</option>
                      <option value="Payments">Payments & Ledger</option>
                      <option value="Influencer">Influencers Portal</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-foreground/60 mb-2 tracking-widest uppercase">
                    Auto-Sync Frequency
                  </label>
                  <div className="relative">
                    <select
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(e.target.value)}
                      className="w-full bg-surface-container-highest border-transparent rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-0 focus:bg-surface-container-lowest focus:border-l-2 focus:border-l-primary transition-all text-foreground appearance-none cursor-pointer"
                    >
                      <option value="realtime">Real-time Stream</option>
                      <option value="5m">Every 5 minutes</option>
                      <option value="1h">Every hour</option>
                      <option value="manual">Manual pull only</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS - BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-10">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Billing & Subscription</h1>
              <p className="text-sm text-foreground/60">Monitor your active tier, card integrations, and invoices.</p>
            </div>

            {/* Current Plan Card (heritage dark green, similar to pro upgrade) */}
            <div className="bg-primary text-on-primary rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
              <div className="space-y-3 z-10">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-secondary text-white px-2.5 py-1 rounded">
                  Active Subscription
                </span>
                <h2 className="text-2xl font-display font-bold">Jaza Brand Suite (Pro Access)</h2>
                <p className="text-xs text-on-primary/75 max-w-md leading-relaxed">
                  Grants unlimited campaign pipelines, high-volume collective payouts, instant multi-user delegation, and professional report prints.
                </p>
              </div>

              <div className="text-left md:text-right shrink-0 z-10">
                <span className="block text-3xl font-display font-bold text-white">$49<span className="text-sm font-normal text-on-primary/60"> / mo</span></span>
                <span className="block text-xs text-on-primary/60 mt-1">Renews on Aug 15, 2026</span>
                <button className="mt-4 bg-secondary hover:bg-secondary/95 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-xl transition-colors">
                  Change Plan
                </button>
              </div>

              {/* Decorative subtle background overlay gradient */}
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-secondary/15 rounded-full blur-3xl -z-0 translate-x-12 translate-y-12"></div>
            </div>

            {/* Integrated Card Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight">Payment Method</h2>
              <div className="bg-surface-low/30 border border-border/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-surface-lowest rounded border border-border/15 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                    VISA
                  </div>
                  <div>
                    <span className="block text-sm font-semibold">Visa ending in 4821</span>
                    <span className="block text-xs text-foreground/50">Expires 12/28 • Default Payment Source</span>
                  </div>
                </div>
                <button className="bg-surface-low hover:bg-surface-low/85 text-foreground border border-border/10 text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-xl transition-colors shrink-0">
                  Update Card
                </button>
              </div>
            </div>

            {/* Premium Invoice Table - obeying "No-Line" rule */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight">Invoice History</h2>
              <div className="bg-surface-low/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-surface-low/35 text-[10px] font-bold text-foreground/50 tracking-widest uppercase">
                        <th className="px-6 py-4">Invoice ID</th>
                        <th className="px-6 py-4">Billing Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/5">
                      <tr className="hover:bg-surface-low/20 transition-colors">
                        <td className="px-6 py-4.5 font-mono text-xs">INV-2026-004</td>
                        <td className="px-6 py-4.5">May 15, 2026</td>
                        <td className="px-6 py-4.5 font-semibold">$49.00</td>
                        <td className="px-6 py-4.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-300">
                            Paid
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <button className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                            Download
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-low/20 transition-colors">
                        <td className="px-6 py-4.5 font-mono text-xs">INV-2026-003</td>
                        <td className="px-6 py-4.5">Apr 15, 2026</td>
                        <td className="px-6 py-4.5 font-semibold">$49.00</td>
                        <td className="px-6 py-4.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-300">
                            Paid
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <button className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                            Download
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-low/20 transition-colors">
                        <td className="px-6 py-4.5 font-mono text-xs">INV-2026-002</td>
                        <td className="px-6 py-4.5">Mar 15, 2026</td>
                        <td className="px-6 py-4.5 font-semibold">$49.00</td>
                        <td className="px-6 py-4.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-300">
                            Paid
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <button className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                            Download
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
