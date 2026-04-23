import React from 'react';
import { render, screen } from '@testing-library/react';
import ContractRenderer from '../components/ContractRenderer';

describe('ContractRenderer', () => {
  it('renders plain text contract', () => {
    render(<ContractRenderer contract={'This is a test contract.'} structure={[]} references={[]} />);
    expect(screen.getByText(/This is a test contract/)).toBeInTheDocument();
  });

  it('strips markdown emphasis markers from plain text contracts', () => {
    render(<ContractRenderer contract={'**Agreement**\n*Important term*'} structure={[]} references={[]} />);

    expect(screen.getByText(/Agreement/)).toBeInTheDocument();
    expect(screen.getByText(/Important term/)).toBeInTheDocument();
    expect(screen.queryByText(/\*\*Agreement\*\*/)).not.toBeInTheDocument();
  });
});
