import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n, { setLanguage } from '@/i18n';
import { renderRoute } from '@/test/renderRoute';

afterEach(async () => {
  await setLanguage('en');
});

test('shows the main navigation with the current tab marked', async () => {
  renderRoute('/more');
  const nav = screen.getByRole('navigation', { name: 'Main' });
  expect(nav).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'More' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Search' })).not.toHaveAttribute('aria-current');
  expect(await screen.findByRole('heading', { level: 1, name: 'More' })).toBeInTheDocument();
});

test('switching language in Settings translates the UI and sets <html lang>', async () => {
  const user = userEvent.setup();
  renderRoute('/settings');
  await user.click(await screen.findByRole('radio', { name: 'සිංහල' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'සැකසුම්' })).toBeInTheDocument();
  expect(i18n.language).toBe('si');
  expect(document.documentElement.lang).toBe('si');
});

test('unknown routes show a not-found screen', async () => {
  renderRoute('/nope');
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
});
