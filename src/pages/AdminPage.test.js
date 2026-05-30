import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from '../pages/AdminPage';

jest.mock('../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/useAdmin', () => ({ useAdminQuestions: jest.fn() }));
jest.mock('../hooks/useQuestions', () => ({ useQuestions: jest.fn() }));

const { useAuth } = require('../hooks/useAuth');
const { useAdminQuestions } = require('../hooks/useAdmin');
const { useQuestions } = require('../hooks/useQuestions');

describe('AdminPage', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ isAdmin: true });
    useQuestions.mockReturnValue({ questions: [
      { id:'q1', title:'Two Sum', topic:'Arrays', difficulty:'Easy', link:'https://l.com', order_index:1 },
    ], loading: false, refetch: jest.fn() });
    useAdminQuestions.mockReturnValue({
      createQuestion: jest.fn().mockResolvedValue(true),
      updateQuestion: jest.fn().mockResolvedValue(true),
      deleteQuestion: jest.fn().mockResolvedValue(true),
      getAllUsers: jest.fn().mockResolvedValue([]),
      saving: false, error: null,
    });
  });

  it('renders admin panel', () => {
    render(<AdminPage />);
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('shows access denied for non-admin', () => {
    useAuth.mockReturnValue({ isAdmin: false });
    render(<AdminPage />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('opens new question modal', async () => {
    render(<AdminPage />);
    await userEvent.click(screen.getByText('Add Question'));
    expect(screen.getByText('New Question')).toBeInTheDocument();
  });

  it('opens edit modal', async () => {
    render(<AdminPage />);
    await userEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByText('Edit Question')).toBeInTheDocument();
  });

  it('opens delete confirmation', async () => {
    render(<AdminPage />);
    await userEvent.click(screen.getByTitle('Delete'));
    expect(screen.getByText('Delete Question?')).toBeInTheDocument();
  });

  it('shows users tab', async () => {
    useAdminQuestions.mockReturnValue({ ...useAdminQuestions(), getAllUsers: jest.fn().mockResolvedValue([
      { id:'u1', email:'a@t.com', full_name:'A', is_admin:false, created_at:'2026-01-01', streaks:[{ current_streak:5, longest_streak:10 }] }
    ])});
    render(<AdminPage />);
    await userEvent.click(screen.getByText(/Users/));
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('creates question on save', async () => {
    const create = jest.fn().mockResolvedValue(true);
    useAdminQuestions.mockReturnValue({ ...useAdminQuestions(), createQuestion: create });
    render(<AdminPage />);
    await userEvent.click(screen.getByText('Add Question'));
    await userEvent.type(screen.getByPlaceholderText('e.g. Two Sum'), 'New');
    await userEvent.click(screen.getByText('Save'));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ title:'New' }));
  });
});
