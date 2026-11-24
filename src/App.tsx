import {
  Component,
  ErrorInfo,
  lazy,
  ReactNode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import { DevModeBar } from './devmode/DevModeControls';
import HomePage from './pages/HomePage';
import E404Page from './pages/E404Page';
import MainLayout from './components/layouts/MainLayout';
import { reservationsPracticeUrl } from './lessons/persistencePilot';
import { safeDecodeHash } from './support/hash';
import { buildPageviewEvent } from './analytics/routeTracking';
import { isAnalyticsEnabled, isOfflineApp, OFFLINE_APP_BUILD } from './runtime/mode';

const RouteMetadata = lazy(() =>
  import('./seo/RouteMetadata').then((module) => ({ default: module.RouteMetadata })),
);

const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const NewRoadmapPage = lazy(() => import('./pages/NewRoadmap'));
const CustomRoadmapPage = lazy(() => import('./pages/CustomRoadmapPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const GuidesPage = lazy(() => import('./pages/GuidesPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const ReservationsPracticePage = lazy(() => import('./pages/ReservationsPracticePage'));
const LessonsPage = lazy(() => import('./pages/LessonsPage'));
const StudyingPage = lazy(() => import('./pages/StudyingPage'));
const LessonCoursePage = lazy(() => import('./pages/LessonCoursePage'));
const StudyRecommenderPage = lazy(() => import('./pages/StudyRecommenderPage'));
const PercursoPage = lazy(() => import('./pages/PercursoPage'));
const HorizontalRoadmapPage = lazy(() => import('./pages/HorizontalRoadmapPage'));

const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const UserPage = lazy(() => import('./pages/UserPage'));

let analyticsInitialized = false;
let analyticsModulePromise: Promise<typeof import('react-ga4')> | null = null;

function loadReactGA() {
  if (OFFLINE_APP_BUILD) {
    return Promise.reject(new Error('Analytics disabled in offline build'));
  }
  if (!analyticsModulePromise) {
    analyticsModulePromise = import('react-ga4');
  }
  return analyticsModulePromise;
}

export function resetAnalyticsStateForTests() {
  analyticsInitialized = false;
}

export function RouteTracker({
  enabled = isAnalyticsEnabled(),
  measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID,
}: {
  enabled?: boolean;
  measurementId?: string;
}) {
  const { pathname, search } = useLocation();
  const lastTracked = useRef('');

  useEffect(() => {
    if (OFFLINE_APP_BUILD || !enabled || !measurementId || isOfflineApp()) return;
    const event = buildPageviewEvent(pathname, search, {
      origin: window.location.origin,
      referrer: document.referrer,
    });
    if (!event) return;
    if (analyticsInitialized && lastTracked.current === event.page) return;

    let cancelled = false;
    loadReactGA()
      .then(({ default: ReactGA }) => {
        if (cancelled) return;
        if (!analyticsInitialized) {
          ReactGA.initialize(measurementId, {
            gtagOptions: {
              send_page_view: false,
              page_location: event.location,
              page_referrer: event.page_referrer,
            },
          });
          analyticsInitialized = true;
        }
        if (lastTracked.current === event.page) return;
        lastTracked.current = event.page;
        ReactGA.set({
          page_location: event.location,
          page_referrer: event.page_referrer,
        });
        ReactGA.send({
          hitType: 'pageview',
          page: event.page,
          location: event.location,
          page_referrer: event.page_referrer,
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [enabled, measurementId, pathname, search]);

  return null;
}

const selfManagedHashPrefixes = ['/aula/', '/percurso/', '/roadmap/', '/hroadmap/', '/guide/'];

function ScrollManager() {
  const { pathname, hash } = useLocation();
  const prevPath = useRef(pathname);

  useEffect(() => {
    const pathChanged = prevPath.current !== pathname;
    prevPath.current = pathname;

    if (hash) {
      if (selfManagedHashPrefixes.some((prefix) => pathname.startsWith(prefix))) {
        return;
      }
      const targetId = safeDecodeHash(hash);
      if (!targetId) return;
      const scrollToTarget = () => {
        const element = document.getElementById(targetId);
        if (!element) return false;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        element.scrollIntoView?.({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
        return true;
      };

      const frame = requestAnimationFrame(() => {
        if (scrollToTarget()) return;
        const root = document.getElementById('root');
        if (!root || typeof MutationObserver === 'undefined') return;
        const observer = new MutationObserver(() => {
          if (scrollToTarget()) {
            observer.disconnect();
            window.clearTimeout(timeout);
          }
        });
        const timeout = window.setTimeout(() => observer.disconnect(), 1500);
        observer.observe(root, { childList: true, subtree: true });
      });
      return () => cancelAnimationFrame(frame);
    }

    if (pathChanged) {
      window.scrollTo?.(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

interface ErrorBoundaryProps {
  resetKey: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro inesperado na página:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="site-shell">
          <main id="main-content" className="site-main">
            <section className="site-empty" role="alert">
              <p className="home-eyebrow">Algo saiu do esperado</p>
              <h1>Não foi possível exibir esta página agora</h1>
              <p>Você pode tentar recarregar a página ou voltar para a tela inicial.</p>
              <div className="home-actions">
                <button
                  type="button"
                  className="home-button home-button-primary"
                  onClick={() => window.location.reload()}
                >
                  Recarregar página
                </button>
                <a className="home-button" href="/">
                  Voltar para o início
                </a>
              </div>
            </section>
          </main>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { pathname, search } = useLocation();
  const [loadMetadata, setLoadMetadata] = useState(
    () => pathname !== '/' || !document.head.querySelector('link[rel="canonical"]'),
  );

  useEffect(() => {
    if (!loadMetadata && pathname !== '/') {
      setLoadMetadata(true);
    }
  }, [loadMetadata, pathname]);

  return (
    <>
      {loadMetadata && (
        <Suspense fallback={null}>
          <RouteMetadata />
        </Suspense>
      )}
      <RouteTracker />
      <ScrollManager />
      <AppErrorBoundary resetKey={pathname + search}>
        <Suspense
          fallback={
            <p role="status" className="roadmap-loading">
              Carregando página…
            </p>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/roadmap/:name" element={<RoadmapPage />} />
            <Route path="/course/:name" element={<CoursePage />} />
            <Route path="/profile" element={<UserPage />} />

            <Route path="/hroadmap/:name" element={<HorizontalRoadmapPage />} />
            <Route path="/roadmap/view/:roadmapId" element={<CustomRoadmapPage />} />
            <Route path="/roadmap/v/:roadmapId" element={<CustomRoadmapPage />} />
            <Route path="/new-roadmap" element={<NewRoadmapPage />} />
            <Route path="/edit-roadmap/:roadmapId" element={<NewRoadmapPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/guias" element={<GuidesPage />} />
            <Route path="/guide/:guide" element={<GuidePage />} />
            <Route path="/aulas" element={<LessonsPage />} />
            <Route path="/estudando" element={<StudyingPage />} />
            <Route path="/aulas/o-que-estudar" element={<StudyRecommenderPage />} />
            <Route path="/aulas/:trilha" element={<LessonCoursePage />} />
            <Route path="/aula/:lesson" element={<LessonPage />} />
            <Route path={reservationsPracticeUrl} element={<ReservationsPracticePage />} />
            <Route path="/percurso/:id" element={<PercursoPage />} />
            <Route path="/percurso/:id/:etapa" element={<PercursoPage />} />
            <Route path="/blog/:title" element={<BlogPostPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route
              path="*"
              element={
                <MainLayout>
                  <E404Page />
                </MainLayout>
              }
            />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
      <DevModeBar />
    </>
  );
}

export default App;
