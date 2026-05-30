import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useUsersProgress = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const [profilesRes, questionsRes, progressRes, streaksRes] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, avatar_url, is_admin, created_at').order('created_at', { ascending: false }),
      supabase.from('questions').select('id, title, difficulty, topic, order_index').order('topic').order('order_index'),
      supabase.rpc('get_all_user_progress'),
      supabase.rpc('get_all_streaks')
    ]);

    if (!mounted.current) return;

    if (profilesRes.error) {
      console.error('Profiles fetch error:', profilesRes.error.message);
      setError('Failed to fetch profiles: ' + profilesRes.error.message);
      setLoading(false);
      return;
    }
    if (questionsRes.error) {
      console.error('Questions fetch error:', questionsRes.error.message);
      setError('Failed to fetch questions: ' + questionsRes.error.message);
      setLoading(false);
      return;
    }
    if (progressRes.error) {
      console.error('Progress fetch error:', progressRes.error.message);
      setError('Failed to fetch progress. Run the SQL functions in Supabase: ' + progressRes.error.message);
      setLoading(false);
      return;
    }
    if (streaksRes.error) {
      console.error('Streaks fetch error:', streaksRes.error.message);
    }

    const profiles = profilesRes.data || [];
    const allQuestions = questionsRes.data || [];
    const allProgress = progressRes.data || [];
    const allStreaks = streaksRes.data || [];

    const streakMap = {};
    allStreaks.forEach(s => { streakMap[s.user_id] = s; });

    const userProgressMap = {};
    const userLastActiveMap = {};
    allProgress.forEach(({ user_id, question_id, solved_date }) => {
      if (!userProgressMap[user_id]) userProgressMap[user_id] = new Set();
      userProgressMap[user_id].add(question_id);
      const d = new Date(solved_date);
      if (!userLastActiveMap[user_id] || d > userLastActiveMap[user_id]) {
        userLastActiveMap[user_id] = d;
      }
    });

    const enriched = profiles.map(p => {
      const solvedSet = userProgressMap[p.id] || new Set();
      const totalSolved = solvedSet.size;
      const totalQuestions = allQuestions.length;
      const percent = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

      const topicBreakdown = {};
      allQuestions.forEach(q => {
        if (!topicBreakdown[q.topic]) topicBreakdown[q.topic] = { total: 0, solved: 0 };
        topicBreakdown[q.topic].total++;
        if (solvedSet.has(q.id)) topicBreakdown[q.topic].solved++;
      });

      const difficultyBreakdown = {};
      allQuestions.forEach(q => {
        if (!difficultyBreakdown[q.difficulty]) difficultyBreakdown[q.difficulty] = { total: 0, solved: 0 };
        difficultyBreakdown[q.difficulty].total++;
        if (solvedSet.has(q.id)) difficultyBreakdown[q.difficulty].solved++;
      });

      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        is_admin: p.is_admin,
        created_at: p.created_at,
        streak: streakMap[p.id] || { current_streak: 0, longest_streak: 0, last_solved_date: null },
        totalSolved,
        totalQuestions,
        percent,
        lastActive: userLastActiveMap[p.id] || null,
        topicBreakdown,
        difficultyBreakdown
      };
    });

    enriched.sort((a, b) => {
      if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
      return b.streak.current_streak - a.streak.current_streak;
    });

    if (mounted.current) {
      setUsers(enriched);
      setQuestions(allQuestions);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchAll();

    const progressSub = supabase
      .channel('admin-progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_progress' }, () => fetchAll())
      .subscribe();

    const streakSub = supabase
      .channel('admin-streaks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'streaks' }, () => fetchAll())
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchAll();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      progressSub.unsubscribe();
      streakSub.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, fetchAll]);

  return { users, questions, loading, error, refetch: fetchAll };
};
