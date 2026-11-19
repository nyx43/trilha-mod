import { BrowserHistory } from 'history';
import { ReactNode, useSyncExternalStore } from 'react';
import { Router } from 'react-router-dom';

// The editor and the router must share a history that can block native POP transitions.
export default function BrowserHistoryRouter({
  history,
  children,
}: {
  history: BrowserHistory;
  children: ReactNode;
}) {
  const location = useSyncExternalStore(history.listen, () => history.location);
  return (
    <Router navigator={history} location={location} navigationType={history.action}>
      {children}
    </Router>
  );
}
