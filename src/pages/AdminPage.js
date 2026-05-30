import React, { useState, useEffect, useCallback } from 'react';
import { useAdminQuestions } from '../hooks/useAdmin';
import { useQuestions } from '../hooks/useQuestions';
import { useAuth } from '../hooks/useAuth';
import { Plus, Pencil, Trash2, Users, BookOpen, X, Check, ExternalLink, ShieldCheck } from 'lucide-react';

const TOPICS = ['Arrays', 'Strings', 'Trees', 'Dynamic Programming', 'Graphs', 'Linked Lists', 'Binary Search', 'Backtracking', 'Heap', 'Trie', 'Stack', 'Queue', 'Two Pointers', 'Sliding Window'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const emptyForm = { title: '', difficulty: 'Medium', topic: 'Arrays', description: '', link: '', order_index: 0 };

const QuestionModal = ({ question, onSave, onClose, saving, error }) => {
  const [form, setForm] = useState(question || emptyForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 18 }}>{question ? 'Edit Question' : 'New Question'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {error && <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Two Sum" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Topic</label>
              <select className="input" value={form.topic} onChange={e => set('topic', e.target.value)}>
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief problem description..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="label">Link (LeetCode / HackerRank)</label>
            <input className="input" value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://leetcode.com/problems/..." />
          </div>
          <div>
            <label className="label">Order Index</label>
            <input className="input" type="number" value={form.order_index} onChange={e => set('order_index', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving || !form.title} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? <div className="spinner" /> : <><Check size={16} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const { questions, loading, refetch } = useQuestions();
  const { createQuestion, updateQuestion, deleteQuestion, getAllUsers, saving, error } = useAdminQuestions();
  const [tab, setTab] = useState('questions');
  const [modal, setModal] = useState(null); // null | 'new' | question_obj
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [getAllUsers]);

  useEffect(() => {
    if (tab === 'users') loadUsers();
  }, [tab, loadUsers]);

  if (!isAdmin) return (
    <div className="empty-state">
      <ShieldCheck size={48} />
      <h3>Access Denied</h3>
      <p>You don't have admin privileges.</p>
    </div>
  );

  const handleSave = async (form) => {
    let ok;
    if (modal === 'new') {
      ok = await createQuestion(form);
    } else {
      ok = await updateQuestion(modal.id, form);
    }
    if (ok) { setModal(null); refetch(); }
  };

  const handleDelete = async (id) => {
    const ok = await deleteQuestion(id);
    if (ok) { setDeleteConfirm(null); refetch(); }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 920 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <ShieldCheck size={22} color="var(--accent)" />
          <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em' }}>Admin Panel</h1>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Manage questions and view user progress</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg2)', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid var(--border)' }}>
        {[{ id: 'questions', icon: BookOpen, label: `Questions (${questions.length})` }, { id: 'users', icon: Users, label: 'Users' }].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, border: 'none',
            background: tab === id ? 'var(--accent)' : 'none', color: tab === id ? 'white' : 'var(--text2)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'all 0.2s'
          }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'questions' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setModal('new')}>
              <Plus size={16} /> Add Question
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 100px 140px 80px', gap: 12, fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <span>Title / Topic</span><span>Difficulty</span><span>Link</span><span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ display: 'inline-block' }} /></div>
              : questions.map(q => (
                <div key={q.id} style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 100px 140px 80px', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{q.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{q.topic}</div>
                  </div>
                  <span className={`tag tag-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                  <div>
                    {q.link ? <a href={q.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)' }}><ExternalLink size={13} /> View</a> : <span style={{ fontSize: 12, color: 'var(--text2)' }}>—</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setModal(q)} title="Edit"><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(q)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px', gap: 12, fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <span>User</span><span>Joined</span><span>Streak</span><span>Longest</span>
          </div>
          {usersLoading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ display: 'inline-block' }} /></div>
            : users.map(u => (
              <div key={u.id} style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name || u.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{u.email}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🔥 {u.streaks?.[0]?.current_streak ?? 0}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                  {u.streaks?.[0]?.longest_streak ?? 0}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Question modal */}
      {modal && (
        <QuestionModal
          question={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
          error={error}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
            <Trash2 size={36} color="var(--red)" style={{ marginBottom: 12 }} />
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Delete Question?</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
              "{deleteConfirm.title}" will be permanently deleted along with all user progress for this question.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDelete(deleteConfirm.id)}>
                {saving ? <div className="spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
