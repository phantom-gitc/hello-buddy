import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthApi } from '../services/api';
import { 
  Sparkles, 
  BookOpen, 
  Mic, 
  MessageSquare, 
  FileText, 
  User, 
  LogOut, 
  LogIn, 
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, isAuthenticated, logout, setAuthModalOpen, setAuthMode } = useAuth();
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await healthApi.checkHealth();
        setApiOnline(res?.status === 'ok');
      } catch {
        setApiOnline(false);
      }
    }
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'learn', label: 'AI Tutor', icon: BookOpen },
    { id: 'interview', label: 'Mock Interview', icon: Mic },
    { id: 'chat', label: 'Career Chat', icon: MessageSquare },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900">HelloBuddy</span>
              <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                AI Career Prep
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right section: System Status & User Actions */}
          <div className="flex items-center gap-3">
            {/* Backend Health indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 border-gray-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiOnline === true
                    ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                    : apiOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-gray-600">
                {apiOnline === true ? 'Backend: Online' : apiOnline === false ? 'Backend: Offline' : 'Connecting...'}
              </span>
            </div>

            {/* Auth actions */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                  onClick={() => setActiveTab('profile')}
                >
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full object-cover border border-gray-300" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-gray-900 leading-none">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-gray-500 leading-none mt-1">{user?.targetRole || 'Candidate'}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-gray-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap rounded-lg text-xs font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
