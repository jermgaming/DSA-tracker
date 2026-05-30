jest.mock('@supabase/supabase-js', () => {
  function mk(resolveWith) {
    const c = { then(r) { return Promise.resolve(resolveWith).then(r); } };
    ['eq','order','select','insert','update','delete','upsert','single','on'].forEach(k => { c[k] = () => c; });
    c.subscribe = () => ({ unsubscribe: jest.fn() });
    return c;
  }
  const from = jest.fn(() => mk({ data: null }));
  const s = { from };
  return { createClient: () => ({ from, channel: () => ({ on:()=>mk({data:null}), subscribe:()=>({unsubscribe:jest.fn()}) }), rpc: () => ({ then(r) { return Promise.resolve(null).then(r); } }) }), __s: s, __esModule: true };
});

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, subDays } from 'date-fns';
import HistoryPage from '../pages/HistoryPage';

jest.mock('../hooks/useAuth', () => ({ useAuth: jest.fn() }));
const { useAuth } = require('../hooks/useAuth');
const s = require('@supabase/supabase-js').__s;

function mkFromChain(resolveWith) {
  const c = { then(r) { return Promise.resolve(resolveWith).then(r); } };
  ['eq','order','select','insert','update','delete','upsert','single','on'].forEach(k => { c[k] = () => c; });
  c.subscribe = () => ({ unsubscribe: jest.fn() });
  return c;
}

describe('HistoryPage', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { id: 'u1', email: 't@t.com' } });
    s.from.mockReset();
    s.from.mockImplementation(() => mkFromChain({ data: [] }));
  });

  it('renders history page header', async () => {
    render(<HistoryPage />);
    await waitFor(() => expect(screen.getByText('History')).toBeInTheDocument());
  });

  it('shows spinner initially', () => {
    render(<HistoryPage />);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders calendar with last 30 days', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    s.from.mockImplementation(() => mkFromChain({
      data: [{ solved_date: today, question_id: 'q1', questions: { id:'q1', title:'Two Sum', difficulty:'Easy', topic:'Arrays', link:'https://l.com' } }]
    }));

    render(<HistoryPage />);
    await waitFor(() => expect(document.querySelector('.spinner')).not.toBeInTheDocument());
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
  });

  it('marks today with badge', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    s.from.mockImplementation(() => mkFromChain({
      data: [{ solved_date: today, question_id: 'q1', questions: { id:'q1', title:'Two Sum', difficulty:'Easy', topic:'Arrays', link:null } }]
    }));

    render(<HistoryPage />);
    await waitFor(() => expect(document.querySelector('.spinner')).not.toBeInTheDocument());
    expect(screen.getByText('TODAY')).toBeInTheDocument();
  });

  it('shows solved questions for selected date', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    s.from.mockImplementation(() => mkFromChain({
      data: [
        { solved_date: today, question_id: 'q1', questions: { id:'q1', title:'Two Sum', difficulty:'Easy', topic:'Arrays', link:'https://l.com' } },
        { solved_date: today, question_id: 'q2', questions: { id:'q2', title:'Three Sum', difficulty:'Medium', topic:'Arrays', link:null } },
      ]
    }));

    render(<HistoryPage />);
    await waitFor(() => expect(document.querySelector('.spinner')).not.toBeInTheDocument());
    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Three Sum')).toBeInTheDocument();
    expect(screen.getByText('2 questions solved')).toBeInTheDocument();
  });

  it('shows empty state when no questions solved on selected date', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    s.from.mockImplementation(() => mkFromChain({ data: [] }));

    render(<HistoryPage />);
    await waitFor(() => expect(document.querySelector('.spinner')).not.toBeInTheDocument());
    expect(screen.getByText('No questions solved on this day')).toBeInTheDocument();
  });

  it('highlights selected date and shows questions', async () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    s.from.mockImplementation(() => mkFromChain({
      data: [{ solved_date: yesterday, question_id: 'q1', questions: { id:'q1', title:'Two Sum', difficulty:'Easy', topic:'Arrays', link:null } }]
    }));

    render(<HistoryPage />);
    await waitFor(() => expect(document.querySelector('.spinner')).not.toBeInTheDocument());

    const dayBtn = screen.getByText(format(new Date(yesterday + 'T00:00:00'), 'MMM d, yyyy'));
    await userEvent.click(dayBtn);

    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('1 question solved')).toBeInTheDocument();
  });

  it('shows older activity section for dates beyond 30 days', async () => {
    const oldDate = '2025-12-01';
    s.from.mockImplementation(() => mkFromChain({
      data: [{ solved_date: oldDate, question_id: 'q1', questions: { id:'q1', title:'Old Problem', difficulty:'Hard', topic:'DP', link:null } }]
    }));

    render(<HistoryPage />);
    await waitFor(() => expect(document.querySelector('.spinner')).not.toBeInTheDocument());
    expect(screen.getByText('Older Activity')).toBeInTheDocument();

    const oldBtn = screen.getByText('Dec 1, 2025');
    await userEvent.click(oldBtn);
    expect(screen.getByText('Old Problem')).toBeInTheDocument();
  });

  it('renders difficulty badge', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    s.from.mockImplementation(() => mkFromChain({
      data: [{ solved_date: today, question_id: 'q1', questions: { id:'q1', title:'Two Sum', difficulty:'Hard', topic:'Arrays', link:null } }]
    }));

    render(<HistoryPage />);
    await waitFor(() => expect(document.querySelector('.spinner')).not.toBeInTheDocument());
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('renders external link when available', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    s.from.mockImplementation(() => mkFromChain({
      data: [{ solved_date: today, question_id: 'q1', questions: { id:'q1', title:'Two Sum', difficulty:'Easy', topic:'Arrays', link:'https://leetcode.com/two-sum' } }]
    }));

    render(<HistoryPage />);
    await waitFor(() => expect(document.querySelector('.spinner')).not.toBeInTheDocument());
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://leetcode.com/two-sum');
  });

  it('shows correct grammar for single question solved', async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    s.from.mockImplementation(() => mkFromChain({
      data: [{ solved_date: today, question_id: 'q1', questions: { id:'q1', title:'Two Sum', difficulty:'Easy', topic:'Arrays', link:null } }]
    }));

    render(<HistoryPage />);
    await waitFor(() => expect(document.querySelector('.spinner')).not.toBeInTheDocument());
    expect(screen.getByText('1 question solved')).toBeInTheDocument();
  });
});
