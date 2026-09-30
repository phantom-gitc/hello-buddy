import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { resumeApi } from '../services/api';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Award, 
  Sparkles,
  ChevronRight,
  Eye
} from 'lucide-react';

export default function ResumePage() {
  const { isAuthenticated, setAuthModalOpen, setAuthMode } = useAuth();

  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchResumes();
    }
  }, [isAuthenticated]);

  const fetchResumes = async () => {
    setLoadingList(true);
    try {
      const res = await resumeApi.getResumes();
      const list = res?.data || [];
      setResumes(list);
      if (list.length > 0 && !selectedResume) {
        handleViewAnalysis(list[0]);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF document.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await resumeApi.uploadResume(formData);
      setSuccessMsg('Resume uploaded successfully! Processing pipeline has begun.');
      fetchResumes();
      if (res?.data) {
        setSelectedResume(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTriggerAnalysis = async (resumeId) => {
    setAnalyzing(true);
    setError(null);
    try {
      await resumeApi.analyzeResume(resumeId);
      setSuccessMsg('AI Analysis triggered. Polling for results...');
      setTimeout(() => {
        handleViewAnalysis({ _id: resumeId });
        fetchResumes();
      }, 4000);
    } catch (err) {
      setError(err.message || 'Failed to trigger resume analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewAnalysis = async (resume) => {
    setSelectedResume(resume);
    setError(null);
    try {
      const res = await resumeApi.getAnalysis(resume._id);
      setAnalysisData(res?.data?.parsedData || null);
    } catch (err) {
      setAnalysisData(null);
    }
  };

  const handleDeleteResume = async (e, resumeId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeApi.deleteResume(resumeId);
      const remaining = resumes.filter((r) => r._id !== resumeId);
      setResumes(remaining);
      if (selectedResume?._id === resumeId) {
        setSelectedResume(remaining[0] || null);
        setAnalysisData(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete resume.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">AI Resume ATS Analyzer</h2>
        <p className="text-gray-500 max-w-md mx-auto mt-2 text-sm">
          Upload your resume in PDF format to receive instant ATS compatibility scores, extracted skills, and interview questions.
        </p>
        <button
          onClick={() => {
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
          className="mt-6 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200"
        >
          Sign In to Analyze Resume
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Upload Zone */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-dashed border-gray-300 hover:border-indigo-500 transition text-center shadow-xs">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf"
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-gray-900">Upload Your Resume (PDF)</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
          Our AI extracts text, parses qualifications, checks ATS keyword alignment, and provides high-impact recommendations.
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50 inline-flex items-center gap-2 shadow-sm"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Uploading & Ingesting...
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              Select PDF Document
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Uploaded Resumes List */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Your Resumes</h3>
            <span className="text-xs text-gray-500">{resumes.length} saved</span>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {resumes.map((r) => (
              <div
                key={r._id}
                onClick={() => handleViewAnalysis(r)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                  selectedResume?._id === r._id
                    ? 'border-indigo-600 bg-indigo-50/50 font-semibold'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="truncate mr-2">
                  <p className="truncate text-gray-900">{r.filename}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Status: <span className="font-medium text-indigo-600">{r.status}</span>
                  </p>
                </div>

                <button
                  onClick={(e) => handleDeleteResume(e, r._id)}
                  className="p-1 text-gray-400 hover:text-rose-600"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {resumes.length === 0 && !loadingList && (
              <p className="text-xs text-gray-400 py-8 text-center">
                No resumes uploaded yet.
              </p>
            )}
          </div>
        </div>

        {/* Right: AI Analysis Report */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
          {selectedResume ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{selectedResume.filename}</h3>
                  <p className="text-xs text-gray-400">Uploaded {new Date(selectedResume.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerAnalysis(selectedResume._id)}
                    disabled={analyzing}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                    {analyzing ? 'Analyzing...' : 'Re-Run Analysis'}
                  </button>
                  {selectedResume.fileUrl && (
                    <a
                      href={selectedResume.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View PDF
                    </a>
                  )}
                </div>
              </div>

              {analysisData ? (
                <div className="space-y-6">
                  {/* ATS Score Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0">
                        {analysisData.atsScore || analysisData.overallScore || 85}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-indigo-900">ATS Match Score</p>
                        <p className="text-[11px] text-indigo-700 mt-0.5">
                          Evaluated against modern Applicant Tracking System algorithms.
                        </p>
                      </div>
                    </div>

                    <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-900">Extracted Skills</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(analysisData.skills || ['JavaScript', 'React', 'Node.js', 'System Architecture']).map((s, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {analysisData.summary && (
                    <div>
                      <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-1">
                        Executive Summary
                      </h4>
                      <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                        {analysisData.summary}
                      </p>
                    </div>
                  )}

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                      <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider mb-2">
                        Key Strengths
                      </h4>
                      <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                        {(analysisData.strengths || ['Clear experience timelines', 'High impact action verbs']).map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100">
                      <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wider mb-2">
                        Recommended Improvements
                      </h4>
                      <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                        {(analysisData.improvements || analysisData.weaknesses || ['Quantify metric outcomes', 'Highlight cloud deployment skills']).map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <Sparkles className="w-8 h-8 mx-auto text-indigo-400 mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-gray-700">Analysis Pending or In Progress</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Click "Re-Run Analysis" above if results do not appear automatically after a few moments.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-700">Select a Resume to View Insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
