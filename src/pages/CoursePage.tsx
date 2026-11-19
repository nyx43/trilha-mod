import { useParams } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { useCallback, useEffect, useState } from 'react';
import { Level, Link } from '../entity/RoadmapModel';
import useDocumentTitle from '../components/useDocumentTitle';
import { roadmaps } from '../roadmaps/roadmaps';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { FaArrowLeft, FaArrowRight, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import { RiOrganizationChart } from 'react-icons/ri';
import {
  AccordionContainer,
  CourseAccordion,
  CourseLinkSelection,
} from '../components/CourseAccordion';
import YoutubeEmbed from '../components/YoutubeEmbed';
import { RoadmapRead } from '../entity/RoadmapReadModel';
import { isRead, reconcileRoadmapRead, updateReadAttribute } from '../support/roadmapUtils';

type CourseLinkEntry = CourseLinkSelection & {
  link: Link;
};

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

export default function CoursePage() {
  const { name } = useParams<{ name: string }>();
  const currentRoadmap = (name && name in roadmaps ? name : 'frontend') as keyof typeof roadmaps;

  const [roadmapName, setRoadmapName] = useState(name || '');
  const [selectedItems, setSelectedItems] = useLocalStorage<RoadmapRead[]>(
    `selectedItems-${currentRoadmap}`,
    [],
  );

  const [adjacentEntries, setAdjacentEntries] = useState<
    [CourseLinkEntry | undefined, CourseLinkEntry | undefined, CourseLinkEntry | undefined]
  >([undefined, undefined, undefined]);
  const [activeItem, setActiveItem] = useState<string>();
  const [activeChild, setActiveChild] = useState<string>();
  const [activeLevel, setActiveLevel] = useState<string>();

  const findAdjacentLinks = useCallback(
    (selectedLink?: Link, context?: CourseLinkSelection) => {
      const entries = extractCourseEntries(roadmaps[currentRoadmap].file);
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
    [currentRoadmap],
  );

  useEffect(() => {
    setRoadmapName(name || '');
    findAdjacentLinks();
    setSelectedItems((previous) => {
      const reconciled = reconcileRoadmapRead(roadmaps[currentRoadmap].file, previous || []);
      if (JSON.stringify(reconciled) === JSON.stringify(previous)) {
        return previous;
      }
      return reconciled;
    });
  }, [name, currentRoadmap, findAdjacentLinks, setSelectedItems]);

  useDocumentTitle(
    `Trilha Info ${name && name in roadmaps ? ` - ${roadmaps[currentRoadmap].title}` : ''}`,
  );

  function extractVideoId(url: string | undefined) {
    if (!url) return null;

    let videoId = null;

    // Regular expression to match the video ID in two different URL formats
    const regexLong = /[?&]v=([^&]+)/;
    const regexShort = /youtu\.be\/([^?]+)/;

    // Check for matches in both URL formats
    const matchLong = url.match(regexLong);
    const matchShort = url.match(regexShort);

    if (matchLong && matchLong[1]) {
      videoId = matchLong[1];
    } else if (matchShort && matchShort[1]) {
      videoId = matchShort[1];
    }

    return videoId;
  }

  const [previousEntry, currentEntry, nextEntry] = adjacentEntries;
  const activeLink = currentEntry?.link;
  const activeLinkReadLabel = currentEntry
    ? `${currentEntry.itemLabel}-${currentEntry.childLabel}-${currentEntry.link.label}`
    : '';

  const activeLinkRead = isRead(activeLinkReadLabel, selectedItems);

  return (
    <MainLayout>
      <div className="flex h-full">
        <div className="h-full w-[300px] bg-[#342B30]">
          <h1 className="ml-4 py-4 text-lg text-text-primary">Trilha {roadmapName}</h1>
          <AccordionContainer
            value={activeLevel || ''}
            onValueChange={setActiveLevel}
            className="w-full"
            collapsible
            type="single"
          >
            {roadmaps[currentRoadmap].file.map((level) => {
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
        </div>
        <div className="flex h-full w-full flex-col p-4">
          <div className="flex w-fit flex-row">
            <a href={`/roadmap/${roadmapName}`} className="flex h-fit gap-2 text-primary">
              <FaArrowLeft className="my-auto" /> voltar à visualização tradicional{' '}
              <RiOrganizationChart className="my-auto" />
            </a>
          </div>
          <div className="flex flex-col">
            <div className="my-10  flex">
              <div className="flex w-4 bg-gradient-to-r from-text-secondary via-text-secondary to-black "></div>
              <h1 className="my-auto mr-10 h-fit text-xl text-white">{activeLink?.label}</h1>
              {!extractVideoId(activeLink?.url) && (
                <a
                  type="button"
                  href={activeLink?.url}
                  className="z-20 my-auto flex gap-2 rounded-sm bg-primary p-2 text-center font-title duration-100 hover:bg-primary-hover hover:shadow-primary-white"
                >
                  <FaExternalLinkAlt className="my-auto" /> {'acessar conteúdo'}
                </a>
              )}
            </div>
            <div className="flex h-full flex-col">
              {extractVideoId(activeLink?.url) && (
                <div className="mx-auto flex flex-col gap-4">
                  <YoutubeEmbed embedId={extractVideoId(activeLink?.url) || ''} />
                </div>
              )}
              {!extractVideoId(activeLink?.url) && (
                <div className="flex flex-col">
                  <p className="font-light text-white">
                    Este conteúdo está disponível em um link externo.
                  </p>
                  <p className="font-light text-white">Acesse-o antes de completar.</p>
                </div>
              )}
              <div className="mx-64 mt-8 flex gap-4">
                {!activeLinkRead && (
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
                    className="z-20 flex gap-2 rounded-sm border-2 border-primary p-2 text-center font-title text-primary duration-100  hover:shadow-secondary-white"
                  >
                    <FaCheck className="my-auto" /> {'concluir conteúdo'}
                  </button>
                )}
                {activeLinkRead && (
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
                    className="z-20 flex gap-2 rounded-sm border-2 border-primary bg-primary p-2 text-center font-title text-text-primary duration-100  hover:shadow-secondary-white"
                  >
                    <FaCheck className="my-auto" /> {'desmarcar conteúdo'}
                  </button>
                )}
                <div className="grow"></div>
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
                    className="flex gap-2 text-primary underline"
                  >
                    <FaArrowLeft className="my-auto" />
                    <span className="my-auto">anterior</span>
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
                    className="flex gap-2 text-primary underline"
                  >
                    <span className="my-auto">próximo</span>
                    <FaArrowRight className="my-auto" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
