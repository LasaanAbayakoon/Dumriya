import { lazy, type ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/AppShell';
import { Placeholder } from '@/components/Placeholder';
import type en from '@/i18n/en';

// Screens are code-split so the first load on a slow phone stays small.
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
      { path: '/', element: el(todo('home', false)) },
      { path: '/results', element: el(todo('results')) },
      { path: '/train/:trainId', element: el(todo('train')) },
      { path: '/train/:trainId/book', element: el(todo('book')) },
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
