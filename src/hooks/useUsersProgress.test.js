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

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider } from './useAuth';
import { useUsersProgress } from './useUsersProgress';

const s = require('@supabase/supabase-js').__s;

function mkChain(resolveWith) {
  const c = { then(r) { return Promise.resolve(resolveWith).then(r); } };
  ['eq','order','select','insert','update','delete','upsert','single','on'].forEach(k => { c[k] = () => c; });
  c.subscribe = () => ({ unsubscribe: jest.fn() });
  return c;
}

function setupAuth() {
  s.auth.getSession.mockResolvedValue({ data: { session: { user: { id:'u1', email:'t@t.com' } } } });
  s.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
}

function resetFrom() {
  s.from.mockReset();
  s.from.mockImplementation(() => mkChain({ data: null }));
}

function resetRpc() {
  s.rpc.mockReset();
  s.rpc.mockImplementation(() => ({ then(r) { return Promise.resolve({ data: null }).then(r); } }));
}

function resetChannel() {
  s.channel.mockReset();
  s.channel.mockImplementation(() => ({ on: () => mkChain({ data: null }), subscribe: () => ({ unsubscribe: jest.fn() }) }));
}

const C = () => {
  const { users, questions, loading, error } = useUsersProgress();
  return (<div>
    <span data-testid="l">{String(loading)}</span>
    <span data-testid="uc">{users.length}</span>
    <span data-testid="qc">{questions.length}</span>
    {error && <span data-testid="err">{error}</span>}
  </div>);
};

describe('useUsersProgress', () => {
  beforeEach(() => {
    setupAuth();
    resetFrom();
    resetRpc();
    resetChannel();
  });

  it('shows loading initially', () => {
    render(<AuthProvider><C /></AuthProvider>);
    expect(screen.getByTestId('l').textContent).toBe('true');
  });

  it('fetches and enriches users with progress data', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'profiles') return mkChain({
        data: [
          { id:'u1', email:'a@t.com', full_name:'Alice', avatar_url:null, is_admin:true, created_at:'2026-01-01' },
          { id:'u2', email:'b@t.com', full_name:'Bob', avatar_url:null, is_admin:false, created_at:'2026-02-01' },
        ],
        error: null
      });
      return mkChain({
        data: [
          { id:'q1', title:'Two Sum', topic:'Arrays', difficulty:'Easy', order_index:1 },
          { id:'q2', title:'Three Sum', topic:'Arrays', difficulty:'Medium', order_index:2 },
        ],
        error: null
      });
    });

    s.rpc.mockImplementation((fn) => {
      if (fn === 'get_all_user_progress') return { then(r) { return Promise.resolve({ data: [{ user_id:'u1', question_id:'q1', solved_date:'2026-05-30' }, { user_id:'u1', question_id:'q2', solved_date:'2026-05-30' }, { user_id:'u2', question_id:'q1', solved_date:'2026-05-29' }] }).then(r); } };
      if (fn === 'get_all_streaks') return { then(r) { return Promise.resolve({ data: [{ user_id:'u1', current_streak:7, longest_streak:15, last_solved_date:'2026-05-30' }, { user_id:'u2', current_streak:3, longest_streak:5, last_solved_date:'2026-05-29' }] }).then(r); } };
    });

    const D = () => {
      const { users, questions, loading } = useUsersProgress();
      return (<div>
        <span data-testid="l">{String(loading)}</span>
        <span data-testid="uc">{users.length}</span>
        <span data-testid="qc">{questions.length}</span>
        <span data-testid="u1name">{users[0]?.full_name}</span>
        <span data-testid="u1solved">{users[0]?.totalSolved}</span>
        <span data-testid="u1pct">{users[0]?.percent}</span>
        <span data-testid="u1streak">{users[0]?.streak?.current_streak}</span>
        <span data-testid="u2name">{users[1]?.full_name}</span>
        <span data-testid="u2solved">{users[1]?.totalSolved}</span>
        <span data-testid="u2streak">{users[1]?.streak?.current_streak}</span>
        <span data-testid="u1admin">{String(users[0]?.is_admin)}</span>
      </div>);
    };
    render(<AuthProvider><D /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });

    expect(screen.getByTestId('uc').textContent).toBe('2');
    expect(screen.getByTestId('qc').textContent).toBe('2');
    expect(screen.getByTestId('u1name').textContent).toBe('Alice');
    expect(screen.getByTestId('u1solved').textContent).toBe('2');
    expect(screen.getByTestId('u1pct').textContent).toBe('100');
    expect(screen.getByTestId('u1streak').textContent).toBe('7');
    expect(screen.getByTestId('u2name').textContent).toBe('Bob');
    expect(screen.getByTestId('u2solved').textContent).toBe('1');
    expect(screen.getByTestId('u2streak').textContent).toBe('3');
  });

  it('sorts users by total solved descending, then by streak', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'profiles') return mkChain({
        data: [
          { id:'u1', email:'a@t.com', full_name:'Alice', avatar_url:null, is_admin:false, created_at:'2026-01-01' },
          { id:'u2', email:'b@t.com', full_name:'Bob', avatar_url:null, is_admin:false, created_at:'2026-01-01' },
        ],
        error: null
      });
      return mkChain({ data: [{ id:'q1', topic:'Arrays', difficulty:'Easy' }, { id:'q2', topic:'Trees', difficulty:'Easy' }], error: null });
    });
    s.rpc.mockImplementation((fn) => {
      if (fn === 'get_all_user_progress') return { then(r) { return Promise.resolve({ data: [{ user_id:'u1', question_id:'q1' }, { user_id:'u2', question_id:'q1' }, { user_id:'u2', question_id:'q2' }] }).then(r); } };
      if (fn === 'get_all_streaks') return { then(r) { return Promise.resolve({ data: [{ user_id:'u1', current_streak:100, longest_streak:100 }, { user_id:'u2', current_streak:0, longest_streak:0 }] }).then(r); } };
    });

    const D = () => {
      const { users, loading } = useUsersProgress();
      return (<div>
        <span data-testid="l">{String(loading)}</span>
        <span data-testid="first">{users[0]?.full_name}</span>
        <span data-testid="second">{users[1]?.full_name}</span>
      </div>);
    };
    render(<AuthProvider><D /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('first').textContent).toBe('Bob');
    expect(screen.getByTestId('second').textContent).toBe('Alice');
  });

  it('computes topic breakdown', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'profiles') return mkChain({
        data: [{ id:'u1', email:'a@t.com', full_name:'Alice', avatar_url:null, is_admin:false, created_at:'2026-01-01' }],
        error: null
      });
      return mkChain({
        data: [
          { id:'q1', title:'Two Sum', topic:'Arrays', difficulty:'Easy' },
          { id:'q2', title:'Invert Tree', topic:'Trees', difficulty:'Easy' },
        ],
        error: null
      });
    });
    s.rpc.mockImplementation((fn) => {
      if (fn === 'get_all_user_progress') return { then(r) { return Promise.resolve({ data: [{ user_id:'u1', question_id:'q1' }] }).then(r); } };
      if (fn === 'get_all_streaks') return { then(r) { return Promise.resolve({ data: [] }).then(r); } };
    });

    const D = () => {
      const { users, loading } = useUsersProgress();
      return (<div>
        <span data-testid="l">{String(loading)}</span>
        <span data-testid="at">{users[0]?.topicBreakdown?.Arrays?.total}</span>
        <span data-testid="as">{users[0]?.topicBreakdown?.Arrays?.solved}</span>
        <span data-testid="tt">{users[0]?.topicBreakdown?.Trees?.total}</span>
        <span data-testid="ts">{users[0]?.topicBreakdown?.Trees?.solved}</span>
      </div>);
    };
    render(<AuthProvider><D /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('at').textContent).toBe('1');
    expect(screen.getByTestId('as').textContent).toBe('1');
    expect(screen.getByTestId('tt').textContent).toBe('1');
    expect(screen.getByTestId('ts').textContent).toBe('0');
  });

  it('computes difficulty breakdown', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'profiles') return mkChain({
        data: [{ id:'u1', email:'a@t.com', full_name:'Alice', avatar_url:null, is_admin:false, created_at:'2026-01-01' }],
        error: null
      });
      return mkChain({
        data: [
          { id:'q1', title:'Two Sum', topic:'Arrays', difficulty:'Easy' },
          { id:'q2', title:'Three Sum', topic:'Arrays', difficulty:'Hard' },
        ],
        error: null
      });
    });
    s.rpc.mockImplementation((fn) => {
      if (fn === 'get_all_user_progress') return { then(r) { return Promise.resolve({ data: [{ user_id:'u1', question_id:'q1' }] }).then(r); } };
      if (fn === 'get_all_streaks') return { then(r) { return Promise.resolve({ data: [] }).then(r); } };
    });

    const D = () => {
      const { users, loading } = useUsersProgress();
      return (<div>
        <span data-testid="l">{String(loading)}</span>
        <span data-testid="et">{users[0]?.difficultyBreakdown?.Easy?.total}</span>
        <span data-testid="es">{users[0]?.difficultyBreakdown?.Easy?.solved}</span>
        <span data-testid="ht">{users[0]?.difficultyBreakdown?.Hard?.total}</span>
        <span data-testid="hs">{users[0]?.difficultyBreakdown?.Hard?.solved}</span>
      </div>);
    };
    render(<AuthProvider><D /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('et').textContent).toBe('1');
    expect(screen.getByTestId('es').textContent).toBe('1');
    expect(screen.getByTestId('ht').textContent).toBe('1');
    expect(screen.getByTestId('hs').textContent).toBe('0');
  });

  it('handles profiles fetch error', async () => {
    s.from.mockImplementation(() => mkChain({ data: null, error: { message: 'Profiles error' } }));
    s.rpc.mockImplementation(() => ({ then(r) { return Promise.resolve({ data: null }).then(r); } }));

    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('err').textContent).toContain('Failed to fetch profiles');
  });

  it('handles questions fetch error', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'profiles') return mkChain({ data: [], error: null });
      return mkChain({ data: null, error: { message: 'Questions error' } });
    });
    s.rpc.mockImplementation(() => ({ then(r) { return Promise.resolve({ data: null }).then(r); } }));

    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('err').textContent).toContain('Failed to fetch questions');
  });

  it('handles progress RPC error', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'profiles') return mkChain({ data: [], error: null });
      return mkChain({ data: [], error: null });
    });
    s.rpc.mockImplementation((fn) => {
      if (fn === 'get_all_user_progress') return { then(r) { return Promise.resolve({ data: null, error: { message: 'Progress error' } }).then(r); } };
      if (fn === 'get_all_streaks') return { then(r) { return Promise.resolve({ data: null }).then(r); } };
    });

    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('err').textContent).toContain('Failed to fetch progress');
  });

  it('handles streaks RPC error gracefully', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'profiles') return mkChain({ data: [{ id:'u1', email:'a@t.com', full_name:'Alice', is_admin:false, created_at:'2026-01-01' }], error: null });
      return mkChain({ data: [{ id:'q1', topic:'Arrays', difficulty:'Easy' }], error: null });
    });
    s.rpc.mockImplementation((fn) => {
      if (fn === 'get_all_user_progress') return { then(r) { return Promise.resolve({ data: [] }).then(r); } };
      if (fn === 'get_all_streaks') return { then(r) { return Promise.resolve({ data: null, error: { message: 'Streaks error' } }).then(r); } };
    });

    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('uc').textContent).toBe('1');
  });

  it('subscribes to progress and streak channels', async () => {
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(s.channel).toHaveBeenCalledWith('admin-progress');
    expect(s.channel).toHaveBeenCalledWith('admin-streaks');
  });

  it('unsubscribes on unmount', async () => {
    const unsub1 = jest.fn();
    const unsub2 = jest.fn();
    let callIdx = 0;
    s.channel.mockImplementation(() => {
      callIdx++;
      const unsub = callIdx === 1 ? unsub1 : unsub2;
      const chain = mkChain({ data: null });
      chain.subscribe = () => ({ unsubscribe: unsub });
      return { on: () => chain, subscribe: () => ({ unsubscribe: unsub }) };
    });
    const { unmount } = render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    unmount();
    expect(unsub1).toHaveBeenCalled();
    expect(unsub2).toHaveBeenCalled();
  });
});
