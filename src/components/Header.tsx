import React, { useState } from 'react';
import { ShoppingCart, ChevronDown, Globe, Menu, X, Gift, ShieldAlert, Settings, Sparkles, Check, Moon, Sun } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../i18n/translations';

interface HeaderProps {
  onScrollToSection: (sectionId: string) => void;
  onOpenBooking: () => void;
  onOpenDashboard: () => void;
}

export default function Header({ onScrollToSection, onOpenBooking, onOpenDashboard }: HeaderProps) {
  const { user, profile, signInWithGoogle, signInAsDemo, signInWithCredentials, logout } = useAuth();
  const { settings } = useDb();
  const { t, tt, lang, setLang } = useLanguage();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('home');
  // Dark mode: the <html> class is applied before first paint by index.html,
  // so initialise from the DOM and keep localStorage in sync on toggle.
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* storage unavailable */ }
  };
  const [showSignIn, setShowSignIn] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  
  // Custom credential login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigationItems = [
    { labelKey: 'nav.home', id: 'home' },
    { labelKey: 'nav.egyptTours', id: 'easter-tours', hasDropdown: true },
    { labelKey: 'nav.aboutUs', id: 'sustainability' },
    { labelKey: 'nav.bookingsLogs', id: 'filtered-tours' },
    { labelKey: 'nav.specialOffers', id: 'offers' }
  ];

  const handleDemoSignIn = async (role: UserRole) => {
    await signInAsDemo(role);
    setShowSignIn(false);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      const success = await signInWithCredentials(loginUsername, loginPassword);
      if (success) {
        setShowSignIn(false);
        setLoginUsername('');
        setLoginPassword('');
        setLoginError('');
      } else {
        setLoginError(t('auth.wrongCreds'));
      }
    } catch (err) {
      console.error(err);
      setLoginError(t('auth.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isManager = profile && (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'editor');

  return (
    <>
      {/* Top Special Dynamic Banner Promo */}
      <div id="top-promo-banner" className="bg-[#123da5] text-white py-2.5 px-4 sticky top-0 z-50 transition-all text-xs sm:text-sm font-medium shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="p-1 bg-white/15 rounded-full flex items-center justify-center animate-pulse">
              <Gift className="w-4 h-4 text-orange-300" />
            </span>
            <span className="text-center sm:text-left tracking-wide">
              {settings?.promoBannerText ? tt(settings.promoBannerText) : t('banner.promo')}
            </span>
          </div>
          <button
            onClick={onOpenBooking}
            className="bg-[#f08c1c] hover:bg-orange-500 text-white font-semibold px-5 py-1.5 rounded-full shadow-lg transition duration-300 hover:scale-105 active:scale-95 text-xs tracking-wider"
          >
            {t('banner.bookNow')}
          </button>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header id="main-navigation" className="bg-white border-b border-gray-100 z-40 relative font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <div 
            onClick={() => onScrollToSection('home')} 
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Official brand logo (public/logo.jpeg) */}
              <img
                src="/logo.jpeg"
                alt="Official logo"
                className="w-full h-full rounded-xl object-cover shadow-sm transition duration-300 group-hover:scale-105"
              />
            </div>
            
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#123da5] tracking-tight leading-none group-hover:text-amber-500 transition duration-150">
                {settings?.siteName || 'EAGLE TRIPS'}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-extrabold leading-tight">
                SINCE <span className="text-orange-500">TOURS</span> 1970
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navigationItems.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => {
                    setActiveMenu(item.id);
                    onScrollToSection(item.id);
                  }}
                  className={`flex items-center gap-1 font-medium text-sm transition py-2 ${
                    activeMenu === item.id
                      ? 'text-[#123da5] font-bold border-b-2 border-amber-500'
                      : 'text-gray-700 hover:text-[#123da5]'
                  }`}
                >
                  {t(item.labelKey)}
                  {item.hasDropdown && <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#123da5] transition-all" />}
                </button>

                {item.hasDropdown && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
                    <button onClick={() => onScrollToSection('easter-tours')} className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#123da5] text-xs font-semibold">{t('nav.easterTours')}</button>
                    <button onClick={() => onScrollToSection('offers')} className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#123da5] text-xs font-semibold">✨ {t('nav.specialOffers')}</button>
                    <button onClick={() => onScrollToSection('filtered-tours')} className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#123da5] text-xs font-semibold">{t('nav.excursions')}</button>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Header Menu Items */}
          <div className="hidden lg:flex items-center gap-5">
            
            {/* Launch Admin Dashboard for Managers */}
            {isManager && (
              <button 
                onClick={onOpenDashboard}
                className="flex items-center gap-2 bg-slate-900 hover:bg-[#123da5] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md hover:scale-105 active:scale-95 cursor-pointer border border-[#f08c1c]"
              >
                <Settings className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>{t('header.adminDashboard')}</span>
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 rounded-full bg-gray-50 hover:bg-gray-100 transition cursor-pointer border border-gray-100"
            >
              {darkMode
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-[#123da5]" />}
            </button>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                onBlur={() => setTimeout(() => setLangOpen(false), 150)}
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                title={t('header.language')}
                className="flex items-center gap-1.5 text-gray-700 hover:text-[#123da5] text-xs font-semibold bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition"
              >
                <Globe className="w-4 h-4 text-[#123da5]" />
                <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <ul
                  role="listbox"
                  className="absolute end-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-fade-in"
                >
                  {LANGUAGES.map((l) => (
                    <li key={l.code}>
                      <button
                        role="option"
                        aria-selected={l.code === lang}
                        onMouseDown={(e) => { e.preventDefault(); setLang(l.code); setLangOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50 ${
                          l.code === lang ? 'text-[#123da5] bg-indigo-50/40' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-base leading-none">{l.flag}</span>
                        <span className="flex-1 text-start">{l.label}</span>
                        {l.code === lang && <Check className="w-4 h-4 text-[#123da5]" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Authentication Button */}
            {profile ? (
              <div className="flex items-center gap-3 bg-indigo-50/50 p-1.5 px-3 rounded-full border border-[#123da5]/10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  profile.role === 'super_admin' ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' :
                  profile.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {profile.role === 'super_admin' ? 'SA' : profile.role === 'admin' ? 'A' : 'E'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-extrabold text-slate-900 leading-none truncate max-w-[100px]">{profile.name}</span>
                  <span className="text-[9px] text-[#123da5] font-bold mt-0.5 uppercase">{profile.role}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-red-500 transition ml-2 text-xs font-semibold"
                  title={t('header.logout')}
                >
                  {t('header.logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSignIn(true)}
                className="text-[#123da5] border-2 border-[#123da5] hover:bg-[#123da5] hover:text-white px-5 py-2 rounded-full text-sm font-bold transition duration-200 cursor-pointer"
              >
                {t('header.signIn')}
              </button>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={toggleTheme}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-full bg-gray-50 border border-gray-100 transition cursor-pointer"
            >
              {darkMode
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-[#123da5]" />}
            </button>
            {isManager && (
              <button 
                onClick={onOpenDashboard}
                className="p-2 border-2 border-amber-400 rounded-full bg-slate-900 hover:bg-slate-800 transition shadow-inner"
                title="Admin Dashboard"
              >
                <Settings className="w-4.5 h-4.5 text-amber-400" />
              </button>
            )}
            <button 
              onClick={() => setDrawerOpen(!drawerOpen)} 
              className="p-2 text-gray-700 hover:text-[#123da5] transition cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Slide Nav */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden font-sans">
          <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-xs" />
          
          <div className="fixed top-0 right-0 w-80 max-w-full h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between z-10 text-left" dir="ltr">
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-[#123da5] text-lg">{settings?.siteName || 'EAGLE TRIPS'}</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-full bg-gray-100">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveMenu(item.id);
                      onScrollToSection(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`block w-full text-left py-2 font-semibold text-base transition ${
                      activeMenu === item.id ? 'text-[#123da5] font-bold border-l-4 border-[#f08c1c] pl-3' : 'text-gray-700'
                    }`}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}

                {/* Language selector (mobile) */}
                <div className="pt-4 mt-2 border-t border-gray-100">
                  <span className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">{t('header.language')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => setLang(l.code)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition ${
                          l.code === lang ? 'border-[#123da5] bg-indigo-50/50 text-[#123da5]' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        <span className="text-base leading-none">{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              {profile ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-900 font-extrabold text-sm block">{profile.name}</span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{profile.role}</span>
                  </div>
                  <button
                    onClick={() => { logout(); setDrawerOpen(false); }}
                    className="text-red-500 font-extrabold text-sm"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowSignIn(true); setDrawerOpen(false); }}
                  className="w-full bg-[#123da5] text-white py-3 rounded-full font-bold text-center hover:bg-slate-900 transition"
                >
                  {t('header.signIn')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sign In Interactive Modal Backdrop with Secure Username/Password Admin Logins */}
      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans animate-fade-in text-left" dir="ltr">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl border border-gray-100">
            {/* Pyramid decorative header */}
            <div className="bg-[#123da5] text-white px-6 py-8 relative">
              <button 
                onClick={() => {
                  setShowSignIn(false);
                  setLoginError('');
                  setLoginUsername('');
                  setLoginPassword('');
                }} 
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-bold tracking-tight mb-1">Admin Dashboard Authentication</h3>
              <p className="text-xs text-indigo-200">Please authenticate with the admin credentials below to edit the site packages and settings</p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="p-6 space-y-4 text-left">
              
              {/* Error Alert Display */}
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter admin username"
                    className="w-full bg-slate-50 border border-gray-200 focus:border-[#123da5] focus:bg-white text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                    Password
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-black text-[#123da5] hover:text-amber-500"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full bg-slate-50 border border-gray-200 focus:border-[#123da5] focus:bg-white text-slate-900 rounded-xl px-4 py-3 text-sm font-semibold transition-all outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#123da5] hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition duration-150 flex items-center justify-center gap-2.5 shadow-md text-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>Log In to Dashboard</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
