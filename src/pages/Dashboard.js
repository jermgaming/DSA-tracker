import React, { useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuestions, useStreak, useActivityCalendar, useTotalSolved } from '../hooks/useQuestions';
import { format, subDays, eachDayOfInterval, getDay } from 'date-fns';
import { Flame, Trophy, CheckCircle2, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={accent} />
      </div>
    </div>
    <div>
      <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
    <div style={{ position: 'absolute', bottom: -20, right: -10, opacity: 0.05 }}>
      <Icon size={80} />
    </div>
  </div>
);

const ActivityHeatmap = ({ activity }) => {
  const today = useMemo(() => new Date(), []);
  const start = useMemo(() => subDays(today, 364), [today]);

  const days = useMemo(() => eachDayOfInterval({ start, end: today }), [start, today]);

  // Group into weeks
  const weeks = useMemo(() => {
    const result = [];
    let currentWeek = [];
    // Pad first week
    const firstDow = getDay(days[0]);
    for (let i = 0; i < firstDow; i++) currentWeek.push(null);
    days.forEach(day => {
      if (getDay(day) === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    if (currentWeek.length > 0) result.push(currentWeek);
    return result;
  }, [days]);

  const getColor = (date) => {
    if (!date) return 'transparent';
    const key = format(date, 'yyyy-MM-dd');
    const count = activity[key] || 0;
    if (count === 0) return 'var(--bg4)';
    if (count <= 2) return 'rgba(124,92,252,0.3)';
    if (count <= 5) return 'rgba(124,92,252,0.6)';
    return 'var(--accent)';
  };

  const months = useMemo(() => {
    const seen = new Set();
    const labels = [];
    weeks.forEach((week, wi) => {
      const firstDay = week.find(d => d !== null);
      if (firstDay) {
        const month = format(firstDay, 'MMM');
        if (!seen.has(month)) { seen.add(month); labels.push({ month, wi }); }
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>Activity</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)' }}>
          Less
          {['var(--bg4)', 'rgba(124,92,252,0.3)', 'rgba(124,92,252,0.6)', 'var(--accent)'].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
          ))}
          More
        </div>
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ position: 'relative', minWidth: weeks.length * 14 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', marginBottom: 4 }}>
            {weeks.map((_, wi) => {
              const label = months.find(m => m.wi === wi);
              return (
                <div key={wi} style={{ width: 13, marginRight: 2, flexShrink: 0, fontSize: 10, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {label?.month || ''}
                </div>
              );
            })}
          </div>
          {/* Grid */}
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di] ?? null;
                  const key = day ? format(day, 'yyyy-MM-dd') : null;
                  const count = key ? (activity[key] || 0) : 0;
                  return (
                    <div key={di} title={day ? `${format(day, 'MMM d, yyyy')}: ${count} question${count !== 1 ? 's' : ''}` : ''}
                      style={{ width: 11, height: 11, borderRadius: 2, background: getColor(day), transition: 'transform 0.1s', cursor: day ? 'pointer' : 'default' }}
                      onMouseEnter={e => { if (day) e.target.style.transform = 'scale(1.3)'; }}
                      onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { questions, todayProgress, loading, refetch } = useQuestions();
  const streak = useStreak();
  const activity = useActivityCalendar();
  const totalSolved = useTotalSolved();

  // Refetch every time user lands on dashboard
  useEffect(() => { refetch(); }, []); // eslint-disable-line

  const firstName = (profile?.full_name || user?.email || '').split(' ')[0].split('@')[0];
  const todayCount = todayProgress.size;
  const totalQuestions = questions.length;
  const todayPercent = totalQuestions > 0 ? Math.round((todayCount / totalQuestions) * 100) : 0;

  const recentActivity = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, 'yyyy-MM-dd');
      return { date: format(d, 'EEE'), count: activity[key] || 0, isToday: i === 6 };
    });
  }, [activity]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', marginBottom: 4 }}>
          Hey, {firstName} 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15 }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')} — {streak.current_streak > 0 ? `${streak.current_streak} day streak 🔥` : "Let's start today!"}
        </p>
      </div>

      {/* Today's progress bar */}
      <div className="card" style={{ marginBottom: 24, background: `linear-gradient(135deg, var(--bg3), var(--bg2))` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Today's Progress</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{todayCount} of {totalQuestions} questions solved</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 28, color: todayCount > 0 ? 'var(--green)' : 'var(--text2)', fontFamily: 'var(--font-display)' }}>
            {todayPercent}%
          </div>
        </div>
        <div style={{ height: 8, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${todayPercent}%`, background: `linear-gradient(90deg, var(--accent), var(--green))`, borderRadius: 4, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        {todayCount === 0 && (
          <Link to="/questions" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', background: 'var(--accent-glow)', padding: '8px 14px', borderRadius: 8 }}>
            <Target size={14} /> Start solving questions →
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Flame} label="Current Streak" value={streak.current_streak} accent="#f59e0b" sub="consecutive days" />
        <StatCard icon={Trophy} label="Longest Streak" value={streak.longest_streak} accent="#a855f7" sub="personal best" />
        <StatCard icon={CheckCircle2} label="Total Solved" value={totalSolved} accent="#22c55e" sub="unique questions" />
        <StatCard icon={TrendingUp} label="Today" value={todayCount} accent="#3b82f6" sub={`of ${totalQuestions} questions`} />
      </div>

      {/* Activity heatmap */}
      <div style={{ marginBottom: 24 }}>
        <ActivityHeatmap activity={activity} />
      </div>

      {/* Last 7 days bar chart */}
      <div className="card">
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Last 7 Days</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
          {recentActivity.map(({ date, count, isToday }) => {
            const max = Math.max(...recentActivity.map(d => d.count), 1);
            const h = count > 0 ? Math.max((count / max) * 100, 20) : 6;
            return (
              <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: count > 0 ? 'var(--text)' : 'var(--text2)' }}>{count || ''}</div>
                <div style={{
                  width: '100%', height: `${h}%`, minHeight: 4,
                  background: count > 0 ? (isToday ? 'var(--accent)' : 'rgba(124,92,252,0.5)') : 'var(--bg4)',
                  borderRadius: '4px 4px 0 0', transition: 'all 0.3s',
                  boxShadow: count > 0 && isToday ? '0 0 12px var(--accent-glow)' : 'none'
                }} />
                <div style={{ fontSize: 11, color: isToday ? 'var(--accent)' : 'var(--text2)', fontWeight: isToday ? 700 : 400, fontFamily: 'var(--font-mono)' }}>{date}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
