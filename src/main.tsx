import { Auth0Provider } from '@auth0/auth0-react';
import ReactDOM from 'react-dom/client';
import { createBrowserHistory } from 'history';
import BrowserHistoryRouter from './support/BrowserHistoryRouter';
import App from './App';
import ToastProvider from './contexts/ToastContext';
import { initDevMode } from './devmode/state';
import './index.css';
import './site.css';

initDevMode();
const history = createBrowserHistory();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <BrowserHistoryRouter history={history}>
      <Auth0Provider
        domain="trilha-info.us.auth0.com"
        clientId="ZPGRWe1CKiY84dCDtfTm6yy3ibSQbH4s"
        redirectUri={window.location.origin + '/login'}
        audience="TrilhaInfoApi"
      >
        <App />
      </Auth0Provider>
    </BrowserHistoryRouter>
  </ToastProvider>,
);
