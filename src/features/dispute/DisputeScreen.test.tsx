import { act, cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/renderRoute';

const VALUES = {
  'Full name': 'A. Perera',
  'Mobile number': '077 123 4567',
  Location: 'Kandy',
  'Date of payment': '2026-11-10',
  'Time of payment': '14:30',
  'Reference number': 'SR123456789',
  'Last 4 digits of the card': '4242',
  'Email address used for the booking': 'a.perera@example.com',
} as const;

const EXPECTED_TEXT = [
  'Dispute type: Payment issue',
  'Problem: my card was charged but I did not receive an e-ticket.',
  '',
  'Name: A. Perera',
  'Mobile: 0771234567',
  'Location: Kandy',
  'Date and time of payment: Tue, 10 Nov 2026, 14:30 (Sri Lanka time)',
  'Reference number: SR123456789',
  'Card used: last 4 digits 4242',
  'Email used for the booking: a.perera@example.com',
].join('\n');

// userEvent.setup() installs a fake clipboard; tests read back from it.
const clipboardText = () => navigator.clipboard.readText();
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function fillAll(user: ReturnType<typeof userEvent.setup>) {
  for (const [label, value] of Object.entries(VALUES)) {
    const input = await screen.findByLabelText(label);
    if ((input as HTMLInputElement).type === 'date' || (input as HTMLInputElement).type === 'time') {
      await user.clear(input);
      await user.type(input, value);
    } else {
      await user.type(input, value);
    }
  }
}

test('shows the privacy note in plain words', async () => {
  renderRoute('/dispute');
  expect(await screen.findByTestId('privacy-note')).toHaveTextContent(
    'Nothing you type here is saved or sent. It is only formatted for you to copy.',
  );
});

test('Copy all produces a clean block, then shows Contact Us steps and the official link only', async () => {
  const user = userEvent.setup();
  renderRoute('/dispute');
  await fillAll(user);
  await user.click(screen.getByRole('button', { name: 'Copy all' }));

  expect(await clipboardText()).toBe(EXPECTED_TEXT);
  const next = within((await screen.findByRole('heading', { name: 'Now send it to Sri Lanka Railways' })).closest('section')!);
  expect(next.getByTestId('dispute-preview').textContent).toBe(EXPECTED_TEXT);
  expect(next.getByText('Open the official site and go to Contact Us.')).toBeInTheDocument();
  expect(next.getByText('Choose the dispute type “Payment issue”.')).toBeInTheDocument();

  const contact = within(screen.getByRole('heading', { name: 'Contact Us on the official site' }).closest('section')!);
  const link = contact.getByRole('link', { name: 'Open official site' });
  expect(link).toHaveAttribute('href', 'https://seatreservation.railway.gov.lk');
  expect(link.getAttribute('rel')!.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  const external = screen.getAllByRole('link').filter((a) => /^https?:/.test(a.getAttribute('href') ?? ''));
  expect(external.map((a) => a.getAttribute('href'))).toEqual(['https://seatreservation.railway.gov.lk']);
});

describe('card digits', () => {
  test('pasting a full card number is refused and explained; nothing is kept', async () => {
    const user = userEvent.setup();
    renderRoute('/dispute');
    const input = await screen.findByLabelText('Last 4 digits of the card');
    await user.click(input);
    await user.paste('4111 1111 1111 1111');
    expect(input).toHaveValue('');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Not accepted: that is more than 4 digits. Only enter the last 4 digits of your card. Never share a full card number.',
    );
  });

  test('a fifth typed digit is refused; the first four stay', async () => {
    const user = userEvent.setup();
    renderRoute('/dispute');
    const input = await screen.findByLabelText('Last 4 digits of the card');
    await user.type(input, '12345');
    expect(input).toHaveValue('1234');
    expect(screen.getByRole('alert')).toHaveTextContent(/Not accepted/);
  });

  test('fewer than 4 digits is an error on Copy all', async () => {
    const user = userEvent.setup();
    renderRoute('/dispute');
    await fillAll(user);
    const input = screen.getByLabelText('Last 4 digits of the card');
    await user.clear(input);
    await user.type(input, '42');
    await user.click(screen.getByRole('button', { name: 'Copy all' }));
    expect(screen.getByText('Enter exactly 4 numbers.')).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(await clipboardText()).toBe('');
  });
});

test('empty form: every field explains what is missing and focus goes to the first', async () => {
  const user = userEvent.setup();
  renderRoute('/dispute');
  await user.click(await screen.findByRole('button', { name: 'Copy all' }));
  expect(screen.getAllByText('Fill in this field.')).toHaveLength(8);
  expect(screen.getByText('Some details need fixing. Check the fields marked in red.')).toBeInTheDocument();
  expect(screen.getByLabelText('Full name')).toHaveFocus();
});

describe('privacy: nothing saved, nothing sent', () => {
  test('no storage, no URL change, no network while typing and copying', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const xhrOpen = vi.spyOn(XMLHttpRequest.prototype, 'open');
    const beacon = vi.fn();
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    const ws = vi.fn();
    vi.stubGlobal('WebSocket', ws);

    const snapshot = (s: Storage) => JSON.stringify(Object.entries(s).sort());
    const localBefore = snapshot(localStorage);
    const sessionBefore = snapshot(sessionStorage);
    const dbsBefore = (await indexedDB.databases()).map((d) => d.name).sort();
    const idbOpen = vi.spyOn(indexedDB, 'open');

    const { router } = renderRoute('/dispute');
    await fillAll(user);
    await user.click(screen.getByRole('button', { name: 'Copy all' }));
    await screen.findByRole('heading', { name: 'Now send it to Sri Lanka Railways' });

    expect(snapshot(localStorage)).toBe(localBefore);
    expect(snapshot(sessionStorage)).toBe(sessionBefore);
    expect(idbOpen).not.toHaveBeenCalled();
    expect((await indexedDB.databases()).map((d) => d.name).sort()).toEqual(dbsBefore);
    expect(router.state.location).toMatchObject({ pathname: '/dispute', search: '', hash: '' });
    expect(router.state.location.state).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(ws).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test('autofill is off on every field', async () => {
    renderRoute('/dispute');
    const inputs = (await screen.findByRole('button', { name: 'Copy all' })).closest('form')!.querySelectorAll('input');
    expect(inputs).toHaveLength(8);
    inputs.forEach((i) => expect(i).toHaveAttribute('autocomplete', 'off'));
  });

  test('leaving the screen clears the form', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/dispute');
    await fillAll(user);
    await act(() => router.navigate('/more'));
    await screen.findByRole('heading', { level: 1, name: 'More' });
    await act(() => router.navigate('/dispute'));
    expect(await screen.findByLabelText('Full name')).toHaveValue('');
    expect(screen.getByLabelText('Last 4 digits of the card')).toHaveValue('');
  });

  test('hiding the page (pagehide, back-forward cache) clears the form', async () => {
    const user = userEvent.setup();
    renderRoute('/dispute');
    await fillAll(user);
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(screen.getByLabelText('Full name')).toHaveValue('');
    expect(screen.getByLabelText('Email address used for the booking')).toHaveValue('');
  });
});
