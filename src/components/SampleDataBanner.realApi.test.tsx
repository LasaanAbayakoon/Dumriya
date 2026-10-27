import { screen } from '@testing-library/react';
import { renderRoute } from '@/test/renderRoute';

// Simulate the real backend being plugged in: the flag from src/api turns off.
vi.mock('@/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/api')>()), IS_SAMPLE_DATA: false }));

test('with the real API the sample-data banner disappears on its own', async () => {
  renderRoute('/train/1015?date=2026-12-10');
  await screen.findByRole('heading', { level: 1, name: '1015 Udarata Menike' });
  expect(screen.queryByText('Sample timetable — not real times')).not.toBeInTheDocument();
});
