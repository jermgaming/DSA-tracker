import React, { useState, useMemo } from 'react';
import { useUsersProgress } from '../hooks/useUsersProgress';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Trophy, Users, Target, TrendingUp, BarChart3,
  ChevronDown, ChevronUp, Zap, ShieldCheck, Medal,
  Crown, Star, Flame
} from 'lucide-react';

const medalColors = { 0: '#f59e0b', 1: '#94a3b8', 2: '#d97706' };
const medalIcons = { 0: Crown, 1: Medal, 2: Star };

const ProgressBar = ({ solved, total, accent = 'var(--accent)', height = 8, showLabel = true }) => {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, fontWeight: 600 }}>
          <span>{solved}/{total}</span>
          <span style={{ color: pct > 0 ? 'var(--green)' : 'var(--text2)' }}>{pct}%</span>
        </div>
      )}
      <div style={{ height, background: 'var(--bg4)', borderRadius: height / 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: pct > 0 ? accent : 'transparent',
          borderRadius: height / 2,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)'
        }} />
      </div>
    </div>
  );
};

const TopicBar = ({ topic, solved, total }) => {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const getColor = () => {
    if (pct === 100) return 'var(--green)';
    if (pct >= 70) return 'var(--accent)';
    if (pct >= 40) return '#f59e0b';
    return 'var(--red)';
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
      <span style={{ fontSize: 12, fontWeight: 600, width: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topic}</span>
      <ProgressBar solved={solved} total={total} accent={getColor()} height={6} showLabel={false} />
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: getColor(), fontWeight: 700, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
};

const UserRow = ({ user, rank, isExpanded, onToggle }) => {
  const initials = (user.full_name || user.email || 'U').charAt(0).toUpperCase();
  const MedalIcon = medalIcons[rank] || null;

  return (
    <>
      <div
        onClick={onToggle}
        style={{
          display: 'grid', gridTemplateColumns: '32px 1fr 100px 90px 100px 60px', gap: 12,
          alignItems: 'center', padding: '11px 20px', borderBottom: '1px solid var(--border)',
          cursor: 'pointer', transition: 'background 0.15s',
          background: isExpanded ? 'var(--bg3)' : 'transparent'
        }}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--bg3)'; }}
        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {rank < 3 && MedalIcon
            ? <MedalIcon size={18} color={medalColors[rank]} />
            : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>{rank + 1}</span>
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: user.is_admin ? '#f59e0b' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: 'white', flexShrink: 0 }}>{initials}</div>
          }
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name || user.email}</span>
              {user.is_admin && <span className="tag tag-easy" style={{ fontSize: 9, padding: '1px 5px' }}>Admin</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
          </div>
        </div>
        <div>
          <ProgressBar solved={user.totalSolved} total={user.totalQuestions} accent="var(--green)" height={6} showLabel={false} />
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)', marginTop: 2 }}>
            {user.totalSolved}/{user.totalQuestions}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--yellow)' }}>
          <Flame size={14} /> {user.streak.current_streak}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>
          {user.lastActive ? formatDistanceToNow(user.lastActive, { addSuffix: true }) : 'Never'}
        </div>
        <div style={{ textAlign: 'right' }}>
          {isExpanded ? <ChevronUp size={16} color="var(--text2)" /> : <ChevronDown size={16} color="var(--text2)" />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '16px 20px 20px 64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Topic breakdown */}
            <div>
              <h4 style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--text2)', letterSpacing: '0.02em' }}>BY TOPIC</h4>
              {Object.entries(user.topicBreakdown).sort(([,a], [,b]) => b.total - a.total).map(([topic, { solved, total }]) => (
                <TopicBar key={topic} topic={topic} solved={solved} total={total} />
              ))}
            </div>
            {/* Difficulty breakdown */}
            <div>
              <h4 style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--text2)', letterSpacing: '0.02em' }}>BY DIFFICULTY</h4>
              {['Easy', 'Medium', 'Hard'].map(diff => {
                const bd = user.difficultyBreakdown[diff] || { solved: 0, total: 0 };
                return (
                  <TopicBar key={diff} topic={diff} solved={bd.solved} total={bd.total} />
                );
              })}
              {user.totalQuestions > 0 && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: `conic-gradient(var(--green) 0deg ${user.percent * 3.6}deg, var(--bg4) ${user.percent * 3.6}deg 360deg)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
                        {user.percent}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>Overall</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{user.totalSolved} of {user.totalQuestions} problems solved</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function ProgressPage() {
  const { users, questions, loading, error, refetch } = useUsersProgress();
  const [expandedUser, setExpandedUser] = useState(null);
  const [viewMode, setViewMode] = useState('leaderboard'); // 'leaderboard' | 'topics'

  const topicSummary = useMemo(() => {
    const summary = {};
    questions.forEach(q => {
      if (!summary[q.topic]) summary[q.topic] = { total: 0, solved: 0, userCount: 0 };
      summary[q.topic].total++;
    });
    users.forEach(u => {
      Object.entries(u.topicBreakdown).forEach(([topic, { solved }]) => {
        if (summary[topic]) {
          summary[topic].solved += solved;
          if (solved > 0) summary[topic].userCount++;
        }
      });
    });
    return Object.entries(summary)
      .sort(([,a], [,b]) => b.total - a.total)
      .map(([topic, data]) => ({ topic, ...data }));
  }, [users, questions]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (error) return (
    <div className="empty-state">
      <ShieldCheck size={48} />
      <h3>Error Loading Data</h3>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={refetch} style={{ marginTop: 16 }}>Retry</button>
    </div>
  );

  const avgPercent = users.length > 0
    ? Math.round(users.reduce((s, u) => s + u.percent, 0) / users.length)
    : 0;

  const totalSolvedAll = users.reduce((s, u) => s + u.totalSolved, 0);
  const activeToday = users.filter(u =>
    u.streak.last_solved_date === format(new Date(), 'yyyy-MM-dd')
  ).length;

  return (
    <div className="fade-in" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <BarChart3 size={22} color="var(--accent)" />
          <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em' }}>Leaderboard</h1>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Track how all registered users are progressing through the DSA problem bank</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <Users size={22} color="var(--accent)" style={{ marginBottom: 6 }} />
          <div style={{ fontWeight: 800, fontSize: 28, fontFamily: 'var(--font-display)' }}>{users.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Total Users</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <Target size={22} color="var(--green)" style={{ marginBottom: 6 }} />
          <div style={{ fontWeight: 800, fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>{avgPercent}%</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Avg Completion</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <Trophy size={22} color="#f59e0b" style={{ marginBottom: 6 }} />
          <div style={{ fontWeight: 800, fontSize: 28, fontFamily: 'var(--font-display)', color: '#f59e0b' }}>{totalSolvedAll}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Total Problems Solved</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <Zap size={22} color="var(--accent)" style={{ marginBottom: 6 }} />
          <div style={{ fontWeight: 800, fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{activeToday}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Active Today</div>
        </div>
      </div>

      {/* View mode toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg2)', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid var(--border)' }}>
        {[
          { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
          { id: 'topics', icon: TrendingUp, label: 'Topic Summary' }
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setViewMode(id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, border: 'none',
            background: viewMode === id ? 'var(--accent)' : 'none', color: viewMode === id ? 'white' : 'var(--text2)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'all 0.2s'
          }}>
            <Icon size={16} /> {label}
          </button>
        ))}
        <button onClick={refetch} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto', alignSelf: 'center', marginRight: 4 }}>
          Refresh
        </button>
      </div>

      {/* Leaderboard view */}
      {viewMode === 'leaderboard' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '32px 1fr 100px 90px 100px 60px', gap: 12, fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <span>#</span>
            <span>User</span>
            <span>Progress</span>
            <span>Streak</span>
            <span>Last Active</span>
            <span />
          </div>

          {users.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>No users found.</div>
          ) : (
            users.map((u, i) => (
              <UserRow
                key={u.id}
                user={u}
                rank={i}
                isExpanded={expandedUser === u.id}
                onToggle={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Topic summary view */}
      {viewMode === 'topics' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Topic-wise completion across all users
          </div>
          <div style={{ padding: 20 }}>
            {topicSummary.map(({ topic, total, solved, userCount }) => {
              const avgPct = total > 0 ? Math.round((solved / (total * users.length)) * 100) : 0;
              return (
                <div key={topic} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{topic}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                      {userCount}/{users.length} users · {total} questions
                    </span>
                  </div>
                  <ProgressBar
                    solved={solved} total={total * users.length}
                    accent={avgPct >= 50 ? 'var(--green)' : avgPct >= 25 ? '#f59e0b' : 'var(--red)'}
                    height={10} showLabel={false}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    {solved} total solves across {users.length} users — avg {avgPct}% completion
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
