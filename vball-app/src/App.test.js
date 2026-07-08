import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import App from './App';

test('renders the registration page', () => {
  render(<App />);
  const signInSection = screen.getByLabelText(/account sign in form/i);

  expect(screen.getByRole('heading', { name: /sign in and get back on the court/i })).toBeInTheDocument();
  expect(within(signInSection).getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
});
