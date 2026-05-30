import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionsPage from '../pages/QuestionsPage';

jest.mock('../hooks/useQuestions', () => ({ useQuestions: jest.fn() }));
const { useQuestions } = require('../hooks/useQuestions');

describe('QuestionsPage', () => {
  beforeEach(() => {
    useQuestions.mockReturnValue({
      groupedByTopic: {
        'Arrays': [
          { id:'q1', title:'Two Sum', topic:'Arrays', difficulty:'Easy', link:'https://l.com', order_index:1 },
          { id:'q2', title:'Three Sum', topic:'Arrays', difficulty:'Medium', order_index:2 },
        ],
        'Trees': [
          { id:'q3', title:'Invert Tree', topic:'Trees', difficulty:'Easy', order_index:1 },
        ],
      },
      todayProgress: new Set(['q1']),
      loading: false,
      toggleQuestion: jest.fn(),
    });
  });

  it('renders page title', () => {
    render(<QuestionsPage />);
    expect(screen.getByText('Questions')).toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    useQuestions.mockReturnValue({ ...useQuestions(), loading: true });
    render(<QuestionsPage />);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders topic groups', () => {
    render(<QuestionsPage />);
    const arrays = screen.getAllByText('Arrays');
    const trees = screen.getAllByText('Trees');
    expect(arrays.length).toBeGreaterThan(0);
    expect(trees.length).toBeGreaterThan(0);
  });

  it('filters by search', async () => {
    render(<QuestionsPage />);
    await userEvent.type(screen.getByPlaceholderText('Search questions...'), 'Invert');
    expect(screen.getByText('Invert Tree')).toBeInTheDocument();
  });

  it('filters by topic', async () => {
    render(<QuestionsPage />);
    await userEvent.selectOptions(screen.getByDisplayValue('All'), 'Trees');
    const trees = screen.getAllByText('Trees');
    expect(trees.length).toBeGreaterThan(0);
    const arrays = screen.queryAllByText('Two Sum');
    expect(arrays.length).toBe(0);
  });

  it('filters by difficulty', async () => {
    render(<QuestionsPage />);
    const mediumBtns = screen.getAllByText('Medium');
    await userEvent.click(mediumBtns[mediumBtns.length - 1]);
    expect(screen.getByText('Three Sum')).toBeInTheDocument();
  });

  it('shows empty state for no matches', async () => {
    render(<QuestionsPage />);
    await userEvent.type(screen.getByPlaceholderText('Search questions...'), 'zzz');
    expect(screen.getByText('No questions found')).toBeInTheDocument();
  });
});
