import { lazy } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from '@/components/AppShell';

// Screens are code-split so the first load on a slow phone stays small.
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
const StationsScreen = lazy(() => import('@/features/stations/StationsScreen'));
const StationScreen = lazy(() => import('@/features/stations/StationScreen'));
const AboutScreen = lazy(() => import('@/features/settings/AboutScreen'));
const LiveScreen = lazy(() => import('@/features/live/LiveScreen'));
const BoardScreen = lazy(() => import('@/features/stations/BoardScreen'));
const MoreScreen = lazy(() => import('@/features/more/MoreScreen'));
const SettingsScreen = lazy(() => import('@/features/settings/SettingsScreen'));
const NotFoundScreen = lazy(() => import('@/features/NotFoundScreen'));

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomeScreen /> },
      { path: '/results', element: <ResultsScreen /> },
      { path: '/train/:trainId', element: <TrainScreen /> },
      { path: '/train/:trainId/book', element: <BookingHelperScreen /> },
      { path: '/train/:trainId/live', element: <LiveScreen /> },
      { path: '/tickets', element: <TicketsScreen /> },
      { path: '/tickets/new', element: <TicketNewScreen /> },
      { path: '/tickets/:ticketId', element: <TicketScreen /> },
      { path: '/refund', element: <RefundScreen /> },
      { path: '/dispute', element: <DisputeScreen /> },
      { path: '/reminders', element: <RemindersScreen /> },
      { path: '/stations', element: <StationsScreen /> },
      { path: '/stations/:stationId', element: <StationScreen /> },
      { path: '/stations/:stationId/board', element: <BoardScreen /> },
      { path: '/more', element: <MoreScreen /> },
      { path: '/settings', element: <SettingsScreen /> },
      { path: '/settings/about', element: <AboutScreen /> },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
