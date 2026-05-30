import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Layout from './Layout';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => children,
}));

const { useAuth } = require('../../hooks/useAuth');

const renderLayout = (overrides = {}) => {
  useAuth.mockReturnValue({
    user: { email: 'test@test.com' },
    profile: { full_name: 'Test User', avatar_url: null },
    isAdmin: false,
    signOut: jest.fn(),
    ...overrides,
  });
  return render(<MemoryRouter><Layout theme="dark" toggleTheme={jest.fn()}><div>Child</div></Layout></MemoryRouter>);
};

describe('Layout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders children', () => {
    renderLayout();
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('displays profile name', () => {
    renderLayout({ profile: { full_name: 'John', avatar_url: null } });
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('falls back to email when no profile', () => {
    renderLayout({ profile: null, user: { email: 'j@t.com' } });
    expect(screen.getByText('j@t.com')).toBeInTheDocument();
  });

  it('shows Admin Panel when isAdmin', () => {
    renderLayout({ isAdmin: true });
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('hides Admin Panel when not admin', () => {
    renderLayout({ isAdmin: false });
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('calls signOut', async () => {
    const signOut = jest.fn();
    renderLayout({ signOut });
    await userEvent.click(screen.getByText('Sign Out'));
    expect(signOut).toHaveBeenCalled();
  });

  it('calls toggleTheme', async () => {
    const toggle = jest.fn();
    useAuth.mockReturnValue({ user: { email: 't@t.com' }, profile: null, isAdmin: false, signOut: jest.fn() });
    render(<MemoryRouter><Layout theme="dark" toggleTheme={toggle}><div>x</div></Layout></MemoryRouter>);
    await userEvent.click(screen.getByText('Light Mode'));
    expect(toggle).toHaveBeenCalled();
  });

  it('shows initials without avatar', () => {
    renderLayout({ profile: { full_name: 'Alice', avatar_url: null } });
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows avatar image when provided', () => {
    renderLayout({ profile: { full_name: 'Bob', avatar_url: 'https://img.com/p.png' } });
    expect(screen.getByAltText('avatar')).toHaveAttribute('src', 'https://img.com/p.png');
  });
});
