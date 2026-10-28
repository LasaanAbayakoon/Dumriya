import { cleanup, screen, within } from '@testing-library/react';
import en from '@/i18n/en';
import si from '@/i18n/si';
import ta from '@/i18n/ta';
import { setLanguage, type Language } from '@/i18n';
import { tickets } from '@/lib/storage';
import { buildTicket } from '@/lib/tickets';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';

afterEach(async () => {
  cleanup();
  Reflect.deleteProperty(navigator, 'storage');
  await setLanguage('en');
});

const section = async (name: string) => within((await screen.findByRole('heading', { name })).closest('section')!);

describe.each([
  ['en', en],
  ['si', si],
  ['ta', ta],
] as const)('About in %s', (lng, m) => {
  beforeEach(() => setLanguage(lng as Language));

  test('says it is unofficial, links only to the official sites, and shows the sample-data notice', async () => {
    renderRoute('/settings/about');
    const s = await section(m.about.unofficialTitle);
    expect(s.getByText(m.about.unofficial)).toBeInTheDocument();
    const links = s.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://seatreservation.railway.gov.lk', 'https://www.pravesha.lk']);
    for (const a of links) expect(a.getAttribute('rel')!.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    expect(screen.getByTestId('about-sample')).toHaveTextContent(m.about.sample);
  });

  test('privacy: stored, never stored, nothing sent, how to delete', async () => {
    renderRoute('/settings/about');
    const s = await section(m.about.privacyTitle);
    for (const text of [
      m.about.storedTickets,
      m.about.storedReminders,
      m.about.storedSettings,
      m.about.neverDispute,
      m.about.neverLocation,
      m.about.noServer,
      m.about.deleteHow,
    ]) {
      expect(s.getByText(text)).toBeInTheDocument();
    }
  });
});

test('credits, rules disclaimer with date, licences, version and feedback placeholder', async () => {
  renderRoute('/settings/about');
  const credits = await section('Data and credits');
  expect(credits.getByText('Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).')).toBeInTheDocument();
  expect(credits.getByRole('link', { name: 'OpenStreetMap copyright and licence' })).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright');
  expect(credits.getByText(/Timetable data will come from Dumriya’s own server/)).toBeInTheDocument();

  const rules = await section('About the rules in this app');
  expect(rules.getByText(/based on public Sri Lanka Railways information as of Tue, 27 Oct 2026\. Some are assumptions, marked “Not confirmed”/)).toBeInTheDocument();

  const licences = within(screen.getByTestId('licences'));
  for (const name of ['react', 'react-router', 'i18next', 'leaflet', 'idb-keyval', 'workbox-window']) {
    expect(licences.getByText(name)).toBeInTheDocument();
  }
  expect(licences.queryByText('vitest')).not.toBeInTheDocument();
  expect(screen.getByText(/Noto Sans Sinhala and Noto Sans Tamil fonts: SIL Open Font License 1\.1/)).toBeInTheDocument();

  expect(screen.getByTestId('app-version')).toHaveTextContent(/^Version 0\.1\.0, built \d{2}:\d{2} on \w{3}, \d{1,2} \w{3} \d{4}$/);
  expect(screen.getByText('Feedback link coming soon.')).toBeInTheDocument();
});

describe('Settings: storage next to "Delete all my data"', () => {
  test('shows tickets size, browser storage and whether data is protected', async () => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { estimate: async () => ({ usage: 3 * 1024 * 1024, quota: 2 * 1024 ** 3 }), persisted: async () => true },
    });
    await tickets.clear();
    await tickets.put(
      buildTicket({
        id: 's1',
        now: new Date(),
        file: { name: 'a.pdf', type: 'application/pdf', size: 2048, data: new ArrayBuffer(2048) },
        trainNumber: '1015',
        fromStationId: 'colombo-fort',
        toStationId: 'ella',
        travelDate: '2026-12-10',
        departureTime: '08:30',
        fareLkr: 1000,
        serviceChargeLkr: 50,
        trip: null,
      }),
    );
    renderRoute('/settings');
    const data = await section('Your data on this phone');
    expect(await data.findByTestId('settings-usage')).toHaveTextContent('Your tickets use 2 KB on this phone.');
    expect(data.getByText('Browser storage in use: 3.0 MB of about 2.0 GB.')).toBeInTheDocument();
    expect(data.getByTestId('settings-persisted')).toHaveTextContent('The browser has agreed not to clear these tickets automatically.');
    expect(data.getByRole('button', { name: 'Delete all my data' })).toBeInTheDocument();
  });

  test('not protected: offers to ask the browser, and says so if it refuses', async () => {
    const user = setupUser();
    const persist = vi.fn(async () => false);
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { estimate: async () => ({ usage: 0, quota: 1024 ** 3 }), persisted: async () => false, persist },
    });
    renderRoute('/settings');
    const data = await section('Your data on this phone');
    expect(await data.findByTestId('settings-persisted')).toHaveTextContent('The browser may clear saved data if the phone runs low on space.');
    await user.click(data.getByRole('button', { name: 'Ask the browser to keep my data' }));
    expect(persist).toHaveBeenCalled();
    expect(await data.findByText('The browser did not agree. It may still clear saved data if the phone runs low on space.')).toBeInTheDocument();
  });
});
