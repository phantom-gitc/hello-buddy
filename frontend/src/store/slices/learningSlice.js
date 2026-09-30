import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Home page hero
  hero: {
    tag: 'YOUR AI CAREER COACH',
    titlePrimary: 'Better Skills.',
    titleSecondary: 'Opportunities.',
    subtitle: 'Learn, practice and grow with AI-powered guidance tailored to your goals.',
  },
  // Learn page hero
  learnHero: {
    tag: 'LEARN WITH AI',
    titlePrimary: 'Master Skills',
    titleSecondary: 'Your Pace.',
    subtitle: 'Get interactive explanations, real examples, and personalized learning paths with AI.',
  },
  // Home page feature cards
  featureCards: [
    {
      id: '01',
      title: 'Learn with AI',
      description: 'Interactive explanations for any topic.',
      type: 'learn',
    },
    {
      id: '02',
      title: 'AI Interview Practice',
      description: 'Realistic mock interviews with AI HR & technical experts.',
      type: 'interview',
    },
    {
      id: '03',
      title: 'AI Chat',
      description: 'Ask questions, upload files and get instant answers.',
      type: 'chat',
    },
    {
      id: '04',
      title: 'Resume Analysis',
      description: 'Get AI feedback and personalized suggestions.',
      type: 'resume',
      score: 98,
    },
  ],
  // Learn page: Popular Learning Paths
  popularPaths: [
    {
      id: 'path_1',
      title: 'Web Development',
      description: 'HTML, CSS, JavaScript, React and more.',
      type: 'web',
      iconBadge: 'code',
      badgeBg: '#e0f2fe',
      badgeColor: '#0284c7',
      artwork: '/assets/learn/path-1-art.png',
      bgGradient: 'bg-gradient-to-br from-[#ffffff] via-[#fdfbf8] to-[#fbf1e6]',
      borderColor: 'border-[#f2e7d8]',
    },
    {
      id: 'path_2',
      title: 'Backend Development',
      description: 'Node.js, Express, MongoDB and system design.',
      type: 'backend',
      iconBadge: 'layers',
      badgeBg: '#f3e8ff',
      badgeColor: '#9333ea',
      artwork: '/assets/learn/path-2-art.png',
      bgGradient: 'bg-gradient-to-br from-[#ffffff] via-[#f9faff] to-[#eff4fe]',
      borderColor: 'border-[#e3ecf9]',
    },
    {
      id: 'path_3',
      title: 'Data Structures & Algorithms',
      description: 'Master problem solving step by step.',
      type: 'dsa',
      iconBadge: 'dsa',
      badgeBg: '#ffe4e6',
      badgeColor: '#e11d48',
      artwork: '/assets/learn/path-3-art.png',
      bgGradient: 'bg-gradient-to-br from-[#ffffff] via-[#fdf9fa] to-[#fdeef2]',
      borderColor: 'border-[#fae3e8]',
    },
    {
      id: 'path_4',
      title: 'Interview Preparation',
      description: 'HR, technical, behavioral and mock interviews.',
      type: 'interview_prep',
      iconBadge: 'briefcase',
      badgeBg: '#ffedd5',
      badgeColor: '#d97706',
      artwork: '/assets/learn/path-4-art.png',
      bgGradient: 'bg-gradient-to-br from-[#ffffff] via-[#fdfbf7] to-[#faefe0]',
      borderColor: 'border-[#f0e6d6]',
    },
  ],
  // Learn page: Recommended for You Courses
  recommendedCourses: [
    {
      id: 'course_1',
      title: 'React Fundamentals',
      description: 'Learn components, hooks, state and build real projects.',
      level: 'BEGINNER',
      lessonsCount: '6 lessons',
      progress: 60,
      bannerImg: '/assets/learn/course-react-banner.png',
    },
    {
      id: 'course_2',
      title: 'Node.js Backend Basics',
      description: 'Build REST APIs, authentication and work with databases.',
      level: 'INTERMEDIATE',
      lessonsCount: '8 lessons',
      progress: 40,
      bannerImg: '/assets/learn/course-node-banner.png',
    },
    {
      id: 'course_3',
      title: 'System Design',
      description: 'Learn architecture, scalability and design real-world systems.',
      level: 'ADVANCED',
      lessonsCount: '10 lessons',
      progress: 25,
      bannerImg: '/assets/learn/course-system-banner.png',
    },
  ],
  // Home page progress & activities
  progress: {
    overallPercentage: 72,
    breakdown: [
      { id: 'learning', label: 'Learning', value: '12 topics', color: '#10b981' },
      { id: 'interviews', label: 'Interviews', value: '5 sessions', color: '#38bdf8' },
      { id: 'chat', label: 'AI Chat', value: '28 messages', color: '#a855f7' },
      { id: 'resume', label: 'Resume', value: '1 uploaded', color: '#f97316' },
    ],
  },
  continueLearning: {
    category: 'REACT.JS',
    title: 'React Hooks',
    description: 'Master useState, useEffect, useMemo and more with interactive examples.',
    completedLessons: 6,
    totalLessons: 12,
    progressPercentage: 50,
  },
  recentActivities: [
    {
      id: 'act_1',
      title: 'Completed JavaScript lesson',
      time: '2 hours ago',
      type: 'lesson',
      iconBg: '#f3e8ff',
      iconColor: '#9333ea',
    },
    {
      id: 'act_2',
      title: 'Practiced a mock interview',
      time: '5 hours ago',
      type: 'interview',
      iconBg: '#ffe4e6',
      iconColor: '#f43f5e',
    },
    {
      id: 'act_3',
      title: 'Uploaded resume',
      time: '1 day ago',
      type: 'resume',
      iconBg: '#e0f2fe',
      iconColor: '#0284c7',
    },
    {
      id: 'act_4',
      title: 'Asked a question in AI Chat',
      time: '1 day ago',
      type: 'chat',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
    },
  ],
};

export const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    updateProgress: (state, action) => {
      state.progress = { ...state.progress, ...action.payload };
    },
  },
});

export const { updateProgress } = learningSlice.actions;
export default learningSlice.reducer;
