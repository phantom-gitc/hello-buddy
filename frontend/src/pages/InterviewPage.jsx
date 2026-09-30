import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { interviewApi } from '../services/api';
import { 
  Mic, 
  Send, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  AlertCircle, 
  ArrowLeft, 
  Play, 
  StopCircle, 
  Clock, 
  FileCheck,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function InterviewPage() {
  const { user, isAuthenticated, setAuthModalOpen, setAuthMode } = useAuth();

  // Create form state
  const [role, setRole] = useState(user?.targetRole || 'Fullstack Developer');
  const [experienceYears, setExperienceYears] = useState(2);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [interviewType, setInterviewType] = useState('technical');
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Interviews & active session
  const [interviews, setInterviews] = useState([]);
  const [activeInterview, setActiveInterview] = useState(null);
  const [activeTurn, setActiveTurn] = useState(null);
  const [report, setReport] = useState(null);

  // User input & actions
  const [answer, setAnswer] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInterviews();
    }
  }, [isAuthenticated]);

  const fetchInterviews = async () => {
    try {
      const res = await interviewApi.getInterviews();
      setInterviews(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
    }
  };

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await interviewApi.createInterview({
        role,
        experienceYears: Number(experienceYears),
        difficulty,
        interviewType,
        durationMinutes: Number(durationMinutes),
      });
      const interview = res?.data;
      setActiveInterview(interview);
      setReport(null);
      setLastEvaluation(null);
      fetchInterviews();
    } catch (err) {
      setError(err.message || 'Failed to initialize mock interview.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!activeInterview) return;
    setError(null);
    setLoading(true);
    try {
      const res = await interviewApi.startInterview(activeInterview._id);
      setActiveTurn(res?.data);
      // Reload interview to get current turns
      const updated = await interviewApi.getInterviewById(activeInterview._id);
      setActiveInterview(updated?.data);
    } catch (err) {
      setError(err.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !activeInterview) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await interviewApi.submitAnswer(activeInterview._id, answer.trim());
      const data = res?.data;
      setLastEvaluation(data?.currentEvaluation);
      setAnswer('');

      if (data?.isCompleted) {
        setReport(data?.report);
      }

      // Refresh interview data
      const updated = await interviewApi.getInterviewById(activeInterview._id);
      setActiveInterview(updated?.data);
      setActiveTurn(data);
      fetchInterviews();
    } catch (err) {
      setError(err.message || 'Failed to evaluate answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteEarly = async () => {
    if (!activeInterview) return;
    setError(null);
    setLoading(true);
    try {
      const res = await interviewApi.completeInterview(activeInterview._id);
      setActiveInterview(res?.data);
      setReport(res?.data?.report);
      fetchInterviews();
    } catch (err) {
      setError(err.message || 'Failed to complete interview.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (interviewId) => {
    setError(null);
    try {
      const res = await interviewApi.getReport(interviewId);
      setReport(res?.data);
      const invRes = await interviewApi.getInterviewById(interviewId);
      setActiveInterview(invRes?.data);
    } catch (err) {
      setError(err.message || 'Report is not ready yet.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
          <Mic className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">AI Mock Interview Room</h2>
        <p className="text-gray-500 max-w-md mx-auto mt-2 text-sm">
          Practice realistic interviews with dynamic questions, instant scoring on technical accuracy, and full evaluation reports.
        </p>
        <button
          onClick={() => {
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
          className="mt-6 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200"
        >
          Sign In to Practice
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ================= FINAL REPORT MODAL / VIEW ================= */}
      {report && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-lg space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Evaluation Report Ready
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
                Interview Performance Review: {activeInterview?.role}
              </h1>
            </div>
            <button
              onClick={() => {
                setReport(null);
                setActiveInterview(null);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold"
            >
              Exit to Lobby
            </button>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50/60 p-5 rounded-xl border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Overall Score</p>
              <p className="text-3xl font-extrabold text-indigo-900 mt-1">{report.overallScore}/100</p>
            </div>
            <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Hiring Decision</p>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                {report.hiringRecommendation?.replace('_', ' ') || 'LEANING HIRE'}
              </p>
            </div>
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Generated Date</p>
              <p className="text-sm font-semibold text-gray-800 mt-2">
                {new Date(report.generatedAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-1">Executive Summary</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200 leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider mb-2">Key Strengths</h4>
              <ul className="space-y-1.5 text-xs text-emerald-900 list-disc list-inside">
                {report.keyStrengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200">
              <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wider mb-2">Areas for Improvement</h4>
              <ul className="space-y-1.5 text-xs text-amber-900 list-disc list-inside">
                {report.criticalWeaknesses?.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= ACTIVE INTERVIEW ROOM ================= */}
      {!report && activeInterview && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveInterview(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 uppercase">
                  {activeInterview.interviewType} • {activeInterview.difficulty}
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-1">{activeInterview.role} Mock Interview</h2>
                <p className="text-xs text-gray-500">Status: {activeInterview.status}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeInterview.status === 'CREATED' || activeInterview.status === 'READY' ? (
                <button
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  {loading ? 'Starting...' : 'Begin Questions'}
                </button>
              ) : (
                <button
                  onClick={handleCompleteEarly}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <StopCircle className="w-4 h-4" />
                  Finish & Get Report
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Question & Turn Card */}
          {activeInterview.turns && activeInterview.turns.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500 pb-3 border-b border-gray-100">
                <span className="font-semibold text-blue-600">
                  Question {(activeInterview.currentTurnIndex || 0) + 1} of {activeInterview.turns.length}
                </span>
                <span>
                  Topic: {activeInterview.turns[activeInterview.currentTurnIndex || 0]?.topic || 'Technical'}
                </span>
              </div>

              <div className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                {activeInterview.turns[activeInterview.currentTurnIndex || 0]?.question}
              </div>

              {/* Answer submission form */}
              <form onSubmit={handleSubmitAnswer} className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-gray-700">Your Candidate Response</label>
                <textarea
                  rows={5}
                  required
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Structure your answer clearly. Explain your logic, mention trade-offs, and provide examples..."
                  className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !answer.trim()}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'AI is evaluating answer...' : 'Submit Answer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Last Turn Instant Evaluation Feedback */}
          {lastEvaluation && (
            <div className="bg-emerald-50/70 rounded-xl p-5 border border-emerald-200 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Instant AI Feedback
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-extrabold">
                  Score: {lastEvaluation.score}/100
                </span>
              </div>

              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {lastEvaluation.feedback}
              </p>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-emerald-200/60">
                <div className="bg-white/80 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500">Accuracy</p>
                  <p className="text-xs font-bold text-gray-800">{lastEvaluation.technicalAccuracy}%</p>
                </div>
                <div className="bg-white/80 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500">Clarity</p>
                  <p className="text-xs font-bold text-gray-800">{lastEvaluation.communicationClarity}%</p>
                </div>
                <div className="bg-white/80 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500">Relevance</p>
                  <p className="text-xs font-bold text-gray-800">{lastEvaluation.relevance}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= INTERVIEW LOBBY & PAST SESSIONS ================= */}
      {!report && !activeInterview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Interview Form */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Configure AI Mock Interview</h2>
                <p className="text-xs text-gray-500">
                  Select your role and preferences to generate tailored interview questions and AI evaluations.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Job Role</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend React Engineer"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral (HR)</option>
                    <option value="system_design">System Design</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Junior</option>
                    <option value="intermediate">Mid-Level</option>
                    <option value="advanced">Senior / Lead</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? 'Initializing interview questions...' : 'Setup Interview Session'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Past Interviews List */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-3">Your Interview History</h3>
              {interviews.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">
                  No mock interviews completed yet. Configure and launch one!
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {interviews.map((inv) => (
                    <div
                      key={inv._id}
                      className="p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">{inv.role}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(inv.createdAt).toLocaleDateString()} • {inv.interviewType}
                        </p>
                      </div>

                      {inv.report?.overallScore ? (
                        <button
                          onClick={() => handleViewReport(inv._id)}
                          className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          {inv.report.overallScore}%
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const res = await interviewApi.getInterviewById(inv._id);
                            setActiveInterview(res?.data);
                          }}
                          className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
                        >
                          Resume
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
              Evaluated by Groq AI Career Models
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
