import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { learningApi } from '../services/api';
import { 
  BookOpen, 
  Send, 
  CheckCircle, 
  HelpCircle, 
  Award, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';

export default function LearningPage() {
  const { user, isAuthenticated, setAuthModalOpen, setAuthMode } = useAuth();

  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [role, setRole] = useState(user?.targetRole || 'Fullstack Engineer');
  const [difficulty, setDifficulty] = useState('intermediate');

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  const [loadingDomains, setLoadingDomains] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [askingQuestion, setAskingQuestion] = useState(false);

  const [userAnswer, setUserAnswer] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDomains();
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedDomain) {
      fetchTopics(selectedDomain);
    }
  }, [selectedDomain]);

  const fetchDomains = async () => {
    setLoadingDomains(true);
    try {
      const res = await learningApi.getDomains();
      const list = res?.data || [];
      setDomains(list);
      if (list.length > 0 && !selectedDomain) {
        setSelectedDomain(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoadingDomains(false);
    }
  };

  const fetchTopics = async (domainId) => {
    try {
      const res = await learningApi.getTopics(domainId);
      const list = res?.data || [];
      setTopics(list);
      if (list.length > 0) {
        setSelectedTopic(list[0]);
      }
    } catch (err) {
      console.error('Failed to load topics:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await learningApi.getSessions();
      setSessions(res?.data || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    setError(null);
    setStartingSession(true);
    try {
      const res = await learningApi.createSession({
        domain: selectedDomain,
        topic: selectedTopic,
        role: role || 'Software Engineer',
        difficulty,
      });
      setActiveSession(res?.data);
      fetchSessions();
    } catch (err) {
      setError(err.message || 'Failed to start learning session.');
    } finally {
      setStartingSession(false);
    }
  };

  const handleSelectExistingSession = async (sessionId) => {
    setError(null);
    try {
      const res = await learningApi.getSessionById(sessionId);
      setActiveSession(res?.data);
    } catch (err) {
      setError(err.message || 'Failed to load session details.');
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!userQuestion.trim() || !activeSession) return;
    setAskingQuestion(true);
    setError(null);
    try {
      const res = await learningApi.postMessage(activeSession._id, userQuestion.trim());
      setActiveSession(res?.data?.session);
      setUserQuestion('');
    } catch (err) {
      setError(err.message || 'Failed to send question to AI.');
    } finally {
      setAskingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || !activeSession) return;
    setSubmittingAnswer(true);
    setError(null);
    try {
      const res = await learningApi.submitAnswer(activeSession._id, userAnswer.trim());
      setActiveSession(res?.data?.session);
      setUserAnswer('');
    } catch (err) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">AI Interactive Tutor</h2>
        <p className="text-gray-500 max-w-md mx-auto mt-2 text-sm">
          Sign in or create an account to start personalized AI lessons, ask questions, and test your knowledge.
        </p>
        <button
          onClick={() => {
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
          className="mt-6 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200"
        >
          Sign In to Access Tutor
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Session Active View */}
      {activeSession ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSession(null)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase">
                  {activeSession.difficulty}
                </span>
                <h1 className="text-lg font-bold text-gray-900 mt-1">{activeSession.topic}</h1>
                <p className="text-xs text-gray-500">Domain: {activeSession.domain} | Target: {activeSession.role}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">Mastery Score</p>
              <p className="text-xl font-extrabold text-indigo-600">{activeSession.masteryScore || 0}%</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Interactive Lesson History */}
          <div className="space-y-4">
            {activeSession.interactions?.map((item, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-xl border ${
                  item.type === 'EXPLANATION'
                    ? 'bg-white border-gray-200 shadow-sm'
                    : item.type === 'QUESTION'
                    ? 'bg-indigo-50/70 border-indigo-200 ml-8'
                    : item.type === 'ANSWER'
                    ? 'bg-amber-50/70 border-amber-200 ml-8'
                    : 'bg-emerald-50/80 border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.type === 'EXPLANATION'
                        ? 'bg-gray-100 text-gray-700'
                        : item.type === 'QUESTION'
                        ? 'bg-indigo-100 text-indigo-800'
                        : item.type === 'ANSWER'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  {item.evaluation?.score !== undefined && (
                    <span className="ml-auto text-xs font-bold text-emerald-700">
                      Score: {item.evaluation.score}/100
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            {/* Action 1: Submit Answer to Check Question */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Award className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-gray-900">Knowledge Check Question</h3>
                </div>
                <p className="text-xs font-medium text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                  {activeSession.currentQuestion || 'What is the core advantage of using this concept?'}
                </p>
                <textarea
                  rows={3}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your explanation or code solution here..."
                  className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleSubmitAnswer}
                disabled={submittingAnswer || !userAnswer.trim()}
                className="mt-3 w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {submittingAnswer ? 'Evaluating with AI...' : 'Submit Answer for Grading'}
              </button>
            </div>

            {/* Action 2: Ask Clarifying Question to AI Tutor */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-violet-600 mb-2">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-gray-900">Ask AI Teacher</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Confused about something? Ask for another example, clarification, or trade-off breakdown.
                </p>
                <textarea
                  rows={3}
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="e.g. Can you show me a concrete code example of how this works in Node.js?"
                  className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button
                onClick={handlePostMessage}
                disabled={askingQuestion || !userQuestion.trim()}
                className="mt-3 w-full py-2 rounded-lg bg-violet-600 text-white font-semibold text-xs hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {askingQuestion ? 'AI Teacher is thinking...' : 'Ask AI Question'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Setup / Session Launcher View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main: Start Session Form */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Start a New AI Lesson</h2>
                <p className="text-xs text-gray-500">
                  Select a domain and topic. The AI tutor will generate an interactive lesson and quizzes.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleStartSession} className="space-y-4">
              {/* Domain selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Knowledge Domain</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {domains.map((dom) => (
                    <button
                      type="button"
                      key={dom.id}
                      onClick={() => setSelectedDomain(dom.id)}
                      className={`p-3 text-left rounded-lg border text-xs font-medium transition ${
                        selectedDomain === dom.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {dom.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {topics.map((t, idx) => (
                    <option key={idx} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Role & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Target Role</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Backend Engineer"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={startingSession || !selectedTopic}
                className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 mt-2"
              >
                {startingSession ? 'Generating AI Lesson...' : 'Launch Interactive AI Lesson'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Sidebar: Past Learning Sessions */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-sm text-gray-900">Your Learning History</h3>
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No learning sessions yet. Launch your first lesson on the left!
                </p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {sessions.map((s) => (
                    <div
                      key={s._id}
                      onClick={() => handleSelectExistingSession(s._id)}
                      className="p-3 rounded-lg border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/40 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate max-w-[160px]">
                          {s.topic}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                          {s.masteryScore || 0}%
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {new Date(s.createdAt).toLocaleDateString()} • {s.difficulty}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 text-center">
              <span className="text-[11px] text-gray-400">All progress is automatically synced with your profile</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
