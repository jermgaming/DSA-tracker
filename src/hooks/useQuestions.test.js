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
import { useQuestions, useStreak, useTotalSolved, useActivityCalendar } from './useQuestions';

const s = require('@supabase/supabase-js').__s;

function mkChain(resolveWith) {
  const c = { then(r) { return Promise.resolve(resolveWith).then(r); } };
  ['eq','order','select','insert','update','delete','upsert','single','on'].forEach(k => { c[k] = () => c; });
  c.subscribe = () => ({ unsubscribe: jest.fn() });
  return c;
}

function setupAuth(id, email) {
  s.auth.getSession.mockResolvedValue({ data: { session: { user: { id: id || 'u1', email: email || 't@t.com' } } } });
  s.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
}

function resetFrom() {
  s.from.mockReset();
  s.from.mockImplementation(() => mkChain({ data: null }));
}
function resetChannel() {
  s.channel.mockReset();
  s.channel.mockImplementation(() => ({ on: () => mkChain({ data: null }), subscribe: () => ({ unsubscribe: jest.fn() }) }));
}
function resetRpc() {
  s.rpc.mockReset();
  s.rpc.mockImplementation(() => ({ then(r) { return Promise.resolve({ data: null }).then(r); } }));
}

describe('useQuestions', () => {
  beforeEach(() => {
    setupAuth();
    resetFrom();
    resetRpc();
  });

  const Q = () => {
    const { questions, todayProgress, loading, toggleQuestion } = useQuestions();
    return (<div>
      <span data-testid="l">{String(loading)}</span>
      <span data-testid="qc">{questions.length}</span>
      <span data-testid="s">{todayProgress.size}</span>
      <button data-testid="t" onClick={() => toggleQuestion('q1')}>T</button>
    </div>);
  };

  it('fetches questions and marks loading false', async () => {
    render(<AuthProvider><Q /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
  });

  it('optimistic toggle on', async () => {
    let progressCalls = 0;
    s.from.mockImplementation((table) => {
      if (table === 'user_progress') {
        progressCalls++;
        if (progressCalls === 1) return mkChain({ data: [], error: null });
        return mkChain({ data: [{ question_id: 'q1' }], error: null });
      }
      return mkChain({ data: [] });
    });

    render(<AuthProvider><Q /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('s').textContent).toBe('0');
    await act(async () => screen.getByTestId('t').click());
    expect(screen.getByTestId('s').textContent).toBe('1');
  });

  it('optimistic untick removes from progress', async () => {
    let callCount = 0;
    s.from.mockImplementation((table) => {
      if (table === 'user_progress') {
        callCount++;
        if (callCount === 1) return mkChain({ data: [{ question_id: 'q1' }], error: null });
        return mkChain({ data: [], error: null });
      }
      return mkChain({ data: [] });
    });

    render(<AuthProvider><Q /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('s').textContent).toBe('1');

    await act(async () => screen.getByTestId('t').click());
    expect(screen.getByTestId('s').textContent).toBe('0');
  });

  it('reverts optimistic tick on upsert error', async () => {
    let callCount = 0;
    s.from.mockImplementation((table) => {
      if (table === 'user_progress') {
        callCount++;
        if (callCount === 1) return mkChain({ data: [], error: null });
        return mkChain({ data: null, error: { message: 'DB error' } });
      }
      return mkChain({ data: [] });
    });

    render(<AuthProvider><Q /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('s').textContent).toBe('0');

    await act(async () => screen.getByTestId('t').click());
    expect(screen.getByTestId('s').textContent).toBe('0');
  });

  it('reverts optimistic untick on delete error', async () => {
    let callCount = 0;
    s.from.mockImplementation((table) => {
      if (table === 'user_progress') {
        callCount++;
        if (callCount === 1) return mkChain({ data: [{ question_id: 'q1' }], error: null });
        return mkChain({ data: null, error: { message: 'DB error' } });
      }
      return mkChain({ data: [] });
    });

    render(<AuthProvider><Q /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('s').textContent).toBe('1');

    await act(async () => screen.getByTestId('t').click());
    expect(screen.getByTestId('s').textContent).toBe('1');
  });

  it('builds groupedByTopic from questions', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'questions') return mkChain({
        data: [
          { id:'q1', title:'Two Sum', topic:'Arrays', difficulty:'Easy', order_index:1 },
          { id:'q3', title:'Three Sum', topic:'Arrays', difficulty:'Medium', order_index:3 },
          { id:'q2', title:'Invert Tree', topic:'Trees', difficulty:'Easy', order_index:2 },
        ],
        error: null
      });
      return mkChain({ data: [] });
    });

    const G = () => {
      const { groupedByTopic, loading } = useQuestions();
      return (<div>
        <span data-testid="l">{String(loading)}</span>
        <span data-testid="topics">{Object.keys(groupedByTopic).join(',')}</span>
        <span data-testid="arrays">{groupedByTopic['Arrays']?.length || 0}</span>
        <span data-testid="trees">{groupedByTopic['Trees']?.length || 0}</span>
      </div>);
    };

    render(<AuthProvider><G /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'), { timeout: 5000 });
    expect(screen.getByTestId('topics').textContent).toBe('Arrays,Trees');
    expect(screen.getByTestId('arrays').textContent).toBe('2');
    expect(screen.getByTestId('trees').textContent).toBe('1');
  });
});

describe('useStreak', () => {
  beforeEach(() => {
    setupAuth();
    resetFrom();
    resetChannel();
  });

  it('starts with 0 streak', () => {
    const C = () => { const st = useStreak(); return <span data-testid="cs">{st.current_streak}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    expect(screen.getByTestId('cs').textContent).toBe('0');
  });

  it('fetches and displays streak data', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'streaks') return mkChain({ data: { current_streak: 7, longest_streak: 15, last_solved_date: '2026-05-30' }, error: null });
      return mkChain({ data: null });
    });

    const C = () => {
      const st = useStreak();
      return (<div>
        <span data-testid="cs">{st.current_streak}</span>
        <span data-testid="ls">{st.longest_streak}</span>
      </div>);
    };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('cs').textContent).toBe('7'));
    expect(screen.getByTestId('ls').textContent).toBe('15');
  });

  it('subscribes to realtime streak channel', async () => {
    const C = () => { const st = useStreak(); return <span data-testid="cs">{st.current_streak}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('cs').textContent).toBe('0'));
    expect(s.channel).toHaveBeenCalledWith('streak-u1');
  });

  it('unsubscribes streak channel on unmount', async () => {
    const unsub = jest.fn();
    const chain = mkChain({ data: null });
    chain.subscribe = () => ({ unsubscribe: unsub });
    s.channel.mockReturnValue({ on: () => chain, subscribe: jest.fn() });

    const C = () => { const st = useStreak(); return <span data-testid="cs">{st.current_streak}</span>; };
    const { unmount } = render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('cs').textContent).toBe('0'));

    unmount();
    expect(unsub).toHaveBeenCalled();
  });

  it('updates streak via realtime subscription', async () => {
    let onChangeCallback;
    const chain = mkChain({ data: null });
    s.channel.mockReturnValue({
      on: (event, filter, cb) => { onChangeCallback = cb; return chain; },
      subscribe: jest.fn()
    });

    const C = () => { const st = useStreak(); return <span data-testid="cs">{st.current_streak}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('cs').textContent).toBe('0'));

    await act(async () => {
      onChangeCallback({ new: { current_streak: 5, longest_streak: 10, last_solved_date: '2026-05-30' } });
    });
    expect(screen.getByTestId('cs').textContent).toBe('5');
  });

  it('refetches streak on visibility change', async () => {
    let fetchCount = 0;
    s.from.mockImplementation((table) => {
      if (table === 'streaks') {
        fetchCount++;
        return mkChain({ data: { current_streak: fetchCount, longest_streak: 10, last_solved_date: '2026-05-30' }, error: null });
      }
      return mkChain({ data: null });
    });

    const C = () => { const st = useStreak(); return <span data-testid="cs">{st.current_streak}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('cs').textContent).toBe('1'));

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(screen.getByTestId('cs').textContent).toBe('2'));
  });
});

describe('useActivityCalendar', () => {
  beforeEach(() => {
    setupAuth();
    resetFrom();
    resetChannel();
  });

  it('starts with empty activity map', () => {
    const C = () => { const a = useActivityCalendar(); return <span data-testid="keys">{Object.keys(a).length}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    expect(screen.getByTestId('keys').textContent).toBe('0');
  });

  it('fetches and counts activity by date', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'user_progress') return mkChain({
        data: [
          { solved_date: '2026-05-30', question_id: 'q1' },
          { solved_date: '2026-05-30', question_id: 'q2' },
          { solved_date: '2026-05-29', question_id: 'q1' },
        ],
        error: null
      });
      return mkChain({ data: null });
    });

    const C = () => {
      const a = useActivityCalendar();
      return (<div>
        <span data-testid="d1">{a['2026-05-30'] || 0}</span>
        <span data-testid="d2">{a['2026-05-29'] || 0}</span>
      </div>);
    };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('d1').textContent).toBe('2'));
    expect(screen.getByTestId('d2').textContent).toBe('1');
  });

  it('handles empty progress data', async () => {
    s.from.mockImplementation(() => mkChain({ data: [], error: null }));
    const C = () => { const a = useActivityCalendar(); return <span data-testid="keys">{Object.keys(a).length}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('keys').textContent).toBe('0'));
  });

  it('subscribes to progress channel', async () => {
    const C = () => { const a = useActivityCalendar(); return <span data-testid="keys">{Object.keys(a).length}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('keys').textContent).toBe('0'));
    expect(s.channel).toHaveBeenCalledWith('progress-calendar-u1');
  });
});

describe('useTotalSolved', () => {
  beforeEach(() => {
    setupAuth();
    resetFrom();
    resetChannel();
  });

  it('starts at 0', () => {
    const C = () => { const t = useTotalSolved(); return <span data-testid="ts">{t}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    expect(screen.getByTestId('ts').textContent).toBe('0');
  });

  it('fetches and counts unique question IDs', async () => {
    s.from.mockImplementation((table) => {
      if (table === 'user_progress') return mkChain({
        data: [
          { question_id: 'q1' },
          { question_id: 'q2' },
          { question_id: 'q1' },
          { question_id: 'q3' },
        ],
        error: null
      });
      return mkChain({ data: null });
    });

    const C = () => { const t = useTotalSolved(); return <span data-testid="ts">{t}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('ts').textContent).toBe('3'));
  });

  it('returns 0 when no progress data', async () => {
    s.from.mockImplementation(() => mkChain({ data: [], error: null }));
    const C = () => { const t = useTotalSolved(); return <span data-testid="ts">{t}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('ts').textContent).toBe('0'));
  });

  it('subscribes to progress total channel', async () => {
    const C = () => { const t = useTotalSolved(); return <span data-testid="ts">{t}</span>; };
    render(<AuthProvider><C /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('ts').textContent).toBe('0'));
    expect(s.channel).toHaveBeenCalledWith('progress-total-u1');
  });
});
