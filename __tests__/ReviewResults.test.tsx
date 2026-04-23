import React from 'react';
import { render, screen } from '@testing-library/react';
import ReviewResults from '../components/ReviewResults';

describe('ReviewResults smoke', () => {
  it('renders without crashing when given empty results', () => {
    const { container } = render(<ReviewResults results={''} />);
    // Component returns null for empty results; just ensure no crash
    expect(container).toBeTruthy();
  });

  it('shows PDF download and strips markdown asterisks', () => {
    render(<ReviewResults results={{ issues: ['**Critical issue**'], suggestions: ['*Fix it*'] }} />);

    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
    expect(screen.getByText('Critical issue')).toBeInTheDocument();
    expect(screen.queryByText(/\*\*Critical issue\*\*/)).not.toBeInTheDocument();
    expect(screen.getByText('Fix it')).toBeInTheDocument();
  });
});
