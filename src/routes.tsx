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
const RefundScreen = lazy(() => import('@/features/refund/RefundScreen'));
const DisputeScreen = lazy(() => import('@/features/dispute/DisputeScreen'));
const TicketsScreen = lazy(() => import('@/features/tickets/TicketsScreen'));
const TicketNewScreen = lazy(() => import('@/features/tickets/TicketNewScreen'));
const TicketScreen = lazy(() => import('@/features/tickets/TicketScreen'));
const RemindersScreen = lazy(() => import('@/features/reminders/RemindersScreen'));
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
      { path: '/tickets', element: <TicketsScreen /> },
      { path: '/tickets/new', element: <TicketNewScreen /> },
      { path: '/tickets/:ticketId', element: <TicketScreen /> },
      { path: '/refund', element: <RefundScreen /> },
      { path: '/dispute', element: <DisputeScreen /> },
      { path: '/reminders', element: <RemindersScreen /> },
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
