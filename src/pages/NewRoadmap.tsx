import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Grid } from 'react-loader-spinner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import NewRoadmapEditor from '../components/NewRoadmap/NewRoadmapEditor';
import NewRoadmapPreview from '../components/NewRoadmap/NewRoadmapPreview';
import { RoadmapModel } from '../entity/RoadmapModel';
import { clearLegacyApiTokenCookie, getApiAuthHeader } from '../auth/apiSession';
import { isOfflineApp } from '../runtime/mode';
import {
  findLocalRoadmap,
  isLocalSlugTaken,
  loadLocalProfile,
  saveLocalRoadmap,
} from '../offline/localStore';

type EditorStatus = 'loading' | 'ready' | 'error';

type EditorState = {
  targetId: string | undefined;
  status: EditorStatus;
  roadmap: RoadmapModel;
  savedSlug?: string;
  errorMessage?: string;
};

type SlugValidationStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

type SlugValidationState = {
  slug: string;
  status: SlugValidationStatus;
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

function hydrateRoadmap(data: Partial<RoadmapModel>): RoadmapModel {
  const model = Object.assign(new RoadmapModel(), data);
  model.levels = Array.isArray(data.levels) ? data.levels : [];
  return model;
}

function cloneRoadmapSnapshot(source: RoadmapModel, owner?: string): RoadmapModel {
  const snapshot = Object.assign(new RoadmapModel(), source);
  snapshot.levels = JSON.parse(JSON.stringify(source.levels || []));
  snapshot.slug = source.slug?.trim();
  snapshot.owner = owner;
  return snapshot;
}

export default function NewRoadmapPage() {
  const offline = isOfflineApp();
  const { roadmapId } = useParams<{ roadmapId?: string }>();
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  const [shouldBlock, setShouldBlock] = useState(false);
  const [slugValidation, setSlugValidation] = useState<SlugValidationState>({
    slug: '',
    status: 'idle',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const [reloadAttempt, setReloadAttempt] = useState(0);

  const [editorState, setEditorState] = useState<EditorState>(() => ({
    targetId: roadmapId,
    status: roadmapId ? 'loading' : 'ready',
    roadmap: new RoadmapModel(),
  }));

  const routeSessionRef = useRef(0);
  const loadRequestRef = useRef(0);
  const saveRequestRef = useRef(0);
  const editVersionRef = useRef(0);

  const emptyRoadmap = useMemo(() => new RoadmapModel(), []);
  const matchesCurrentRoute = editorState.targetId === roadmapId;
  const loading = Boolean(roadmapId) && (!matchesCurrentRoute || editorState.status === 'loading');
  const loadError = Boolean(roadmapId) && matchesCurrentRoute && editorState.status === 'error';
  const activeRoadmap =
    matchesCurrentRoute && editorState.status === 'ready' ? editorState.roadmap : emptyRoadmap;

  const currentSlug = (activeRoadmap.slug ?? '').trim();
  const needsSlugCheck = Boolean(currentSlug) && currentSlug !== editorState.savedSlug;
  const slugStatus = slugValidation.slug === currentSlug ? slugValidation.status : 'idle';
  const isSlugChecking = needsSlugCheck && (slugStatus === 'idle' || slugStatus === 'checking');
  const isSlugTaken = needsSlugCheck && slugStatus === 'taken';
  const isSlugError = needsSlugCheck && slugStatus === 'error';
  const isSlugValidForSave = !needsSlugCheck || slugStatus === 'available';

  const canSave =
    matchesCurrentRoute && editorState.status === 'ready' && !saving && isSlugValidForSave;

  useEffect(() => {
    if (pendingRedirect && !shouldBlock) {
      setPendingRedirect(false);
      navigate('/');
    }
  }, [pendingRedirect, shouldBlock, navigate]);

  useEffect(() => {
    routeSessionRef.current += 1;
    loadRequestRef.current += 1;
    saveRequestRef.current += 1;
    editVersionRef.current = 0;
    const requestId = loadRequestRef.current;

    setShouldBlock(false);
    setSlugValidation({ slug: '', status: 'idle' });
    setSaving(false);
    setSaveError(null);
    setSaveNotice(null);
    setPendingRedirect(false);

    if (!roadmapId) {
      setEditorState({
        targetId: undefined,
        status: 'ready',
        roadmap: new RoadmapModel(),
      });
      return () => {
        routeSessionRef.current += 1;
        saveRequestRef.current += 1;
      };
    }

    if (offline) {
      const localFound = findLocalRoadmap(roadmapId);
      if (localFound) {
        editVersionRef.current = 0;
        setEditorState({
          targetId: roadmapId,
          status: 'ready',
          roadmap: localFound,
          savedSlug: localFound.slug?.trim(),
        });
      } else {
        setEditorState({
          targetId: roadmapId,
          status: 'error',
          roadmap: new RoadmapModel(),
          errorMessage: 'Roadmap pessoal não encontrado neste aparelho.',
        });
      }
      return () => {
        routeSessionRef.current += 1;
        saveRequestRef.current += 1;
      };
    }

    const controller = new AbortController();
    setEditorState({
      targetId: roadmapId,
      status: 'loading',
      roadmap: new RoadmapModel(),
    });

    (async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (isAuthenticated) {
          const authHeader = await getApiAuthHeader(true, getAccessTokenSilently);
          if (controller.signal.aborted || loadRequestRef.current !== requestId) return;
          if (authHeader) headers.Authorization = authHeader;
        } else {
          clearLegacyApiTokenCookie();
        }
        const response = await axios.get<RoadmapModel>(
          (import.meta.env.VITE_PUBLIC_URL || '') + `/roadmap/${encodeURIComponent(roadmapId)}`,
          {
            signal: controller.signal,
            headers,
          },
        );
        if (controller.signal.aborted || loadRequestRef.current !== requestId) return;
        if (!isValidRoadmapPayload(response.data)) {
          throw new Error('Resposta inválida ao carregar trilha.');
        }
        const loaded = hydrateRoadmap(response.data);
        editVersionRef.current = 0;
        setEditorState({
          targetId: roadmapId,
          status: 'ready',
          roadmap: loaded,
          savedSlug: loaded.slug?.trim(),
        });
      } catch {
        if (controller.signal.aborted || loadRequestRef.current !== requestId) return;
        setEditorState({
          targetId: roadmapId,
          status: 'error',
          roadmap: new RoadmapModel(),
          errorMessage: 'Não foi possível carregar este roadmap para edição.',
        });
      }
    })();

    return () => {
      controller.abort();
      routeSessionRef.current += 1;
      saveRequestRef.current += 1;
    };
  }, [roadmapId, reloadAttempt, isAuthenticated, getAccessTokenSilently, offline]);

  useEffect(() => {
    if (!needsSlugCheck) {
      setSlugValidation({ slug: currentSlug, status: 'idle' });
      return;
    }

    if (offline) {
      const taken = isLocalSlugTaken(currentSlug, editorState.roadmap.id || roadmapId);
      setSlugValidation({ slug: currentSlug, status: taken ? 'taken' : 'available' });
      return;
    }

    const controller = new AbortController();
    setSlugValidation({ slug: currentSlug, status: 'checking' });
    async function checkAvailability() {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (isAuthenticated) {
          const authHeader = await getApiAuthHeader(true, getAccessTokenSilently);
          if (controller.signal.aborted) return;
          if (authHeader) headers.Authorization = authHeader;
        } else {
          clearLegacyApiTokenCookie();
        }
        const response = await axios.get<boolean>(
          (import.meta.env.VITE_API_URL || '') + `/roadmap/slug/${encodeURIComponent(currentSlug)}`,
          {
            signal: controller.signal,
            headers,
          },
        );
        if (controller.signal.aborted) return;
        const status =
          response.data === true ? 'taken' : response.data === false ? 'available' : 'error';
        setSlugValidation({ slug: currentSlug, status });
      } catch {
        if (!controller.signal.aborted) setSlugValidation({ slug: currentSlug, status: 'error' });
      }
    }

    checkAvailability();
    return () => controller.abort();
  }, [
    currentSlug,
    needsSlugCheck,
    roadmapId,
    isAuthenticated,
    getAccessTokenSilently,
    offline,
    editorState.roadmap.id,
  ]);

  const markEdited = useCallback(() => {
    editVersionRef.current += 1;
    setPendingRedirect(false);
    setSaveNotice(null);
  }, []);

  const updateCurrentRoadmap = useCallback(
    (updater: (current: RoadmapModel) => RoadmapModel) => {
      markEdited();
      setEditorState((previous) => {
        if (previous.targetId !== roadmapId || previous.status !== 'ready') {
          return previous;
        }
        return {
          ...previous,
          roadmap: updater(previous.roadmap),
        };
      });
    },
    [roadmapId, markEdited],
  );

  const handleEditorRoadmapChange = useCallback(
    (nextRoadmap: RoadmapModel) => {
      markEdited();
      setEditorState((previous) => {
        if (previous.targetId !== roadmapId || previous.status !== 'ready') {
          return previous;
        }
        return {
          ...previous,
          roadmap: nextRoadmap,
        };
      });
    },
    [roadmapId, markEdited],
  );

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextTitle = event.target.value || '';
    updateCurrentRoadmap((current) => {
      const roadmapTemp = Object.assign(new RoadmapModel(), current);
      roadmapTemp.title = nextTitle;
      return roadmapTemp;
    });
    setShouldBlock(true);
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    const nextSlug = event.target.value || '';
    updateCurrentRoadmap((current) => {
      const roadmapTemp = Object.assign(new RoadmapModel(), current);
      roadmapTemp.slug = nextSlug;
      return roadmapTemp;
    });
    setShouldBlock(true);
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const nextDescription = event.target.value || '';
    updateCurrentRoadmap((current) => {
      const roadmapTemp = Object.assign(new RoadmapModel(), current);
      roadmapTemp.description = nextDescription;
      return roadmapTemp;
    });
    setShouldBlock(true);
  }

  async function handleSaveRoadmap() {
    if (!canSave) return;

    const sessionAtSaveStart = routeSessionRef.current;
    saveRequestRef.current += 1;
    const saveId = saveRequestRef.current;
    const versionAtSaveStart = editVersionRef.current;
    const payload = cloneRoadmapSnapshot(
      editorState.roadmap,
      offline ? loadLocalProfile().name : user?.nickname,
    );

    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);

    try {
      if (offline) {
        saveLocalRoadmap(payload);
        setShouldBlock(false);
        setPendingRedirect(true);
        return;
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (isAuthenticated) {
        const authHeader = await getApiAuthHeader(true, getAccessTokenSilently);
        if (routeSessionRef.current !== sessionAtSaveStart || saveRequestRef.current !== saveId) {
          return;
        }
        if (authHeader) headers.Authorization = authHeader;
      } else {
        clearLegacyApiTokenCookie();
      }
      await axios.post((import.meta.env.VITE_API_URL || '') + `/roadmap`, payload, {
        withCredentials: true,
        headers,
      });
      if (routeSessionRef.current !== sessionAtSaveStart || saveRequestRef.current !== saveId) {
        return;
      }

      if (editVersionRef.current !== versionAtSaveStart) {
        if (roadmapId) {
          setEditorState((previous) => ({ ...previous, savedSlug: payload.slug }));
        }
        setShouldBlock(true);
        setSaveNotice(
          'A versão anterior foi salva, mas há alterações mais recentes. Clique em Salvar novamente para enviá-las.',
        );
        return;
      }

      setShouldBlock(false);
      setPendingRedirect(true);
    } catch {
      if (routeSessionRef.current !== sessionAtSaveStart || saveRequestRef.current !== saveId) {
        return;
      }
      setSaveError('Não foi possível salvar o roadmap. Tente novamente.');
    } finally {
      if (routeSessionRef.current === sessionAtSaveStart && saveRequestRef.current === saveId) {
        setSaving(false);
      }
    }
  }

  return (
    <>
      <MainLayout>
        {loadError ? (
          <section className="site-empty" role="alert">
            <p className="home-eyebrow">Trilha indisponível</p>
            <h1>Não foi possível carregar este roadmap para edição</h1>
            <p>
              {editorState.errorMessage || 'Verifique o endereço ou tente novamente em instantes.'}
            </p>
            <div className="home-actions">
              <button
                type="button"
                className="home-button home-button-primary"
                onClick={() => setReloadAttempt((attempt) => attempt + 1)}
              >
                Tentar novamente
              </button>
              <Link className="home-button" to="/">
                Voltar para o início
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div className="flex flex-col space-y-4">
              <div className="m-auto mt-2 w-full flex-col md:w-1/2">
                <div className="flex">
                  <label
                    htmlFor="roadmap-slug"
                    className="text-gray-900 border-gray-300 inline-flex items-center rounded-l-md border border-r-0 bg-[#EDF2F7] px-4"
                  >
                    trilha.info/roadmap/v/
                  </label>
                  <input
                    type="text"
                    id="roadmap-slug"
                    className="block w-full min-w-0 flex-1 rounded-none rounded-r-lg border-2 border-[#EDF2F7] bg-[transparent] p-2.5 text-yellow outline-none transition-colors focus:border-yellow"
                    placeholder="Uma URL customizada para seu Roadmap"
                    value={activeRoadmap.slug ?? ''}
                    onChange={handleSlugChange}
                    disabled={loading}
                  />
                </div>
                {isSlugChecking && (
                  <p role="status" className="mt-1 text-center font-title text-yellow">
                    Verificando disponibilidade da URL…
                  </p>
                )}
                {isSlugTaken && (
                  <p className="mt-1 text-center font-title text-red">
                    Desculpe, mas essa URL já foi escolhida por outra pessoa.. 😔
                  </p>
                )}
                {isSlugError && (
                  <p role="alert" className="mt-1 text-center font-title text-red">
                    Não foi possível validar a disponibilidade desta URL. Tente novamente.
                  </p>
                )}
              </div>
              <div className="m-auto w-full md:w-1/2">
                <label htmlFor="roadmap-title" className="text-yellow">
                  Título:
                </label>
                <input
                  type="text"
                  id="roadmap-title"
                  className="block w-full min-w-0 flex-1 rounded-lg border-0 bg-[transparent] p-2.5 text-yellow outline-none ring-1 ring-[#EDF2F7] transition-all focus:ring-2 focus:ring-yellow"
                  placeholder="Dê um título para o seu Roadmap"
                  value={activeRoadmap.title ?? ''}
                  onChange={handleTitleChange}
                  disabled={loading}
                />
              </div>
              <div className="m-auto w-full md:w-1/2">
                <label htmlFor="roadmap-description" className="text-yellow">
                  Descrição:
                </label>

                <textarea
                  id="roadmap-description"
                  className="block min-h-[80px] w-full min-w-0 flex-1 rounded-lg border-0 bg-[transparent] p-2.5 text-yellow outline-none ring-1 ring-[#EDF2F7] transition-all focus:ring-2 focus:ring-yellow"
                  placeholder="Descreva o objetivo deste Roadmap"
                  value={activeRoadmap.description ?? ''}
                  onChange={handleDescriptionChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex">
              {/* Levels */}

              <div className="mt-8 flex w-full flex-col justify-center space-y-2 md:w-1/2">
                <NewRoadmapEditor
                  roadmap={activeRoadmap}
                  setShouldBlock={setShouldBlock}
                  setRoadmap={handleEditorRoadmapChange}
                  shouldBlock={shouldBlock}
                />
              </div>
              {/* Levels End */}
              {/* Preview */}
              <div className="hidden w-0 p-8 md:block md:w-1/2">
                <NewRoadmapPreview roadmap={activeRoadmap} />
              </div>
              {/* Preview End */}
            </div>
            <div className="flex flex-col space-y-4">
              {saveNotice && (
                <p role="status" className="text-center font-title text-yellow">
                  {saveNotice}
                </p>
              )}
              {saveError && (
                <p role="alert" className="text-center font-title text-red">
                  {saveError}
                </p>
              )}
              <div className="m-auto mt-8 w-fit self-end">
                <button
                  type="button"
                  onClick={handleSaveRoadmap}
                  disabled={!canSave}
                  className="mx-auto my-4 rounded-sm bg-yellow px-4 py-1 text-lg font-bold text-[black] transition-colors hover:bg-dark-yellow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </>
        )}
      </MainLayout>
      {loading && (
        <div
          className="fixed inset-x-0 top-0 m-0 h-full w-full bg-dark-brown bg-opacity-70 "
          id="signin-success-message"
        >
          <div className="my-4 mt-60 flex w-full items-center justify-center rounded-sm px-6 py-4 text-lg">
            <Grid
              height="80"
              width="80"
              color="#d56a47"
              ariaLabel="grid-loading"
              radius="12.5"
              wrapperStyle={{}}
              wrapperClass="opacity-100"
              visible={loading}
            />
          </div>
        </div>
      )}
    </>
  );
}
