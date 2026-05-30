import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

jest.mock('../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/useQuestions', () => ({
  useQuestions: jest.fn(), useStreak: jest.fn(),
  useActivityCalendar: jest.fn(), useTotalSolved: jest.fn(),
}));

const { useAuth } = require('../hooks/useAuth');
const { useQuestions, useStreak, useActivityCalendar, useTotalSolved } = require('../hooks/useQuestions');

describe('Dashboard', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ profile: { full_name: 'John' }, user: { email: 'j@t.com' } });
    useQuestions.mockReturnValue({ questions: [{ id:'q1', topic:'Arrays', difficulty:'Easy' }], todayProgress: new Set(['q1']), loading: false, toggleQuestion: jest.fn(), refetch: jest.fn() });
    useStreak.mockReturnValue({ current_streak: 5, longest_streak: 10 });
    useActivityCalendar.mockReturnValue({});
    useTotalSolved.mockReturnValue(42);
  });

  it('greets user', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Hey, John/)).toBeInTheDocument();
  });

  it('shows stats', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    useQuestions.mockReturnValue({ ...useQuestions(), loading: true });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('shows link to questions when none solved', () => {
    useQuestions.mockReturnValue({ ...useQuestions(), todayProgress: new Set() });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Start solving questions/)).toBeInTheDocument();
  });

  it('falls back to email first part when no name', () => {
    useAuth.mockReturnValue({ profile: null, user: { email: 'john.doe@test.com' } });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Hey, john/)).toBeInTheDocument();
  });

  it('shows activity heatmap', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Activity')).toBeInTheDocument();
  });

  it('shows last 7 days', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
  });
});
