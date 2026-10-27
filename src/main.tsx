import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import './styles/index.css';
import { getSavedLanguage, setLanguage } from './i18n';
import { applyTheme, getSavedTheme } from './hooks/useTheme';
import { createRouter } from './routes';

applyTheme(getSavedTheme());
registerSW({ immediate: true });

const router = createRouter();

// Load the saved language before first render so Sinhala/Tamil users never see an English flash.
void setLanguage(getSavedLanguage())
  .catch(() => undefined)
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
  });
