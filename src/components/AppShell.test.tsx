import { cleanup, screen } from '@testing-library/react';
import i18n, { setLanguage } from '@/i18n';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';

afterEach(async () => {
  // Unmount before switching language back, so no component updates outside act().
  cleanup();
  await setLanguage('en');
});

test('shows the main navigation with the current tab marked', async () => {
  renderRoute('/more');
  // Wait for the lazy screen to settle before asserting on the shell.
  expect(await screen.findByRole('heading', { level: 1, name: 'More' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'More' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Search' })).not.toHaveAttribute('aria-current');
});

test('switching language in Settings translates the UI and sets <html lang>', async () => {
  const user = setupUser();
  renderRoute('/settings');
  await user.click(await screen.findByRole('radio', { name: 'සිංහල' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'සැකසුම්' })).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'තවත්' })).toBeInTheDocument();
  expect(i18n.language).toBe('si');
  expect(document.documentElement.lang).toBe('si');
});

test('unknown routes show a not-found screen', async () => {
  renderRoute('/nope');
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
});
