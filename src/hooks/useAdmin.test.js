jest.mock('@supabase/supabase-js', () => {
  function mk() {
    const c = { then(r) { return Promise.resolve(null).then(r); } };
    ['eq','order','select','insert','update','delete','upsert','single','on'].forEach(k => { c[k] = () => c; });
    c.subscribe = () => ({ unsubscribe: jest.fn() });
    return c;
  }
  const auth = { getSession: jest.fn(), onAuthStateChange: jest.fn(), signInWithOAuth: jest.fn(), signInWithPassword: jest.fn(), signUp: jest.fn(), signOut: jest.fn() };
  const from = jest.fn(() => mk());
  const channel = jest.fn(() => ({ on:()=>mk(), subscribe:()=>({unsubscribe:jest.fn()}) }));
  const rpc = jest.fn(() => ({ then(r) { return Promise.resolve(null).then(r); } }));
  const s = { auth, from, channel, rpc };
  return { createClient: () => ({ auth, from, channel, rpc }), __s: s, __esModule: true };
});

import { renderHook, act } from '@testing-library/react';
import { useAdminQuestions } from '../hooks/useAdmin';

const s = require('@supabase/supabase-js').__s;

describe('useAdmin', () => {
  beforeEach(() => {
    s.from.mockReturnValue({ then(r){ return Promise.resolve(null).then(r); }, eq:()=>({}), order:()=>({}), select:()=>({}), insert:()=>({}), update:()=>({}), delete:()=>({}), on:()=>({}) });
  });

  it('creates question', async () => {
    const { result } = renderHook(() => useAdminQuestions());
    let ok;
    await act(async () => { ok = await result.current.createQuestion({ title: 'Q' }); });
    expect(ok).toBe(true);
  });

  it('returns false on error', async () => {
    s.from.mockReturnValue({ then(r){ return Promise.reject(new Error('fail')).catch(r); }, eq:()=>({}), order:()=>({}), select:()=>({}), insert:()=>({}), update:()=>({}), delete:()=>({}), on:()=>({}) });
    const { result } = renderHook(() => useAdminQuestions());
    let ok;
    await act(async () => { ok = await result.current.createQuestion({ title: 'X' }); });
    expect(ok).toBe(false);
  });

  it('updates question', async () => {
    const { result } = renderHook(() => useAdminQuestions());
    let ok;
    await act(async () => { ok = await result.current.updateQuestion('q1', { title: 'U' }); });
    expect(ok).toBe(true);
  });

  it('deletes question', async () => {
    const { result } = renderHook(() => useAdminQuestions());
    let ok;
    await act(async () => { ok = await result.current.deleteQuestion('q1'); });
    expect(ok).toBe(true);
  });
});
