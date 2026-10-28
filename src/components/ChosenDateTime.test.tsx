import { cleanup, render, screen } from '@testing-library/react';
import { setLanguage, type Language } from '@/i18n';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';
import { ChosenDateTime } from './ChosenDateTime';

afterEach(async () => {
  cleanup();
  await setLanguage('en');
});

test.each([
  { lng: 'en', expected: 'You chose: Wed, 9 Dec 2026, 20:00 (Sri Lanka time)' },
  { lng: 'si', expected: 'ඔබ තෝරාගත්තේ: 2026 දෙසැ 9, බදාදා, 20:00 (ශ්‍රී ලංකා වේලාව)' },
  { lng: 'ta', expected: 'நீங்கள் தேர்ந்தெடுத்தது: புத., 9 டிச. 2026, 20:00 (இலங்கை நேரம்)' },
])('$lng: echoes the chosen value unambiguously', async ({ lng, expected }) => {
  await setLanguage(lng as Language);
  render(<ChosenDateTime id="c" date="2026-12-09" time="20:00" />);
  expect(screen.getByTestId('c')).toHaveTextContent(expected);
});

test('date only, time only, and nothing for empty or invalid values', () => {
  const { rerender } = render(<ChosenDateTime id="c" date="2026-12-09" />);
  expect(screen.getByTestId('c')).toHaveTextContent('You chose: Wed, 9 Dec 2026');
  rerender(<ChosenDateTime id="c" time="07:05" />);
  expect(screen.getByTestId('c')).toHaveTextContent('You chose: 07:05 (Sri Lanka time)');
  rerender(<ChosenDateTime id="c" date="" time="" />);
  expect(screen.getByTestId('c')).toBeEmptyDOMElement();
  rerender(<ChosenDateTime id="c" date="2026-13-40" />);
  expect(screen.getByTestId('c')).toBeEmptyDOMElement();
});

test('Home: updates as the user picks a date and time', async () => {
  const user = setupUser();
  renderRoute('/');
  const date = await screen.findByLabelText('Date');
  await user.clear(date);
  await user.type(date, '2026-12-09');
  expect(screen.getByTestId('search-chosen')).toHaveTextContent('You chose: Wed, 9 Dec 2026');
  await user.type(screen.getByLabelText('Leaving after'), '20:00');
  expect(screen.getByTestId('search-chosen')).toHaveTextContent('You chose: Wed, 9 Dec 2026, 20:00 (Sri Lanka time)');
});

test('Refund calculator: prefilled departure is echoed', async () => {
  renderRoute(`/refund?departure=${encodeURIComponent('2026-12-09T20:00:00+05:30')}&fare=1000`);
  expect(await screen.findByTestId('refund-chosen')).toHaveTextContent('You chose: Wed, 9 Dec 2026, 20:00 (Sri Lanka time)');
});

test('Dispute helper: payment date and time are echoed', async () => {
  const user = setupUser();
  renderRoute('/dispute');
  await user.type(await screen.findByLabelText('Date of payment'), '2026-11-10');
  await user.type(screen.getByLabelText('Time of payment'), '14:30');
  expect(screen.getByTestId('dispute-paid-chosen')).toHaveTextContent('You chose: Tue, 10 Nov 2026, 14:30 (Sri Lanka time)');
});

test.each([{ url: '/' }, { url: '/refund' }, { url: '/dispute' }])(
  'every date and time input on $url is described by a "You chose" line',
  async ({ url }) => {
    renderRoute(url);
    await screen.findByRole('heading', { level: 1 });
    const inputs = [...document.querySelectorAll<HTMLInputElement>('input[type="date"], input[type="time"]')];
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/);
      const echo = ids.map((id) => document.getElementById(id)).find((el) => el?.dataset.testid?.endsWith('-chosen'));
      expect(echo, input.id).toBeTruthy();
    }
  },
);
