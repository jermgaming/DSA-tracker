import React, { useState, useMemo } from 'react';
import { useQuestions } from '../hooks/useQuestions';
import { Search, Filter, ExternalLink, CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';

const TOPICS = ['All', 'Arrays', 'Strings', 'Trees', 'Dynamic Programming', 'Graphs', 'Linked Lists', 'Binary Search', 'Backtracking', 'Heap', 'Trie'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const DiffTag = ({ difficulty }) => (
  <span className={`tag tag-${difficulty.toLowerCase()}`}>{difficulty}</span>
);

const QuestionRow = ({ question, isSolved, onToggle }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px',
    background: isSolved ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.2s',
    cursor: 'pointer'
  }}
    onClick={() => onToggle(question.id)}
    onMouseEnter={e => { if (!isSolved) e.currentTarget.style.background = 'var(--bg4)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = isSolved ? 'rgba(34, 197, 94, 0.04)' : 'transparent'; }}
  >
    <div style={{ flexShrink: 0, color: isSolved ? 'var(--green)' : 'var(--border2)', transition: 'color 0.2s' }}>
      {isSolved ? <CheckCircle2 size={20} /> : <Circle size={20} />}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontWeight: 600, fontSize: 14,
        textDecoration: isSolved ? 'line-through' : 'none',
        color: isSolved ? 'var(--text2)' : 'var(--text)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {question.title}
      </div>
      {question.description && (
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {question.description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
      <DiffTag difficulty={question.difficulty} />
      {question.link && (
        <a href={question.link} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: 'var(--text2)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text2)'; }}
        >
          <ExternalLink size={15} />
        </a>
      )}
    </div>
  </div>
);

const TopicGroup = ({ topic, questions, solvedSet, onToggle }) => {
  const [open, setOpen] = useState(true);
  const solved = questions.filter(q => solvedSet.has(q.id)).length;
  const pct = questions.length > 0 ? (solved / questions.length) * 100 : 0;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 16px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        {open ? <ChevronDown size={18} color="var(--text2)" /> : <ChevronRight size={18} color="var(--text2)" />}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{topic}</span>
            <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>{solved}/{questions.length}</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, marginTop: 8, overflow: 'hidden', width: 120 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 2, transition: 'width 0.5s' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Easy', 'Medium', 'Hard'].map(d => {
            const count = questions.filter(q => q.difficulty === d).length;
            if (!count) return null;
            return <span key={d} className={`tag tag-${d.toLowerCase()}`}>{count} {d}</span>;
          })}
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {questions.map(q => <QuestionRow key={q.id} question={q} isSolved={solvedSet.has(q.id)} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
};

export default function QuestionsPage() {
  const { groupedByTopic, todayProgress, loading, toggleQuestion } = useQuestions();
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');

  const filtered = useMemo(() => {
    const result = {};
    Object.entries(groupedByTopic).forEach(([topic, qs]) => {
      if (topicFilter !== 'All' && topic !== topicFilter) return;
      const filtered = qs.filter(q => {
        const matchesDiff = diffFilter === 'All' || q.difficulty === diffFilter;
        const matchesSearch = !search || q.title.toLowerCase().includes(search.toLowerCase());
        return matchesDiff && matchesSearch;
      });
      if (filtered.length > 0) result[topic] = filtered;
    });
    return result;
  }, [groupedByTopic, topicFilter, diffFilter, search]);

  const allQs = Object.values(filtered).flat();
  const totalSolvedToday = allQs.filter(q => todayProgress.has(q.id)).length;

  return (
    <div className="fade-in" style={{ maxWidth: 860 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6 }}>Questions</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          {totalSolvedToday} solved today — check off questions as you go. Checkboxes reset each day.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Topic filter */}
        <div style={{ position: 'relative' }}>
          <Filter size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', pointerEvents: 'none' }} />
          <select className="input" style={{ paddingLeft: 32, width: 'auto', minWidth: 160 }} value={topicFilter} onChange={e => setTopicFilter(e.target.value)}>
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Difficulty filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setDiffFilter(d)} className={`btn btn-sm ${diffFilter === d ? 'btn-primary' : 'btn-secondary'}`}
              style={d !== 'All' && diffFilter !== d ? { color: `var(--${d.toLowerCase()})`, borderColor: `var(--${d.toLowerCase()}-bg)` } : {}}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : Object.keys(filtered).length === 0 ? (
        <div className="empty-state">
          <Search size={48} />
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No questions found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        Object.entries(filtered).sort(([a], [b]) => a.localeCompare(b)).map(([topic, qs]) => (
          <TopicGroup key={topic} topic={topic} questions={qs} solvedSet={todayProgress} onToggle={toggleQuestion} />
        ))
      )}
    </div>
  );
}
