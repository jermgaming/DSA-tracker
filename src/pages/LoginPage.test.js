import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../pages/LoginPage';

jest.mock('../hooks/useAuth', () => ({ useAuth: jest.fn() }));
const { useAuth } = require('../hooks/useAuth');

describe('LoginPage', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      signInWithGoogle: jest.fn().mockResolvedValue({ error: null }),
      signInWithEmail: jest.fn().mockResolvedValue({ error: null }),
      signUpWithEmail: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('switches to signup', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByText('Sign up'));
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('switches back to login', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByText('Sign up'));
    await userEvent.click(screen.getByText('Sign in'));
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('calls signInWithGoogle', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByText('Continue with Google'));
    expect(useAuth().signInWithGoogle).toHaveBeenCalled();
  });

  it('shows Google sign-in error', async () => {
    useAuth.mockReturnValue({
      ...useAuth(),
      signInWithGoogle: jest.fn().mockResolvedValue({ error: { message: 'Google fail' } }),
    });
    render(<LoginPage />);
    await userEvent.click(screen.getByText('Continue with Google'));
    await waitFor(() => expect(screen.getByText('Google fail')).toBeInTheDocument());
  });

  it('calls signInWithEmail', async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await userEvent.click(screen.getByText('Sign In'));
    expect(useAuth().signInWithEmail).toHaveBeenCalledWith('a@b.com', 'pass');
  });

  it('shows email sign-in error', async () => {
    useAuth.mockReturnValue({
      ...useAuth(),
      signInWithEmail: jest.fn().mockResolvedValue({ error: { message: 'Invalid' } }),
    });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'x@y');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pw');
    await userEvent.click(screen.getByText('Sign In'));
    await waitFor(() => expect(screen.getByText('Invalid')).toBeInTheDocument());
  });

  it('calls signUpWithEmail', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByText('Sign up'));
    await userEvent.type(screen.getByPlaceholderText('Your name'), 'New');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'n@b.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await userEvent.click(screen.getByText('Create Account'));
    expect(useAuth().signUpWithEmail).toHaveBeenCalledWith('n@b.com', 'pass', 'New');
  });

  it('shows signup success', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByText('Sign up'));
    await userEvent.type(screen.getByPlaceholderText('Your name'), 'N');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'n@b.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pw');
    await userEvent.click(screen.getByText('Create Account'));
    await waitFor(() => expect(screen.getByText(/Check your email/)).toBeInTheDocument());
  });

  it('clears error on mode switch', async () => {
    useAuth.mockReturnValue({
      ...useAuth(),
      signInWithEmail: jest.fn().mockResolvedValue({ error: { message: 'Err' } }),
    });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'x@y');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pw');
    await userEvent.click(screen.getByText('Sign In'));
    await waitFor(() => expect(screen.getByText('Err')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Sign up'));
    expect(screen.queryByText('Err')).not.toBeInTheDocument();
  });
});
