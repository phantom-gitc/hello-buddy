const BASE_URL = '/api/v1';

/**
 * Universal API helper that handles JSON, file uploads, tokens, and errors
 */
export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const token = localStorage.getItem('accessToken');

  const finalHeaders = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...headers,
  };

  const config = {
    method,
    headers: finalHeaders,
    credentials: 'include',
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({ message: response.statusText }));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error?.message || 'Request failed';
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ==================== AUTH APIs ====================
export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  verifyEmail: (payload) => apiRequest('/auth/verify-email', { method: 'POST', body: payload }),
  resendOtp: (payload) => apiRequest('/auth/resend-otp', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),
  forgotPassword: (payload) => apiRequest('/auth/forgot-password', { method: 'POST', body: payload }),
  resetPassword: (payload) => apiRequest('/auth/reset-password', { method: 'POST', body: payload }),
  changePassword: (payload) => apiRequest('/auth/change-password', { method: 'POST', body: payload }),
};

// ==================== USER APIs ====================
export const userApi = {
  getProfile: () => apiRequest('/users/me'),
  updateProfile: (payload) => apiRequest('/users/me', { method: 'PATCH', body: payload }),
  updatePreferences: (payload) => apiRequest('/users/me/preferences', { method: 'PATCH', body: payload }),
  uploadAvatar: (formData) => apiRequest('/uploads/avatar', { method: 'POST', body: formData, isFormData: true }),
};

// ==================== LEARNING APIs ====================
export const learningApi = {
  getDomains: () => apiRequest('/learning/domains'),
  getTopics: (domain) => apiRequest(`/learning/topics${domain ? `?domain=${encodeURIComponent(domain)}` : ''}`),
  createSession: (payload) => apiRequest('/learning/sessions', { method: 'POST', body: payload }),
  getSessions: () => apiRequest('/learning/sessions'),
  getSessionById: (id) => apiRequest(`/learning/sessions/${id}`),
  postMessage: (id, message) => apiRequest(`/learning/sessions/${id}/message`, { method: 'POST', body: { message } }),
  submitAnswer: (id, answer) => apiRequest(`/learning/sessions/${id}/answer`, { method: 'POST', body: { answer } }),
  getProgress: () => apiRequest('/learning/progress'),
};

// ==================== INTERVIEW APIs ====================
export const interviewApi = {
  createInterview: (payload) => apiRequest('/interviews', { method: 'POST', body: payload }),
  getInterviews: () => apiRequest('/interviews'),
  getInterviewById: (id) => apiRequest(`/interviews/${id}`),
  startInterview: (id) => apiRequest(`/interviews/${id}/start`, { method: 'POST' }),
  submitAnswer: (id, answer) => apiRequest(`/interviews/${id}/answer`, { method: 'POST', body: { answer } }),
  completeInterview: (id) => apiRequest(`/interviews/${id}/complete`, { method: 'POST' }),
  getReport: (id) => apiRequest(`/interviews/${id}/report`),
};

// ==================== CHAT APIs ====================
export const chatApi = {
  createChat: (payload) => apiRequest('/chats', { method: 'POST', body: payload }),
  getChats: () => apiRequest('/chats'),
  getChatById: (id) => apiRequest(`/chats/${id}`),
  getMessages: (id) => apiRequest(`/chats/${id}/messages`),
  sendMessage: (id, payload) => apiRequest(`/chats/${id}/messages`, { method: 'POST', body: payload }),
  uploadAttachment: (id, formData) => apiRequest(`/chats/${id}/attachments`, { method: 'POST', body: formData, isFormData: true }),
  deleteChat: (id) => apiRequest(`/chats/${id}`, { method: 'DELETE' }),
};

// ==================== RESUME APIs ====================
export const resumeApi = {
  uploadResume: (formData) => apiRequest('/resumes', { method: 'POST', body: formData, isFormData: true }),
  getResumes: () => apiRequest('/resumes'),
  getResumeById: (id) => apiRequest(`/resumes/${id}`),
  analyzeResume: (id) => apiRequest(`/resumes/${id}/analyze`, { method: 'POST' }),
  getAnalysis: (id) => apiRequest(`/resumes/${id}/analysis`),
  deleteResume: (id) => apiRequest(`/resumes/${id}`, { method: 'DELETE' }),
};

// ==================== PROGRESS & HEALTH APIs ====================
export const progressApi = {
  getProgress: () => apiRequest('/progress'),
  syncProgress: () => apiRequest('/progress/sync', { method: 'POST' }),
};

export const healthApi = {
  checkHealth: () => apiRequest('/health'),
};
