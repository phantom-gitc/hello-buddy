import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';

import DashboardPage from './pages/DashboardPage';
import LearningPage from './pages/LearningPage';
import InterviewPage from './pages/InterviewPage';
import ChatPage from './pages/ChatPage';
import ResumePage from './pages/ResumePage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && <DashboardPage setActiveTab={setActiveTab} />}
        {activeTab === 'learn' && <LearningPage />}
        {activeTab === 'interview' && <InterviewPage />}
        {activeTab === 'chat' && <ChatPage />}
        {activeTab === 'resume' && <ResumePage />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {/* Global Authentication Modal */}
      <AuthModal />

      {/* Clean Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>HelloBuddy AI Career Preparation Platform &copy; {new Date().getFullYear()}</span>
          <div className="flex items-center gap-4">
            <span className="text-emerald-600 font-medium">● System Operational</span>
            <span>REST API v1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
