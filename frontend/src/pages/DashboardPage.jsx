import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressApi } from '../services/api';
import { 
  Trophy, 
  BookOpen, 
  Mic, 
  FileText, 
  MessageSquare, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function DashboardPage({ setActiveTab }) {
  const { user, isAuthenticated, setAuthModalOpen, setAuthMode } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress();
    }
  }, [isAuthenticated]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await progressApi.getProgress();
      setProgress(res?.data || null);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await progressApi.syncProgress();
      setProgress(res?.data || null);
    } catch (err) {
      console.error('Failed to sync progress:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Sparkles className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10 mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            HelloBuddy Career Platform
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isAuthenticated ? `Welcome back, ${user?.name || 'Candidate'}!` : 'Level Up Your Technical Career'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-100">
            {isAuthenticated
              ? `Targeting: ${user?.targetRole || 'Software Engineer'}. Prepare for high-stakes interviews with live AI evaluations and structured learning.`
              : 'Interactive AI tutor, real-time mock interviews with scoring, ATS resume analysis, and tailored career preparation.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setActiveTab('interview')}
                  className="px-4 py-2 rounded-lg bg-white text-indigo-900 font-semibold text-sm hover:bg-indigo-50 transition flex items-center gap-2 shadow-sm"
                >
                  <Mic className="w-4 h-4 text-indigo-600" />
                  Start Mock Interview
                </button>
                <button
                  onClick={() => setActiveTab('learn')}
                  className="px-4 py-2 rounded-lg bg-indigo-700/80 text-white font-semibold text-sm hover:bg-indigo-700 transition flex items-center gap-2 border border-white/20"
                >
                  <BookOpen className="w-4 h-4" />
                  Explore AI Lessons
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('register');
                  setAuthModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-lg bg-white text-indigo-900 font-bold text-sm hover:bg-indigo-50 transition flex items-center gap-2 shadow-lg"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Readiness Score */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Career Readiness</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{progress?.readinessScore || 0}%</span>
              <span className="text-xs text-emerald-600 font-semibold">Weighted</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progress?.readinessScore || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Interviews */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Mic className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Interviews Completed</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{progress?.interviewsCompleted || 0}</span>
              <span className="text-xs text-gray-500">
                Avg: {progress?.averageInterviewScore ? `${progress.averageInterviewScore}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Learning Sessions */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions Mastered</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{progress?.learningSessionsCompleted || 0}</span>
              <span className="text-xs text-gray-500">
                Score: {progress?.averageLearningScore ? `${progress.averageLearningScore}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Sync / Status */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Progress State</p>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-semibold text-gray-700">Live Database</span>
            {isAuthenticated && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Core Feature Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: AI Tutor */}
          <div
            onClick={() => setActiveTab('learn')}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:border-indigo-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">AI Interactive Tutor</h3>
              <p className="text-xs text-gray-500 mt-1">
                Study curated curriculum domains with instant AI concept explanations and knowledge checks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
              <span>Start Learning</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Mock Interview */}
          <div
            onClick={() => setActiveTab('interview')}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">AI Mock Interview</h3>
              <p className="text-xs text-gray-500 mt-1">
                Real-time technical & HR interview questions, answer evaluations, and comprehensive scoring reports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
              <span>Enter Interview</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: Career Chat */}
          <div
            onClick={() => setActiveTab('chat')}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:border-violet-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-violet-600 transition">Career Assistant Chat</h3>
              <p className="text-xs text-gray-500 mt-1">
                Chat with Groq-powered AI career advisor with context from your target roles and resumes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-violet-600 font-semibold">
              <span>Open Chat</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 4: Resume Analyzer */}
          <div
            onClick={() => setActiveTab('resume')}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:border-emerald-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition">Resume ATS Analyzer</h3>
              <p className="text-xs text-gray-500 mt-1">
                Upload your PDF resume to extract key skills, ATS compatibility score, strengths and weaknesses.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
              <span>Upload Resume</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
