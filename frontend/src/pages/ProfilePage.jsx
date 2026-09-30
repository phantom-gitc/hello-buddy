import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi, authApi } from '../services/api';
import { 
  User, 
  Settings, 
  Camera, 
  Save, 
  Lock, 
  Bell, 
  CheckCircle2, 
  AlertTriangle,
  Briefcase,
  Code
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, isAuthenticated, setAuthModalOpen, setAuthMode } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || '');
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || 'mid');
  const [bio, setBio] = useState(user?.bio || '');
  const [skillsStr, setSkillsStr] = useState((user?.skills || []).join(', '));

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(user?.preferences?.emailNotifications ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(user?.preferences?.weeklyDigest ?? true);
  const [voiceFeedback, setVoiceFeedback] = useState(user?.preferences?.voiceFeedback ?? false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTargetRole(user.targetRole || '');
      setExperienceLevel(user.experienceLevel || 'mid');
      setBio(user.bio || '');
      setSkillsStr((user.skills || []).join(', '));
      setEmailNotifications(user.preferences?.emailNotifications ?? true);
      setWeeklyDigest(user.preferences?.weeklyDigest ?? true);
      setVoiceFeedback(user.preferences?.voiceFeedback ?? false);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSavingProfile(true);

    const skills = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await userApi.updateProfile({
        name,
        targetRole,
        experienceLevel,
        bio,
        skills,
      });
      if (res?.data?.user) {
        updateUser(res.data.user);
      }
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSavingPrefs(true);
    try {
      const res = await userApi.updatePreferences({
        emailNotifications,
        weeklyDigest,
        voiceFeedback,
      });
      if (res?.data?.preferences) {
        updateUser({ ...user, preferences: res.data.preferences });
      }
      setMessage('Notification preferences updated!');
    } catch (err) {
      setError(err.message || 'Failed to update preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await userApi.uploadAvatar(formData);
      if (res?.data?.avatarUrl) {
        updateUser({ ...user, profileImage: res.data.avatarUrl });
      }
      setMessage('Avatar photo uploaded successfully!');
    } catch (err) {
      setError(err.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setMessage('Password changed successfully! Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
          <Settings className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">User Profile & Settings</h2>
        <p className="text-gray-500 max-w-md mx-auto mt-2 text-sm">
          Sign in to manage your career preferences, target roles, skills, and notification settings.
        </p>
        <button
          onClick={() => {
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
          className="mt-6 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Avatar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute inset-0 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
            title="Change photo"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center sm:text-left flex-1">
          <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-xs text-gray-500">{user?.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {user?.targetRole || 'Candidate'}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {user?.isEmailVerified ? 'Email Verified' : 'Email Unverified'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Profile Edit Form */}
        <div className="md:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-sm text-gray-900">Personal & Career Profile</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="entry">Entry-Level</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead / Architect</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="React, TypeScript, Node.js, GraphQL"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bio / Career Pitch</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Passionate engineer building scalable applications..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Right Column: Preferences & Security */}
        <div className="space-y-6">
          {/* Preferences */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Bell className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Preferences</h3>
            </div>

            <form onSubmit={handleUpdatePreferences} className="space-y-3">
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Email Notifications
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Weekly Career Digest
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceFeedback}
                  onChange={(e) => setVoiceFeedback(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Kokoro Voice Audio Feedback
              </label>

              <button
                type="submit"
                disabled={savingPrefs}
                className="w-full mt-2 py-2 rounded-lg bg-gray-100 text-gray-800 text-xs font-semibold hover:bg-gray-200 transition"
              >
                {savingPrefs ? 'Updating...' : 'Save Preferences'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Lock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Security</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">New Password (min 8)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2 rounded-lg bg-gray-100 text-gray-800 text-xs font-semibold hover:bg-gray-200 transition"
              >
                {savingPassword ? 'Changing...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
