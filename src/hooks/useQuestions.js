import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

export const useQuestions = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [todayProgress, setTodayProgress] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('topic')
      .order('order_index');
    if (!error && isMounted.current) setQuestions(data || []);
  }, []);

  const fetchTodayProgress = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_progress')
      .select('question_id')
      .eq('user_id', user.id)
      .eq('solved_date', today);

    if (error) {
      console.error('Error fetching progress:', error.message);
      return;
    }
    if (isMounted.current) {
      setTodayProgress(new Set((data || []).map(r => r.question_id)));
    }
  }, [user, today]);

  // Initial load
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchQuestions(), fetchTodayProgress()]);
      if (isMounted.current) setLoading(false);
    };
    init();
  }, [user, fetchQuestions, fetchTodayProgress]);

  // Refetch progress when page becomes visible again
  useEffect(() => {
    if (!user) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchTodayProgress();
      }
    };
    const handleFocus = () => fetchTodayProgress();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchTodayProgress]);

  const toggleQuestion = async (questionId) => {
    if (!user) return;
    const isSolved = todayProgress.has(questionId);

    // Optimistic update first so UI feels instant
    if (isSolved) {
      setTodayProgress(prev => {
        const s = new Set(prev);
        s.delete(questionId);
        return s;
      });
    } else {
      setTodayProgress(prev => new Set([...prev, questionId]));
    }

    if (isSolved) {
      // Untick - delete from DB
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .eq('solved_date', today);

      if (error) {
        console.error('Error removing progress:', error.message);
        // Revert optimistic update on error
        setTodayProgress(prev => new Set([...prev, questionId]));
      }
    } else {
      // Tick - insert into DB
      const { error } = await supabase
        .from('user_progress')
        .upsert(
          { user_id: user.id, question_id: questionId, solved_date: today },
          { onConflict: 'user_id,question_id,solved_date' }
        );

      if (error) {
        console.error('Error saving progress:', error.message);
        // Revert optimistic update on error
        setTodayProgress(prev => {
          const s = new Set(prev);
          s.delete(questionId);
          return s;
        });
        return;
      }

      // Update streak only on successful tick
      const { error: streakError } = await supabase.rpc('update_streak', {
        p_user_id: user.id,
        p_date: today
      });
      if (streakError) console.error('Streak update error:', streakError.message);
    }

    // Always refetch from DB after toggle to confirm state
    await fetchTodayProgress();
  };

  const groupedByTopic = questions.reduce((acc, q) => {
    if (!acc[q.topic]) acc[q.topic] = [];
    acc[q.topic].push(q);
    return acc;
  }, {});

  return {
    questions,
    groupedByTopic,
    todayProgress,
    loading,
    toggleQuestion,
    refetch: () => Promise.all([fetchQuestions(), fetchTodayProgress()])
  };
};

export const useStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState({
    current_streak: 0,
    longest_streak: 0,
    last_solved_date: null
  });

  const fetchStreak = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (!error && data) setStreak(data);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchStreak();

    // Realtime subscription
    const sub = supabase
      .channel('streak-' + user.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'streaks',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        if (payload.new) setStreak(payload.new);
      })
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchStreak();
    };
    const handleFocus = () => fetchStreak();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      sub.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchStreak]);

  return streak;
};

export const useActivityCalendar = () => {
  const { user } = useAuth();
  const [activity, setActivity] = useState({});

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_progress')
      .select('solved_date')
      .eq('user_id', user.id);

    if (error) { console.error('Activity fetch error:', error.message); return; }

    const map = {};
    (data || []).forEach(({ solved_date }) => {
      map[solved_date] = (map[solved_date] || 0) + 1;
    });
    setActivity(map);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchActivity();

    const sub = supabase
      .channel('progress-calendar-' + user.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${user.id}`
      }, () => fetchActivity())
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchActivity();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      sub.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, fetchActivity]);

  return activity;
};

export const useTotalSolved = () => {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);

  const fetchTotal = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_progress')
      .select('question_id')
      .eq('user_id', user.id);

    if (error) { console.error('Total solved fetch error:', error.message); return; }
    const unique = new Set((data || []).map(r => r.question_id));
    setTotal(unique.size);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchTotal();

    const sub = supabase
      .channel('progress-total-' + user.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${user.id}`
      }, () => fetchTotal())
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchTotal();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      sub.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, fetchTotal]);

  return total;
};
