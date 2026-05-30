import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useAdminQuestions = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const createQuestion = useCallback(async (data) => {
    setSaving(true); setError(null);
    const { error: err } = await supabase.from('questions').insert(data);
    setSaving(false);
    if (err) { setError(err.message); return false; }
    return true;
  }, []);

  const updateQuestion = useCallback(async (id, data) => {
    setSaving(true); setError(null);
    const { error: err } = await supabase
      .from('questions')
      .update({ ...data, updated_at: new Date() })
      .eq('id', id);
    setSaving(false);
    if (err) { setError(err.message); return false; }
    return true;
  }, []);

  const deleteQuestion = useCallback(async (id) => {
    setSaving(true); setError(null);
    const { error: err } = await supabase.from('questions').delete().eq('id', id);
    setSaving(false);
    if (err) { setError(err.message); return false; }
    return true;
  }, []);

  const getAllUsers = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        is_admin,
        created_at,
        streaks (
          current_streak,
          longest_streak,
          last_solved_date
        )
      `)
      .order('created_at', { ascending: false });

    if (err) console.error('Error fetching users:', err.message);
    return data || [];
  }, []);

  return { createQuestion, updateQuestion, deleteQuestion, getAllUsers, saving, error };
};
