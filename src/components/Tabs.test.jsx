import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Tabs from './Tabs';

describe('Tabs Component', () => {
  it('renders all tabs correctly', () => {
    render(<Tabs activeTab="dashboard" onChange={vi.fn()} />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Publish/i)).toBeInTheDocument();
  });
});
