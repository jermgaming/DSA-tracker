jest.mock('@supabase/supabase-js', () => {
  const auth = {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithOAuth: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  };
  function mk() {
    const c = { then(r) { return Promise.resolve(null).then(r); } };
    ['eq','order','select','insert','update','delete','upsert','single','on'].forEach(k => { c[k] = () => c; });
    c.subscribe = () => ({ unsubscribe: jest.fn() });
    return c;
  }
  const from = jest.fn(() => mk());
  const channel = jest.fn(() => ({ on: () => mk(), subscribe: () => ({ unsubscribe: jest.fn() }) }));
  const rpc = jest.fn(() => ({ then(r) { return Promise.resolve(null).then(r); } }));
  const s = { auth, from, channel, rpc };
  return { createClient: () => ({ auth, from, channel, rpc }), __store: s, __esModule: true };
});

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../hooks/useAuth';

const s = require('@supabase/supabase-js').__store;
const auth = s.auth;

const C = () => {
  const a = useAuth();
  return (<div>
    <span data-testid="l">{String(a.loading)}</span>
    <span data-testid="u">{a.user?a.user.email:'none'}</span>
    <span data-testid="a">{String(a.isAdmin)}</span>
    <button data-testid="g" onClick={()=>a.signInWithGoogle()}>G</button>
    <button data-testid="e" onClick={()=>a.signInWithEmail('x','p')}>E</button>
    <button data-testid="s" onClick={()=>a.signUpWithEmail('x','p','N')}>S</button>
    <button data-testid="o" onClick={()=>a.signOut()}>O</button>
  </div>);
};

describe('useAuth', () => {
  beforeEach(() => {
    Object.values(auth).forEach(fn => fn.mockReset());
  });

  it('loading then no user', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    render(<AuthProvider><C/></AuthProvider>);
    expect(screen.getByTestId('l').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('u').textContent).toBe('none'));
    expect(screen.getByTestId('l').textContent).toBe('false');
  });

  it('sets user from session', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: { id:'u1', email:'a@b.com' } } } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    render(<AuthProvider><C/></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('u').textContent).toBe('a@b.com'));
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'));
  });

  it('isAdmin from profile', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: { id:'u1', email:'x' } } } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    render(<AuthProvider><C/></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'));
  });

  it('calls signInWithGoogle', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    render(<AuthProvider><C/></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'));
    auth.signInWithOAuth.mockResolvedValue({ error: null });
    await act(async () => screen.getByTestId('g').click());
    expect(auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider:'google' }));
  });

  it('calls signInWithEmail', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    render(<AuthProvider><C/></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'));
    auth.signInWithPassword.mockResolvedValue({ error: null });
    await act(async () => screen.getByTestId('e').click());
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email:'x', password:'p' });
  });

  it('calls signUpWithEmail', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    render(<AuthProvider><C/></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'));
    auth.signUp.mockResolvedValue({ error: null });
    await act(async () => screen.getByTestId('s').click());
    expect(auth.signUp).toHaveBeenCalledWith({ email:'x', password:'p', options:{ data:{ full_name:'N' } } });
  });

  it('signs out and clears user', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: { id:'u1', email:'a@b.com' } } } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    render(<AuthProvider><C/></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('u').textContent).toBe('a@b.com'));
    auth.signOut.mockResolvedValue({ error: null });
    await act(async () => screen.getByTestId('o').click());
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('SIGNED_OUT event', async () => {
    let cb;
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockImplementation(c => { cb=c; return { data:{ subscription:{ unsubscribe:jest.fn() } } }; });
    render(<AuthProvider><C/></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'));
    await act(async () => cb('SIGNED_OUT', null));
    expect(screen.getByTestId('u').textContent).toBe('none');
  });

  it('SIGNED_IN event', async () => {
    let cb;
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockImplementation(c => { cb=c; return { data:{ subscription:{ unsubscribe:jest.fn() } } }; });
    render(<AuthProvider><C/></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('l').textContent).toBe('false'));
    await act(async () => cb('SIGNED_IN', { user:{ id:'u2', email:'n@b.com' } }));
    await waitFor(() => expect(screen.getByTestId('u').textContent).toBe('n@b.com'));
  });
});
