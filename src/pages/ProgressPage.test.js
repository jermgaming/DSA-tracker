import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressPage from '../pages/ProgressPage';

jest.mock('../hooks/useUsersProgress', () => ({ useUsersProgress: jest.fn() }));
const { useUsersProgress } = require('../hooks/useUsersProgress');

const mk = (id,name,solved,total,str) => ({
  id, email:`${name}@t.com`,full_name:name,avatar_url:null,is_admin:id==='u1',
  created_at:'2026-01-01',streak:{current_streak:str,longest_streak:20,last_solved_date:'2026-05-30'},
  totalSolved:solved,totalQuestions:total,percent:Math.round((solved/total)*100),
  lastActive:new Date('2026-05-30'),
  topicBreakdown:{'Arrays':{total:10,solved:5}},
  difficultyBreakdown:{'Easy':{total:8,solved:4},'Medium':{total:8,solved:3},'Hard':{total:4,solved:1}},
});

describe('ProgressPage', () => {
  beforeEach(() => {
    useUsersProgress.mockReturnValue({
      users:[mk('u1','Alice',15,20,10),mk('u2','Bob',10,20,5)],
      questions:[{id:'q1',topic:'Arrays',difficulty:'Easy',order_index:1}],
      loading:false,error:null,refetch:jest.fn(),
    });
  });

  it('renders page', () => {
    render(<ProgressPage />);
    const headings = screen.getAllByText('Leaderboard');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows spinner when loading', () => {
    useUsersProgress.mockReturnValue({ ...useUsersProgress(), loading:true });
    render(<ProgressPage />);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('shows error with retry', () => {
    useUsersProgress.mockReturnValue({ ...useUsersProgress(), loading:false, error:'Failed' });
    render(<ProgressPage />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders users', () => {
    render(<ProgressPage />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows admin tag', () => {
    render(<ProgressPage />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('switches to topic summary', async () => {
    render(<ProgressPage />);
    await userEvent.click(screen.getByText('Topic Summary'));
    expect(screen.getByText('Topic-wise completion across all users')).toBeInTheDocument();
  });
});
