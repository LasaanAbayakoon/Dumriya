import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { routes } from '@/routes';

/** Render the real route table at a given URL. */
export function renderRoute(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  return { router, ...render(<RouterProvider router={router} />) };
}
