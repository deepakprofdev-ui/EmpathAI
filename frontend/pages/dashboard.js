import React, { useState, useEffect } from 'react';
// Analytics Layer — zero-dependency pure JS module
import { computeAnalytics } from '../utils/analytics.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// --- Modular Components ---

const GlassCard = ({ title, children, className = '', style = {} }) => (
  <div className={`glass-card ${className}`} style={{ ...style }}>
    {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text)' }}>{title}</h3>}
    {children}
  </div>
);

const ProgressBar = ({ completed, total }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{completed} of {total} exercises</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(0, 212, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>{percentage}%</span>
      </div>
      <div style={{ width: '100%', background: 'var(--surface2)', borderRadius: '50px', height: '8px', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', height: '100%', borderRadius: '50px', transition: 'width 1s ease', width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const TipCard = ({ tips }) => {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (!tips || tips.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips]);

  if (!tips || tips.length === 0) return null;

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ fontSize: '2rem', padding: '0.5rem', background: 'var(--surface2)', borderRadius: '50px' }}>💡</div>
        <div>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>AI Wellness Tip</h4>
          <p style={{ color: 'var(--text)', fontWeight: 500, lineHeight: 1.5, animation: 'fadeIn 0.5s ease-in-out' }}>"{tips[currentTip]}"</p>
        </div>
      </div>
    </GlassCard>
  );
};

// --- Main Dashboard Component ---

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [moodData, setMoodData] = useState([]);
  const [emotionData, setEmotionData] = useState({});
  const [progressData, setProgressData] = useState([]);
  const [exerciseData, setExerciseData] = useState({ completed: 0, total: 5 });
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(computeAnalytics({})); // pre-seeded default

  // AI Wellness Tips generator
  const wellnessTips = [
    "Try 2 minutes of deep breathing",
    "Write one positive thought today",
    "Take a short mindful break",
    "Practice gratitude journaling",
    "Drink a glass of water and stretch slowly"
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let userId = localStorage.getItem('empathai_user_id');
        
        // Ensure graceful session recovery
        if (!userId) {
          try {
            const token = localStorage.getItem('empathai_token');
            if (token) {
              const payload = JSON.parse(atob(token.split('.')[1]));
              if (payload && payload.id) userId = payload.id;
              if (userId) localStorage.setItem('empathai_user_id', userId);
            }
          } catch(e) { console.warn('Failed to recover user from token', e); }
        }

        if (!userId) {
          setError('User not logged in. Data represents an empty state.');
          setLoading(false);
          return;
        }

        const API = 'https://empathai-backend-s9bc.onrender.com/api';
        const res = await fetch(`${API}/dashboard/${userId}`);
        const data = await res.json();
        
        if (data.success) {
          let finalMoods = data.moods || [];
          let finalChats = data.chats || [];
          let finalEmotions = data.emotions || [];

          // Show rich sample data ONLY when the account is entirely empty
          if (finalMoods.length === 0 && finalChats.length === 0 && finalEmotions.length === 0) {
            const now = Date.now();
            const day = 24 * 60 * 60 * 1000;
            
            finalMoods = [
              { mood: 'sad', timestamp: now - 6*day },
              { mood: 'stressed', timestamp: now - 5*day },
              { mood: 'stressed', timestamp: now - 4*day },
              { mood: 'neutral', timestamp: now - 3*day },
              { mood: 'happy', timestamp: now - 2*day },
              { mood: 'happy', timestamp: now - 1*day },
              { mood: 'happy', timestamp: now }
            ];
            
            finalChats = [
              { emotion: 'sad' }, { emotion: 'sad' }, { emotion: 'stressed' },
              { emotion: 'angry' }, { emotion: 'happy' }, { emotion: 'happy' },
              { emotion: 'happy' }, { emotion: 'happy' }, { emotion: 'anxious' }
            ];

            finalEmotions = [
              { timestamp: now - 9*3600*1000, intensity: 8 },
              { timestamp: now - 8*3600*1000, intensity: 6 },
              { timestamp: now - 6*3600*1000, intensity: 7 },
              { timestamp: now - 5*3600*1000, intensity: 4 },
              { timestamp: now - 4*3600*1000, intensity: 3 },
              { timestamp: now - 2*3600*1000, intensity: 2 },
              { timestamp: now - 1*3600*1000, intensity: 2 },
              { timestamp: now, intensity: 1 }
            ];
          }

          setMoodData(finalMoods);

          const fetchedEmotions = {};
          finalChats.forEach(chat => {
            if (chat.emotion && chat.emotion !== 'neutral') {
              fetchedEmotions[chat.emotion] = (fetchedEmotions[chat.emotion] || 0) + 1;
            }
          });
          setEmotionData(fetchedEmotions);
          setProgressData(finalEmotions);

          setExerciseData({
            completed: 2,
            total: 5
          });

          // ── Analytics Layer ──────────────────────────────────────────
          const emotionsAsArray = Object.entries(fetchedEmotions).map(([emotion, count]) =>
            Array(count).fill({ emotion })
          ).flat();

          const computed = computeAnalytics({
            moods:         finalMoods,
            emotions:      emotionsAsArray,
            exercises:     [{ completed: true }, { completed: true }, {}, {}, {}], // 2/5 done
            conversations: finalChats,
          });
          setAnalytics(computed);
          // ─────────────────────────────────────────────────────────────
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- Calculations ---
  // --- Calculations ---
  // Mood text to 9-scale numeric mapping for trend visualization
  const moodMap = { 'happy': 8, 'calm': 7, 'neutral': 6, 'pressure': 5, 'sad': 4, 'anxious': 3, 'overwhelmed': 2, 'frustrated': 1, 'angry': 0 };
  
  // Format data for Mood Trend Chart
  const recentMoods = moodData.slice(-7);
  const trendChartData = {
    labels: recentMoods.length ? recentMoods.map((_, i) => `Entry ${i+1}`) : [],
    datasets: [
      {
        label: 'Mood Score',
        data: recentMoods.map(m => moodMap[(m.mood || '').toLowerCase()] || 6), // default neutral
        borderColor: '#4F46E5', // Indigo-600
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      }
    ]
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { cornerRadius: 8, padding: 12 } },
    scales: {
      y: { min: 0, max: 8, ticks: { stepSize: 1, color: '#6B7280', font: { family: "'Inter', sans-serif" }, callback: val => ['Angry', 'Frustrated', 'Overwhelmed', 'Anxious', 'Sad', 'Pressure', 'Neutral', 'Calm', 'Happy'][val] }, grid: { color: '#F3F4F6' } },
      x: { grid: { display: false }, ticks: { color: '#6B7280', font: { family: "'Inter', sans-serif" } } }
    }
  };

  // Format data for Emotion Distribution Chart
  const emotionLabels = Object.keys(emotionData);
  const emotionValues = Object.values(emotionData);
  
  const emotionColors = {
    happy: 'rgba(16, 185, 129, 0.85)', // emerald
    calm: 'rgba(52, 211, 153, 0.85)', // light emerald
    neutral: 'rgba(156, 163, 175, 0.85)',// gray
    pressure: 'rgba(96, 165, 250, 0.85)', // light blue
    sad: 'rgba(59, 130, 246, 0.85)', // blue
    anxious: 'rgba(245, 158, 11, 0.85)', // amber
    overwhelmed: 'rgba(249, 115, 22, 0.85)', // orange
    frustrated: 'rgba(244, 63, 94, 0.85)', // rose
    angry: 'rgba(239, 68, 68, 0.85)'  // red
  };
  
  const emotionChartData = {
    labels: emotionLabels.length ? emotionLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)) : ['Happy', 'Sad', 'Anxious', 'Pressure', 'Frustrated', 'Neutral', 'Angry', 'Calm', 'Overwhelmed'],
    datasets: [
      {
        label: 'Frequency',
        data: emotionValues.length ? emotionValues : [0,0,0,0,0,0,0,0,0],
        backgroundColor: emotionLabels.length ? emotionLabels.map(l => emotionColors[l.toLowerCase()] || emotionColors.neutral) : Object.values(emotionColors),
        borderRadius: 6,
        borderWidth: 0,
      }
    ]
  };

  const emotionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F3F4F6', borderDash: [4, 4] }, ticks: { precision: 0, color: '#6B7280' } },
      x: { grid: { display: false }, ticks: { color: '#6B7280', font: { family: "'Inter', sans-serif" } } }
    }
  };

  // Format data for AI Emotion Progress Chart
  const recentProgress = progressData.slice(-10);
  const progressChartData = {
    labels: recentProgress.length ? recentProgress.map(e => {
        const d = new Date(e.timestamp);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    }) : [],
    datasets: [
      {
        label: 'Emotion Intensity',
        data: recentProgress.map(e => e.intensity || 5),
        borderColor: '#10B981', // Emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      }
    ]
  };

  const progressChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { cornerRadius: 8, padding: 12 } },
    scales: {
      y: { min: 0, max: 10, ticks: { stepSize: 2, color: '#6B7280', font: { family: "'Inter', sans-serif" } }, grid: { color: '#F3F4F6', borderDash: [4, 4] } },
      x: { grid: { display: false }, ticks: { color: '#6B7280', font: { family: "'Inter', sans-serif" } } }
    }
  };

  // ── Analytics outputs (sourced from analytics.js) ───────────────────────
  const stressPercentage = analytics.stressPercentage;
  const stressMessage    = analytics.wellnessInsight;
  const avgMoodScore     = analytics.averageMoodScore;
  const exerciseRate     = analytics.exerciseCompletion;
  const totalMessages    = analytics.totalMessages;
  // ─────────────────────────────────────────────────────────────────────────

  // --- Rendering ---
  
  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
        
        {/* Header */}
        <div className="view-header" style={{ marginBottom: '2rem' }}>
            <div>
                <h2>Your Progress Dashboard</h2>
                <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>Analytics based on your mood logs and chat history.</p>
            </div>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem' }}>
                  ⚠️ {error}
              </div>
            )}
        </div>

        {/* Dashboard Grid Container: Native dash-grid (3 cols) */}
        <div className="dash-grid mb-2">
            <GlassCard title="Mindful Exercises">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Complete your mindful exercises to reach your weekly goal.</p>
              <ProgressBar completed={exerciseData.completed} total={exerciseData.total} />
            </GlassCard>

            <GlassCard title="Stress Insights">
               <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                 <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '16px', fontSize: '2rem', color: '#F59E0B' }}>🧘</div>
                 <div>
                   <h4 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>{stressPercentage}%</h4>
                   <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Stress Level</p>
                 </div>
               </div>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>{stressMessage}</p>
            </GlassCard>

            <TipCard tips={wellnessTips} />
        </div>

        {/* Charts Row: Native charts-row (2 cols) */}
        <div className="charts-row mb-2">
            <GlassCard title="Mood Trend History" className="chart-card">
              <div style={{ position: 'relative', height: '250px' }}>
                {recentMoods.length > 0 ? (
                  <Line data={trendChartData} options={trendChartOptions} />
                ) : (
                  <div className="chart-empty-state">
                    <i className="ph ph-trend-up" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-dim)' }}></i>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No mood data yet</p>
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard title="Emotion Distribution" className="chart-card">
              <div style={{ position: 'relative', height: '250px' }}>
                {emotionLabels.length > 0 ? (
                  <Bar data={emotionChartData} options={emotionChartOptions} />
                ) : (
                  <div className="chart-empty-state">
                    <i className="ph ph-chart-bar" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-dim)' }}></i>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No emotion data yet</p>
                  </div>
                )}
              </div>
            </GlassCard>
        </div>

        {/* Full-width bottom section for Emotion Progress */}
        <div style={{ width: '100%', paddingBottom: '2.5rem' }}>
          <GlassCard title="Emotion Detection Progress" className="chart-card mt-2">
            <div style={{ position: 'relative', height: '320px', width: '100%' }}>
              {recentProgress.length > 0 ? (
                <Line data={progressChartData} options={progressChartOptions} />
              ) : (
                <div className="chart-empty-state">
                  <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No AI data yet. Start chatting to track.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Global Style overrides for Keyframes inline */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

    </div>
  );
}

// Mount the React Application into the DOM
import { createRoot } from 'react-dom/client';

if (typeof document !== 'undefined') {
  const container = document.getElementById('dashboard-view');
  if (container) {
    // Clear out the vanilla HTML inside the container
    container.innerHTML = '';
    const root = createRoot(container);
    root.render(<Dashboard />);
  }
}