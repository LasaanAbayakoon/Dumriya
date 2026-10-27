import { lazy, type ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/AppShell';
import type en from '@/i18n/en';

// Screens are code-split so the first load on a slow phone stays small.
const Placeholder = lazy(() => import('@/components/Placeholder').then((m) => ({ default: m.Placeholder })));
const HomeScreen = lazy(() => import('@/features/search/HomeScreen'));
const ResultsScreen = lazy(() => import('@/features/results/ResultsScreen'));
const TrainScreen = lazy(() => import('@/features/train/TrainScreen'));
const BookingHelperScreen = lazy(() => import('@/features/book/BookingHelperScreen'));
const MoreScreen = lazy(() => import('@/features/more/MoreScreen'));
const SettingsScreen = lazy(() => import('@/features/settings/SettingsScreen'));
const NotFoundScreen = lazy(() => import('@/features/NotFoundScreen'));

function todo(key: keyof typeof en.screens, back = true): ComponentType {
  return function TodoScreen() {
    const { t } = useTranslation();
    return <Placeholder title={t(`screens.${key}`)} back={back} />;
  };
}

const el = (C: ComponentType) => <C />;

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomeScreen /> },
      { path: '/results', element: <ResultsScreen /> },
      { path: '/train/:trainId', element: <TrainScreen /> },
      { path: '/train/:trainId/book', element: <BookingHelperScreen /> },
      { path: '/train/:trainId/live', element: el(todo('live')) },
      { path: '/tickets', element: el(todo('tickets', false)) },
      { path: '/tickets/:ticketId', element: el(todo('ticket')) },
      { path: '/refund', element: el(todo('refund')) },
      { path: '/dispute', element: el(todo('dispute')) },
      { path: '/reminders', element: el(todo('reminders', false)) },
      { path: '/stations', element: el(todo('stations')) },
      { path: '/stations/:stationId', element: el(todo('station')) },
      { path: '/stations/:stationId/board', element: el(todo('board')) },
      { path: '/more', element: <MoreScreen /> },
      { path: '/settings', element: <SettingsScreen /> },
      { path: '/settings/about', element: el(todo('about')) },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
