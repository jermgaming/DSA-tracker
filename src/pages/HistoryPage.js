import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { CalendarDays, CheckCircle2, ExternalLink } from 'lucide-react';

const DiffBadge = ({ d }) => (
  <span className={`tag tag-${d.toLowerCase()}`} style={{ fontSize: 10 }}>{d}</span>
);

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_progress')
        .select('solved_date, question_id, questions(id, title, difficulty, topic, link)')
        .eq('user_id', user.id)
        .order('solved_date', { ascending: false });

      const grouped = {};
      (data || []).forEach(row => {
        if (!grouped[row.solved_date]) grouped[row.solved_date] = [];
        if (row.questions) grouped[row.solved_date].push(row.questions);
      });
      setHistory(grouped);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Build calendar: last 30 days
  const calDays = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).reverse();

  const dates = Object.keys(history).sort((a, b) => b.localeCompare(a));
  const selectedQuestions = history[selectedDate] || [];

  return (
    <div className="fade-in" style={{ maxWidth: 860 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6 }}>History</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Your solving history across all days</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }} className="history-grid">
          {/* Calendar picker */}
          <div>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={18} /> Last 30 Days
              </div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 500, overflowY: 'auto' }}>
                {calDays.map(d => {
                  const key = format(d, 'yyyy-MM-dd');
                  const count = (history[key] || []).length;
                  const isToday = key === format(new Date(), 'yyyy-MM-dd');
                  const isSelected = key === selectedDate;
                  return (
                    <button key={key} onClick={() => setSelectedDate(key)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 8, border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                      background: isSelected ? 'var(--accent-glow)' : count > 0 ? 'var(--bg4)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : count > 0 ? 'var(--text)' : 'var(--text2)',
                      cursor: 'pointer', fontFamily: 'var(--font-display)', textAlign: 'left',
                      transition: 'all 0.15s'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{format(d, 'MMM d, yyyy')}</span>
                        {isToday && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--accent)', color: 'white', padding: '1px 6px', borderRadius: 100, fontWeight: 700 }}>TODAY</span>}
                      </div>
                      {count > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isSelected ? 'var(--accent)' : 'var(--green)' }}>
                          {count} ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* All dates with activity */}
            {dates.filter(d => !calDays.find(c => format(c, 'yyyy-MM-dd') === d)).length > 0 && (
              <div className="card" style={{ padding: 0, marginTop: 16 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>Older Activity</div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                  {dates.filter(d => !calDays.find(c => format(c, 'yyyy-MM-dd') === d)).map(d => (
                    <button key={d} onClick={() => setSelectedDate(d)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px', borderRadius: 8, border: selectedDate === d ? '1px solid var(--accent)' : '1px solid transparent',
                      background: selectedDate === d ? 'var(--accent-glow)' : 'var(--bg4)',
                      color: selectedDate === d ? 'var(--accent)' : 'var(--text)',
                      cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600
                    }}>
                      {format(new Date(d + 'T00:00:00'), 'MMM d, yyyy')}
                      <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{history[d].length} ✓</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Questions for selected date */}
          <div>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} solved</div>
                </div>
                {selectedQuestions.length > 0 && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>✓{selectedQuestions.length}</div>
                )}
              </div>
              <div style={{ minHeight: 200 }}>
                {selectedQuestions.length === 0 ? (
                  <div className="empty-state" style={{ padding: 40 }}>
                    <CalendarDays size={40} style={{ opacity: 0.3 }} />
                    <p style={{ marginTop: 12, color: 'var(--text2)' }}>No questions solved on this day</p>
                  </div>
                ) : (
                  selectedQuestions.map((q, i) => (
                    <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < selectedQuestions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <CheckCircle2 size={18} color="var(--green)" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{q.topic}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <DiffBadge d={q.difficulty} />
                        {q.link && (
                          <a href={q.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text2)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text2)'; }}>
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .history-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
