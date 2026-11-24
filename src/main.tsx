import {
  Auth0Context,
  Auth0ContextInterface,
  Auth0Provider,
  initialContext,
} from '@auth0/auth0-react';
import ReactDOM from 'react-dom/client';
import { createBrowserHistory } from 'history';
import './fonts.css';
import BrowserHistoryRouter from './support/BrowserHistoryRouter';
import App from './App';
import ToastProvider from './contexts/ToastContext';
import { initDevMode } from './devmode/state';
import { isOfflineApp, OFFLINE_APP_BUILD } from './runtime/mode';
import { registerAndroidBackButton } from './offline/androidBack';
import './index.css';
import './site.css';

initDevMode();
registerAndroidBackButton();
const history = createBrowserHistory();

const offlineAuthContextValue: Auth0ContextInterface = {
  ...initialContext,
  isAuthenticated: false,
  isLoading: false,
  user: undefined,
  loginWithRedirect: async () => undefined,
  loginWithPopup: async () => undefined,
  getAccessTokenSilently: (async () => '') as Auth0ContextInterface['getAccessTokenSilently'],
  getAccessTokenWithPopup: async () => '',
  logout: () => undefined,
};

const useOfflineShell = OFFLINE_APP_BUILD || isOfflineApp();
if (useOfflineShell) {
  document.documentElement.dataset.offlineApp = 'true';
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <BrowserHistoryRouter history={history}>
      {useOfflineShell ? (
        <Auth0Context.Provider value={offlineAuthContextValue}>
          <App />
        </Auth0Context.Provider>
      ) : (
        <Auth0Provider
          domain="trilha-info.us.auth0.com"
          clientId="ZPGRWe1CKiY84dCDtfTm6yy3ibSQbH4s"
          redirectUri={window.location.origin + '/login'}
          audience="TrilhaInfoApi"
        >
          <App />
        </Auth0Provider>
      )}
    </BrowserHistoryRouter>
  </ToastProvider>,
);
