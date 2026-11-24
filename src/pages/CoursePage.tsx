import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import { RiOrganizationChart } from 'react-icons/ri';
import { Grid } from 'react-loader-spinner';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { clearLegacyApiTokenCookie, getApiAuthHeader } from '../auth/apiSession';
import { isOfflineApp } from '../runtime/mode';
import { findLocalRoadmap } from '../offline/localStore';
import {
  AccordionContainer,
  CourseAccordion,
  CourseLinkSelection,
} from '../components/CourseAccordion';
import MainLayout from '../components/layouts/MainLayout';
import useDocumentTitle from '../components/useDocumentTitle';
import YoutubeEmbed from '../components/YoutubeEmbed';
import { Level, Link, RoadmapModel } from '../entity/RoadmapModel';
import { RoadmapRead } from '../entity/RoadmapReadModel';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { roadmaps } from '../roadmaps/roadmaps';
import { isRead, reconcileRoadmapRead, updateReadAttribute } from '../support/roadmapUtils';

type CourseLinkEntry = CourseLinkSelection & {
  link: Link;
};

type ResolvedCourse = {
  storageKey: string;
  heading: string;
  title: string;
  levels: Level[];
  backTo: string;
};

type CustomLoadState = {
  requestedName: string | undefined;
  status: 'loading' | 'ready' | 'error';
  course?: ResolvedCourse;
};

function isBuiltinRoadmapKey(name: string | undefined): name is keyof typeof roadmaps {
  return Boolean(name && Object.prototype.hasOwnProperty.call(roadmaps, name));
}

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

function extractCourseEntries(data: Level[]): CourseLinkEntry[] {
  const entries: CourseLinkEntry[] = [];

  for (const level of data) {
    const levelLabel = level.label || level.items[0]?.label || '';
    for (const item of level.items) {
      for (const child of item.children || []) {
        for (const link of child.links || []) {
          entries.push({
            levelLabel,
            itemLabel: item.label,
            childLabel: child.label,
            link,
          });
        }
      }
    }
  }

  return entries;
}

function extractVideoId(url: string | undefined) {
  if (!url) return null;

  const regexLong = /[?&]v=([^&]+)/;
  const regexShort = /youtu\.be\/([^?]+)/;

  const matchLong = url.match(regexLong);
  const matchShort = url.match(regexShort);

  if (matchLong && matchLong[1]) return matchLong[1];
  if (matchShort && matchShort[1]) return matchShort[1];
  return null;
}

function CourseWorkspace({ course }: { course: ResolvedCourse }) {
  const [selectedItems, setSelectedItems] = useLocalStorage<RoadmapRead[]>(course.storageKey, []);
  const [adjacentEntries, setAdjacentEntries] = useState<
    [CourseLinkEntry | undefined, CourseLinkEntry | undefined, CourseLinkEntry | undefined]
  >([undefined, undefined, undefined]);
  const [activeItem, setActiveItem] = useState<string>();
  const [activeChild, setActiveChild] = useState<string>();
  const [activeLevel, setActiveLevel] = useState<string>();

  const findAdjacentLinks = useCallback(
    (selectedLink?: Link, context?: CourseLinkSelection) => {
      const entries = extractCourseEntries(course.levels);
      if (entries.length === 0) {
        setActiveLevel(undefined);
        setActiveItem(undefined);
        setActiveChild(undefined);
        setAdjacentEntries([undefined, undefined, undefined]);
        return;
      }

      let targetIndex = 0;
      if (selectedLink) {
        const matchedIndex = entries.findIndex((entry) => {
          if (entry.link !== selectedLink) return false;
          if (!context) return true;
          return (
            entry.levelLabel === context.levelLabel &&
            entry.itemLabel === context.itemLabel &&
            entry.childLabel === context.childLabel
          );
        });
        targetIndex = matchedIndex >= 0 ? matchedIndex : 0;
      }

      const previousEntry = entries[targetIndex - 1];
      const currentEntry = entries[targetIndex];
      const nextEntry = entries[targetIndex + 1];

      setActiveLevel(currentEntry.levelLabel);
      setActiveItem(currentEntry.itemLabel);
      setActiveChild(currentEntry.childLabel);
      setAdjacentEntries([previousEntry, currentEntry, nextEntry]);
    },
    [course.levels],
  );

  useEffect(() => {
    findAdjacentLinks();
    setSelectedItems((previous) => {
      const reconciled = reconcileRoadmapRead(course.levels, previous || []);
      if (JSON.stringify(reconciled) === JSON.stringify(previous)) {
        return previous;
      }
      return reconciled;
    });
  }, [course.levels, findAdjacentLinks, setSelectedItems]);

  const [previousEntry, currentEntry, nextEntry] = adjacentEntries;
  const activeLink = currentEntry?.link;
  const activeLinkReadLabel = currentEntry
    ? `${currentEntry.itemLabel}-${currentEntry.childLabel}-${currentEntry.link.label}`
    : '';
  const activeLinkRead = isRead(activeLinkReadLabel, selectedItems);
  const videoId = extractVideoId(activeLink?.url);

  return (
    <div className="flex min-h-full w-full flex-col lg:flex-row">
      <aside aria-label="Índice do curso" className="w-full shrink-0 bg-[#342B30] lg:w-[300px]">
        <p className="px-4 py-4 font-title text-lg text-text-primary">{course.heading}</p>
        <AccordionContainer
          value={activeLevel || ''}
          onValueChange={setActiveLevel}
          className="w-full"
          collapsible
          type="single"
        >
          {course.levels.map((level) => {
            const levelLabel = level.label || level.items[0]?.label || '';
            return (
              <CourseAccordion
                selectedItems={selectedItems}
                key={level.id || levelLabel}
                section={level}
                updateReadAttribute={updateReadAttribute}
                isRead={isRead}
                saveRead={(checked: boolean) =>
                  updateReadAttribute(levelLabel, checked, setSelectedItems, selectedItems)
                }
                setActiveLink={findAdjacentLinks}
                setActiveLevel={setActiveLevel}
                setActiveChild={setActiveChild}
                setActiveItem={setActiveItem}
                activeLevel={activeLevel}
                activeItem={activeItem}
                activeChild={activeChild}
                currentEntry={currentEntry}
                setSelectedItems={setSelectedItems}
              />
            );
          })}
        </AccordionContainer>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col p-4 md:p-6 lg:p-8">
        <div className="flex flex-wrap items-center">
          <RouterLink
            to={course.backTo}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <FaArrowLeft aria-hidden="true" className="shrink-0" />
            <span>voltar à visualização tradicional</span>
            <RiOrganizationChart aria-hidden="true" className="shrink-0" />
          </RouterLink>
        </div>

        {activeLink ? (
          <div className="flex min-w-0 flex-col">
            <div className="my-6 flex flex-wrap items-center gap-4 lg:my-10">
              <div
                aria-hidden="true"
                className="w-2 shrink-0 self-stretch bg-gradient-to-r from-text-secondary via-text-secondary to-black sm:w-4"
              />
              <h1 className="min-w-0 flex-1 break-words text-xl text-white">{activeLink.label}</h1>
              {!videoId && activeLink.url && (
                <a
                  href={activeLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className="z-20 inline-flex shrink-0 items-center gap-2 rounded-sm bg-primary px-3 py-2 text-center font-title duration-100 hover:bg-primary-hover hover:shadow-primary-white"
                >
                  <FaExternalLinkAlt aria-hidden="true" />
                  <span>acessar conteúdo</span>
                </a>
              )}
            </div>

            <div className="flex min-w-0 flex-col">
              {videoId ? (
                <div className="mx-auto flex w-full flex-col gap-4">
                  <YoutubeEmbed embedId={videoId} />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="font-light text-white">
                    Este conteúdo está disponível em um link externo.
                  </p>
                  <p className="font-light text-white">Acesse-o antes de completar.</p>
                </div>
              )}

              <div className="mx-auto mt-8 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
                {!activeLinkRead ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateReadAttribute(
                        activeLinkReadLabel,
                        true,
                        setSelectedItems,
                        selectedItems,
                      )
                    }
                    className="z-20 inline-flex items-center gap-2 rounded-sm border-2 border-primary px-3 py-2 text-center font-title text-primary duration-100 hover:shadow-secondary-white"
                  >
                    <FaCheck aria-hidden="true" />
                    <span>concluir conteúdo</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      updateReadAttribute(
                        activeLinkReadLabel,
                        false,
                        setSelectedItems,
                        selectedItems,
                      )
                    }
                    className="z-20 inline-flex items-center gap-2 rounded-sm border-2 border-primary bg-primary px-3 py-2 text-center font-title text-text-primary duration-100 hover:shadow-secondary-white"
                  >
                    <FaCheck aria-hidden="true" />
                    <span>desmarcar conteúdo</span>
                  </button>
                )}

                <div className="ml-auto flex flex-wrap items-center gap-4">
                  {previousEntry && (
                    <button
                      type="button"
                      onClick={() =>
                        findAdjacentLinks(previousEntry.link, {
                          levelLabel: previousEntry.levelLabel,
                          itemLabel: previousEntry.itemLabel,
                          childLabel: previousEntry.childLabel,
                        })
                      }
                      className="inline-flex items-center gap-2 py-2 text-primary underline"
                    >
                      <FaArrowLeft aria-hidden="true" />
                      <span>anterior</span>
                    </button>
                  )}
                  {nextEntry && (
                    <button
                      type="button"
                      onClick={() =>
                        findAdjacentLinks(nextEntry.link, {
                          levelLabel: nextEntry.levelLabel,
                          itemLabel: nextEntry.itemLabel,
                          childLabel: nextEntry.childLabel,
                        })
                      }
                      className="inline-flex items-center gap-2 py-2 text-primary underline"
                    >
                      <span>próximo</span>
                      <FaArrowRight aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <section className="site-empty">
            <h1>Nenhum conteúdo disponível neste curso</h1>
            <p>Esta trilha ainda não possui links organizados para o Modo Curso.</p>
            <div className="home-actions">
              <RouterLink className="home-button home-button-primary" to={course.backTo}>
                Voltar para a trilha
              </RouterLink>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function CoursePage() {
  const { name } = useParams<{ name: string }>();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const isBuiltin = isBuiltinRoadmapKey(name);
  const [attempt, setAttempt] = useState(0);
  const requestSeqRef = useRef(0);
  const [customState, setCustomState] = useState<CustomLoadState>(() => ({
    requestedName: name,
    status: !isBuiltin && name ? 'loading' : 'error',
  }));

  useEffect(() => {
    if (isBuiltin) return;

    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    if (!name) {
      setCustomState({ requestedName: undefined, status: 'error' });
      return;
    }

    if (isOfflineApp()) {
      const localFound = findLocalRoadmap(name);
      if (!localFound) {
        setCustomState({ requestedName: name, status: 'error' });
        return;
      }
      const levels = Array.isArray(localFound.levels) ? localFound.levels : [];
      const rawIdentifier = localFound.id || localFound.slug || name;
      const storageKey = isBuiltinRoadmapKey(rawIdentifier)
        ? `selectedItems-custom-${rawIdentifier}`
        : `selectedItems-${rawIdentifier}`;
      const title = localFound.title || name;
      setCustomState({
        requestedName: name,
        status: 'ready',
        course: {
          storageKey,
          heading: `Trilha ${title}`,
          title,
          levels,
          backTo: `/roadmap/view/${encodeURIComponent(localFound.slug || localFound.id || name)}`,
        },
      });
      return;
    }

    const controller = new AbortController();
    setCustomState({ requestedName: name, status: 'loading' });

    (async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (isAuthenticated) {
          const authHeader = await getApiAuthHeader(true, getAccessTokenSilently);
          if (controller.signal.aborted || requestSeqRef.current !== requestId) return;
          if (authHeader) headers.Authorization = authHeader;
        } else {
          clearLegacyApiTokenCookie();
        }
        const response = await axios.get<RoadmapModel>(
          (import.meta.env.VITE_PUBLIC_URL || '') + `/roadmap/${encodeURIComponent(name)}`,
          { signal: controller.signal, headers },
        );
        if (controller.signal.aborted || requestSeqRef.current !== requestId) return;
        if (!isValidRoadmapPayload(response.data)) {
          throw new Error('Trilha personalizada inválida.');
        }

        const loaded = Object.assign(new RoadmapModel(), response.data);
        const levels = Array.isArray(response.data.levels) ? response.data.levels : [];
        const rawIdentifier = loaded.id || loaded.slug || name;
        const storageKey = isBuiltinRoadmapKey(rawIdentifier)
          ? `selectedItems-custom-${rawIdentifier}`
          : `selectedItems-${rawIdentifier}`;
        const title = loaded.title || name;

        setCustomState({
          requestedName: name,
          status: 'ready',
          course: {
            storageKey,
            heading: `Trilha ${title}`,
            title,
            levels,
            backTo: `/roadmap/view/${encodeURIComponent(loaded.slug || loaded.id || name)}`,
          },
        });
      } catch {
        if (controller.signal.aborted || requestSeqRef.current !== requestId) return;
        setCustomState({ requestedName: name, status: 'error' });
      }
    })();

    return () => {
      controller.abort();
    };
  }, [attempt, getAccessTokenSilently, isAuthenticated, isBuiltin, name]);

  const resolvedCourse: ResolvedCourse | undefined = isBuiltin
    ? {
        storageKey: `selectedItems-${name}`,
        heading: `Trilha ${name}`,
        title: roadmaps[name].title,
        levels: roadmaps[name].file,
        backTo: `/roadmap/${name}`,
      }
    : customState.requestedName === name && customState.status === 'ready'
    ? customState.course
    : undefined;

  const isLoadingCustom =
    !isBuiltin &&
    Boolean(name) &&
    (customState.requestedName !== name || customState.status === 'loading');
  const customFailed =
    !isBuiltin && (!name || (customState.requestedName === name && customState.status === 'error'));

  useDocumentTitle(`Trilha Info${resolvedCourse ? ` - ${resolvedCourse.title}` : ''}`);

  return (
    <MainLayout>
      {resolvedCourse ? (
        <CourseWorkspace key={resolvedCourse.storageKey} course={resolvedCourse} />
      ) : isLoadingCustom ? (
        <section className="site-empty" role="status" aria-busy="true">
          <div className="mb-4 flex justify-center">
            <Grid
              height="64"
              width="64"
              color="#d56a47"
              ariaLabel="Carregando curso"
              radius="12.5"
              visible={true}
            />
          </div>
          <p className="home-eyebrow">Modo Curso</p>
          <h1>Carregando trilha…</h1>
        </section>
      ) : customFailed ? (
        <section className="site-empty" role="alert">
          <p className="home-eyebrow">Trilha indisponível</p>
          <h1>Não foi possível carregar este curso</h1>
          <p>
            A trilha solicitada não foi encontrada ou está temporariamente indisponível. Seu
            progresso nas demais trilhas foi preservado.
          </p>
          <div className="home-actions">
            {name && (
              <>
                <button
                  type="button"
                  className="home-button home-button-primary"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Tentar novamente
                </button>
                <RouterLink
                  className="home-button"
                  to={`/roadmap/view/${encodeURIComponent(name)}`}
                >
                  Voltar para a trilha
                </RouterLink>
              </>
            )}
            <RouterLink className="home-button" to="/">
              Voltar para o início
            </RouterLink>
          </div>
        </section>
      ) : null}
    </MainLayout>
  );
}
