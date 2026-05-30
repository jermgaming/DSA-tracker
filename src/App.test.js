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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const s = require('@supabase/supabase-js').__s;

function setupDashboard(profile) {
  s.from.mockImplementation((table) => {
    if (table === 'profiles') {
      const c = { then(r) { return Promise.resolve({ data: profile }).then(r); } };
      ['eq','order','select','insert','update','delete','upsert','single','on'].forEach(k => { c[k] = () => c; });
      c.subscribe = () => ({ unsubscribe: jest.fn() });
      return c;
    }
    return {
      then(r) { return Promise.resolve({ data: [], error: null }).then(r); },
      eq: () => ({ then(r) { return Promise.resolve(null).then(r); }, single: () => ({ then(r) { return Promise.resolve(null).then(r); }, eq:()=>({}), order:()=>({}), select:()=>({}) }), order:()=>({}), select:()=>({}) }),
      order: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    };
  });
  s.channel.mockImplementation(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
  }));
  s.rpc.mockImplementation(() => ({ then(r) { return Promise.resolve({ data: null }).then(r); } }));
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to dashboard when authenticated', async () => {
    s.auth.getSession.mockResolvedValue({ data: { session: { user: { id:'u1', email:'t@t.com' } } } });
    s.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    setupDashboard({ is_admin: false, full_name: 'Test', avatar_url: null });
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Hey,/)).toBeInTheDocument(), { timeout: 8000 });
  });

  it('renders login when no session', async () => {
    s.auth.getSession.mockResolvedValue({ data: { session: null } });
    s.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    render(<App />);
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeInTheDocument());
  });

  it('shows spinner during auth check', () => {
    s.auth.getSession.mockReturnValue(new Promise(() => {}));
    s.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    render(<App />);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('redirects non-admin from /admin to dashboard', async () => {
    s.auth.getSession.mockResolvedValue({ data: { session: { user: { id:'u1', email:'t@t.com' } } } });
    s.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    setupDashboard({ is_admin: false, full_name: 'Test', avatar_url: null });
    window.history.pushState({}, '', '/admin');
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Hey,/)).toBeInTheDocument(), { timeout: 8000 });
  });

  it('wildcard route redirects to dashboard', async () => {
    s.auth.getSession.mockResolvedValue({ data: { session: { user: { id:'u1', email:'t@t.com' } } } });
    s.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    setupDashboard({ is_admin: false, full_name: 'Test', avatar_url: null });
    window.history.pushState({}, '', '/nonexistent-page');
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Hey,/)).toBeInTheDocument(), { timeout: 8000 });
  });

  it('persists theme to localStorage and sets data-theme attribute', async () => {
    s.auth.getSession.mockResolvedValue({ data: { session: { user: { id:'u1', email:'t@t.com' } } } });
    s.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    setupDashboard({ is_admin: false, full_name: 'Test', avatar_url: null });
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Hey,/)).toBeInTheDocument(), { timeout: 8000 });
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles theme between dark and light', async () => {
    s.auth.getSession.mockResolvedValue({ data: { session: { user: { id:'u1', email:'t@t.com' } } } });
    s.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    setupDashboard({ is_admin: false, full_name: 'Test', avatar_url: null });
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Hey,/)).toBeInTheDocument(), { timeout: 8000 });
    const lightBtn = screen.getByText('Light Mode');
    await userEvent.click(lightBtn);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });
});
