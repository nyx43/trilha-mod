import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Grid } from 'react-loader-spinner';
import { Link, useParams } from 'react-router-dom';
import Cookies from 'universal-cookie';
import MainLayout from '../components/layouts/MainLayout';
import Roadmap from '../components/Roadmap';
import useDocumentTitle from '../components/useDocumentTitle';
import { RoadmapModel } from '../entity/RoadmapModel';

const cookies = new Cookies();

type CustomRoadmapStatus = 'loading' | 'ready' | 'error';

type CustomRoadmapState = {
  requestedId: string | undefined;
  status: CustomRoadmapStatus;
  roadmap?: RoadmapModel;
};

function isValidRoadmapPayload(data: unknown): data is Partial<RoadmapModel> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const record = data as Record<string, unknown>;
  const hasLevels = 'levels' in record && Array.isArray(record.levels);
  const hasMeta =
    typeof record.id === 'string' ||
    typeof record.title === 'string' ||
    typeof record.slug === 'string';
  return hasLevels || hasMeta;
}

export default function CustomRoadmapPage() {
  const { roadmapId } = useParams<{ roadmapId?: string }>();
  const [attempt, setAttempt] = useState(0);
  const requestSeqRef = useRef(0);
  const [state, setState] = useState<CustomRoadmapState>(() => ({
    requestedId: roadmapId,
    status: roadmapId ? 'loading' : 'error',
  }));

  useEffect(() => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    if (!roadmapId) {
      setState({ requestedId: undefined, status: 'error', roadmap: undefined });
      return;
    }

    const controller = new AbortController();
    setState({ requestedId: roadmapId, status: 'loading', roadmap: undefined });

    async function getRoadmap() {
      try {
        const response = await axios.get<RoadmapModel>(
          (import.meta.env.VITE_PUBLIC_URL || '') +
            `/roadmap/${encodeURIComponent(roadmapId || '')}`,
          {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: cookies.get('api_token'),
            },
          },
        );
        if (controller.signal.aborted || requestSeqRef.current !== requestId) return;
        if (!isValidRoadmapPayload(response.data)) {
          throw new Error('Resposta inválida ao carregar trilha.');
        }
        const loaded = Object.assign(new RoadmapModel(), response.data);
        loaded.levels = Array.isArray(response.data.levels) ? response.data.levels : [];
        setState({
          requestedId: roadmapId,
          status: 'ready',
          roadmap: loaded,
        });
      } catch {
        if (controller.signal.aborted || requestSeqRef.current !== requestId) return;
        setState({
          requestedId: roadmapId,
          status: 'error',
          roadmap: undefined,
        });
      }
    }

    getRoadmap();
    return () => {
      controller.abort();
    };
  }, [roadmapId, attempt]);

  const matchesCurrent = state.requestedId === roadmapId;
  const isLoadingRoadmap = Boolean(roadmapId) && (!matchesCurrent || state.status === 'loading');
  const failed = !roadmapId || (matchesCurrent && state.status === 'error');
  const activeRoadmap = matchesCurrent && state.status === 'ready' ? state.roadmap : undefined;

  useDocumentTitle(activeRoadmap?.title ? 'Trilha Info - ' + activeRoadmap.title : 'Trilha Info');

  return (
    <MainLayout>
      {activeRoadmap?.description && (
        <p className="c-brown mb-4 mt-8 text-center font-semibold md:px-28">
          {activeRoadmap.description}
        </p>
      )}
      {isLoadingRoadmap && (
        <div className="mt-32 flex w-full justify-center">
          <Grid
            height="80"
            width="80"
            color="#d56a47"
            ariaLabel="grid-loading"
            radius="12.5"
            wrapperStyle={{}}
            wrapperClass="opacity-100 "
            visible={isLoadingRoadmap}
          />
        </div>
      )}
      {!isLoadingRoadmap && failed && (
        <section className="site-empty" role="alert">
          <p className="home-eyebrow">Trilha indisponível</p>
          <h1>Não foi possível carregar este roadmap personalizado</h1>
          <p>Verifique o link ou tente novamente mais tarde.</p>
          <div className="home-actions">
            {roadmapId && (
              <button
                type="button"
                className="home-button home-button-primary"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Tentar novamente
              </button>
            )}
            <Link className="home-button" to="/">
              Voltar para o início
            </Link>
          </div>
        </section>
      )}
      {activeRoadmap && (
        <Roadmap
          key={roadmapId}
          isPreview={false}
          data={activeRoadmap.getLevels()}
          title={activeRoadmap.title ?? ''}
          name={activeRoadmap.id ?? ''}
          roadmapPath={activeRoadmap.slug ?? ''}
        />
      )}
    </MainLayout>
  );
}
