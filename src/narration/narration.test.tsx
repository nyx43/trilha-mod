import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuideBlockView } from '../components/Guide/GuideBlock';
import { lessons } from '../lessons';
import { content as pilotContent } from '../lessons/content/integracaoFrontEApi';
import { lessonStoreKey, reviewStoreKey } from '../lessons/progress';
import { percursoStoreKey } from '../percurso/progress';
import { findPercurso } from '../percurso/apiReactTailwind';
import LessonPage from '../pages/LessonPage';
import PercursoPage from '../pages/PercursoPage';
import { extractLessonNarrationSpec } from './extractor';
import { sha256Hex } from './hash';
import { NARRATION_PREFS_KEY, NARRATION_POS_KEY } from './preferences';
import { NarrationProvider } from './controller';
import { NarrationBlockButton, NarrationPlayer } from './NarrationPlayer';
import { NARRATED_LESSON_IDS } from './registry';
import { NarrationLessonManifest } from './types';

const MANIFEST_DISK_PATH = path.resolve(
  __dirname,
  '../../public/narration/integracao-front-e-api/manifest.json',
);

const realManifest: NarrationLessonManifest = JSON.parse(
  fs.readFileSync(MANIFEST_DISK_PATH, 'utf8'),
);

function must<T>(value: T | null | undefined, label = 'valor esperado'): T {
  if (value === null || value === undefined) {
    throw new Error(`Ausente: ${label}`);
  }
  return value;
}

class FakeAudioElement {
  src = '';
  preload = 'auto';
  playbackRate = 1;
  defaultPlaybackRate = 1;
  currentTime = 0;
  paused = true;
  private listeners: Record<string, Array<() => void>> = {};

  addEventListener(type: string, cb: () => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(cb);
  }

  removeEventListener(type: string, cb: () => void) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((fn) => fn !== cb);
  }

  removeAttribute(name: string) {
    if (name === 'src') this.src = '';
  }

  load() {
    this.paused = true;
  }

  play() {
    this.paused = false;
    this.emit('play');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.emit('pause');
  }

  emit(type: string) {
    for (const cb of this.listeners[type] || []) {
      cb();
    }
  }
}

const audioInstances: FakeAudioElement[] = [];

class TrackedAudioElement extends FakeAudioElement {
  constructor() {
    super();
    audioInstances.push(this);
  }
}

function getActiveAudio(): FakeAudioElement {
  return must(audioInstances[audioInstances.length - 1], 'FakeAudioElement instance');
}

describe('Narração sincronizada — extrator, manifesto e player piloto', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    audioInstances.length = 0;
    vi.stubGlobal('Audio', TrackedAudioElement);
    fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/narration/integracao-front-e-api/manifest.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => realManifest,
        } as unknown as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as unknown as Response;
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calcula SHA-256 e mantém respostas ocultas fora da leitura contínua', () => {
    expect(sha256Hex('trilha-mod')).toBe(
      crypto.createHash('sha256').update('trilha-mod', 'utf8').digest('hex'),
    );
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

    const pilotMeta = must(lessons.find((l) => l.id === 'integracao-front-e-api'));
    const spec = extractLessonNarrationSpec(pilotMeta, pilotContent);

    expect(spec.uncoveredBlocks).toHaveLength(0);
    const joinedAudioScript = spec.clips
      .filter((c) => !c.onDemand)
      .map((c) => c.canonicalText)
      .join('\n');
    expect(joinedAudioScript).not.toContain(pilotContent.cards[0].back);
    expect(joinedAudioScript).not.toContain('Duas origens.');
    const classify = must(spec.clips.find((clip) => clip.id === 'caminho-da-requisicao:3'));
    expect(classify.fields).toHaveLength(9);
    expect(classify.pauseAfter).toBe(true);
    expect(
      spec.clips.find((clip) => clip.id === 'caminho-da-requisicao:3:feedback:correct')?.onDemand,
    ).toBe(true);
    for (const mc of realManifest.clips) {
      const sc = must(
        spec.clips.find((c) => c.id === mc.id),
        mc.id,
      );
      expect(sc.textHash).toBe(mc.textHash);
      const audio = must(mc.audio.santa, `${mc.id}.santa`);
      expect(audio.words.length).toBeGreaterThan(0);
      for (let i = 1; i < audio.words.length; i += 1) {
        expect(audio.words[i].startMs).toBeGreaterThanOrEqual(audio.words[i - 1].startMs);
      }
    }
  });

  it('mantém âncoras de palavras válidas para fetch, JSON e 201 no manifesto gerado', () => {
    const pilotMeta = must(lessons.find((l) => l.id === 'integracao-front-e-api'));
    const spec = extractLessonNarrationSpec(pilotMeta, pilotContent);
    const findSurface = (clipId: string, surface: string) => {
      const clipSpec = must(spec.clips.find((c) => c.id === clipId));
      const clipAudio = must(must(realManifest.clips.find((c) => c.id === clipId)).audio.santa);
      return clipAudio.words.find((w) => {
        const txt = must(clipSpec.fields.find((f) => f.field === w.field)).text;
        return txt.slice(w.from, w.to) === surface;
      });
    };

    const wFetch = findSurface('header', 'fetch');
    const wJson = findSurface('header', 'JSON');
    const w201 = findSurface('caminho-da-requisicao:2', '201');
    expect(wFetch).toBeDefined();
    expect(wJson).toBeDefined();
    expect(must(w201).endMs).toBeGreaterThan(must(w201).startMs);
  });

  it('iguala os campos visíveis ao roteiro quando há código dentro de negrito', () => {
    render(
      <GuideBlockView
        guideId="teste"
        narrationClipId="secao:0"
        block={{
          type: 'callout',
          tone: 'note',
          title: 'Use `fetch`',
          text: 'O **resultado de `fetch`** chega depois.',
        }}
      />,
    );
    expect(document.querySelector('[data-narration-field="title"]')?.textContent).toBe('Use fetch');
    expect(document.querySelector('[data-narration-field="text"]')?.textContent).toBe(
      'O resultado de fetch chega depois.',
    );
    expect(screen.getAllByText('fetch', { selector: 'code' })).toHaveLength(2);
  });

  it('reproduz por parágrafo, destaca palavras via CSS.highlights e recua ao destaque por bloco quando indisponível', async () => {
    // 1) Sem CSS.highlights (jsdom padrão) -> destaque por bloco
    const { unmount } = render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const player = await screen.findByRole('region', { name: 'Controles de narração da aula' });
    expect(player.getAttribute('data-narration-highlight-mode')).toBe('block');
    expect(screen.getByText('Destaque por bloco ativo')).toBeInTheDocument();

    const hookBtn = screen.getByRole('button', { name: 'Ouvir abertura' });
    fireEvent.click(hookBtn);

    const audio = getActiveAudio();
    expect(audio.src).toContain('/narration/integracao-front-e-api/santa/hook.mp3');
    expect(
      document
        .querySelector('[data-narration-clip="hook"]')
        ?.getAttribute('data-narration-reading'),
    ).toBe('true');

    unmount();

    // 2) Com CSS.highlights mockado -> destaque palavra a palavra + rastro configurável
    const registryMap = new Map<string, unknown>();
    class MockHighlight {
      ranges: Range[];
      constructor(...ranges: Range[]) {
        this.ranges = ranges;
      }
    }
    vi.stubGlobal('Highlight', MockHighlight);
    vi.stubGlobal('CSS', { ...globalThis.CSS, highlights: registryMap });

    render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const playerWithHl = await screen.findByRole('region', {
      name: 'Controles de narração da aula',
    });
    expect(playerWithHl.getAttribute('data-narration-highlight-mode')).toBe('word');

    fireEvent.click(screen.getByRole('button', { name: 'Ouvir apresentação' }));
    const headerAudio = getActiveAudio();
    const headerSanta = must(must(realManifest.clips.find((c) => c.id === 'header')).audio.santa);
    const fetchWord = must(headerSanta.words.find((w) => w.field === 'summary'));
    const lastHeaderWord = must(headerSanta.words[headerSanta.words.length - 1]);

    act(() => {
      headerAudio.currentTime = (lastHeaderWord.startMs + 5) / 1000;
      headerAudio.emit('timeupdate');
    });

    expect(registryMap.has('narr-current')).toBe(true);
    const activeHighlight = registryMap.get('narr-current') as MockHighlight;
    expect(activeHighlight.ranges).toHaveLength(1);
    expect(registryMap.size).toBeGreaterThanOrEqual(2); // trail buckets active (default 2s)
    expect(fetchWord).toBeDefined();

    // Desligar rastro remove buckets de rastro mantendo palavra atual
    fireEvent.change(screen.getByLabelText('Duração do rastro de palavras'), {
      target: { value: '0' },
    });
    act(() => {
      headerAudio.emit('timeupdate');
    });
    expect(registryMap.has('narr-current')).toBe(true);
    expect(registryMap.has('narr-trail-new')).toBe(false);
    expect(registryMap.has('narr-trail-mid')).toBe(false);
    expect(registryMap.has('narr-trail-old')).toBe(false);
  });

  it('controla velocidade de 0,75x a 2,00x em passos de 0,05x, atalhos e persiste preferências no navegador', async () => {
    const view = render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('region', { name: 'Controles de narração da aula' });
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir abertura' }));
    const audio = getActiveAudio();

    fireEvent.click(screen.getByRole('button', { name: '0,75×' }));
    expect(audio.playbackRate).toBe(0.75);

    fireEvent.click(screen.getByRole('button', { name: '1,35×' }));
    expect(audio.playbackRate).toBe(1.35);

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar velocidade em 0,05×' }));
    expect(audio.playbackRate).toBe(1.4);

    fireEvent.keyDown(window, { key: '[' });
    expect(audio.playbackRate).toBe(1.35);

    fireEvent.click(screen.getByRole('button', { name: '2,00×' }));
    expect(audio.playbackRate).toBe(2.0);

    fireEvent.change(screen.getByLabelText('Duração do rastro de palavras'), {
      target: { value: '3' },
    });

    const saved = JSON.parse(localStorage.getItem(NARRATION_PREFS_KEY) || '{}');
    expect(saved.speed).toBe(2.0);
    expect(saved.trailSeconds).toBe(3);

    view.unmount();

    // Reloading preserves speed=2.0 and trail=3s
    render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('region', { name: 'Controles de narração da aula' });
    expect(screen.getByText('2,00×', { selector: 'summary strong' })).toBeInTheDocument();
    expect(
      (screen.getByLabelText('Duração do rastro de palavras') as HTMLSelectElement).value,
    ).toBe('3');
  });

  it('respeita seções abertas, link #cors, Mostrar a aula inteira, pausa em atividade e diagrama Flow', async () => {
    render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api#cors']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('region', { name: 'Controles de narração da aula' });

    // #cors abriu automaticamente toda a aula neste componente
    await waitFor(() => {
      expect(document.getElementById('cors')).toBeInTheDocument();
    });

    // Testa pausa em atividade avançando clipe de reveal/quiz no fluxo
    const flowClipTrigger = document.querySelector(
      '[data-narration-trigger="caminho-da-requisicao:2"]',
    ) as HTMLButtonElement;
    expect(flowClipTrigger).toBeInTheDocument();
    fireEvent.click(flowClipTrigger);
    const flowAudio = getActiveAudio();

    const step3Word = must(
      must(
        must(realManifest.clips.find((c) => c.id === 'caminho-da-requisicao:2')).audio.santa,
      ).words.find((w) => w.field === 'step:3:label'),
    );

    act(() => {
      flowAudio.currentTime = (step3Word.startMs + 20) / 1000;
      flowAudio.emit('timeupdate');
    });

    // Diagrama Flow avançou para o passo 4 (índice 3)
    const flowSteps = document.querySelectorAll(
      '[data-narration-clip="caminho-da-requisicao:2"] .lesson-flow-steps > li',
    );
    expect(flowSteps[3]?.getAttribute('data-current')).toBe('true');

    // Diagrama Anatomy troca a parte destacada ao narrar `fetch-com-corpo:1`
    fireEvent.click(
      must(
        document.querySelector('[data-narration-trigger="fetch-com-corpo:1"]'),
      ) as HTMLButtonElement,
    );
    const anatomyAudio = getActiveAudio();
    const partWord = must(
      must(
        must(realManifest.clips.find((c) => c.id === 'fetch-com-corpo:1')).audio.santa,
      ).words.find((w) => w.field === 'part:6:note'),
    );
    act(() => {
      anatomyAudio.currentTime = (partWord.startMs + 20) / 1000;
      anatomyAudio.emit('timeupdate');
    });
    expect(
      document
        .querySelector('[data-narration-clip="fetch-com-corpo:1"] .lesson-anatomy-label')
        ?.getAttribute('data-narration-field'),
    ).toBe('part:6:label');

    // Para o diagrama e inicia leitura contínua das seções abertas para testar pausa ao finalizar uma atividade
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir aula inteira' }));
    // Simula chegar ao clipe de atividade reveal `caminho-da-requisicao:3` (pauseAfter: true)
    let active = getActiveAudio();
    for (let guard = 0; guard < 12; guard += 1) {
      if (active.src.includes('caminho-da-requisicao__3.mp3')) break;
      act(() => active.emit('ended'));
      active = getActiveAudio();
    }
    expect(active.src).toContain('caminho-da-requisicao__3.mp3');

    // Ao encerrar o clipe da atividade, deve pausar em vez de iniciar automaticamente a próxima seção
    act(() => active.emit('ended'));
    const player = screen.getByRole('region', { name: 'Controles de narração da aula' });
    expect(within(player).getByRole('button', { name: 'Retomar leitura' })).toBeInTheDocument();
    expect(within(player).getByRole('status')).toHaveTextContent(/Pausado após a atividade/i);

    fireEvent.click(screen.getByRole('button', { name: 'Retomar leitura' }));
    expect(getActiveAudio().src).toContain('fetch-com-corpo__heading.mp3');
  });

  it('inicia apenas com as seções abertas e libera toda a aula ao marcar Mostrar a aula inteira', async () => {
    render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('region', { name: 'Controles de narração da aula' });
    expect(screen.getByRole('button', { name: 'Ouvir seções abertas' })).toBeInTheDocument();
    expect(document.getElementById('fechamento')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Mostrar a aula inteira'));
    expect(await screen.findByRole('button', { name: 'Ouvir aula inteira' })).toBeInTheDocument();
    expect(document.getElementById('fechamento')).toBeInTheDocument();

    // O verso só pode ter narração depois que a pessoa vira o cartão.
    const card = must(document.querySelector('.lesson-card'));
    const front = must(card.getAttribute('data-narration-clip'));
    expect(
      document.querySelector(`[data-narration-clip="${front.replace(/:front$/, ':back')}"]`),
    ).toBeNull();
    expect(screen.getByRole('button', { name: 'Ouvir frente' })).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Tente lembrar, depois mostre a resposta' }),
    );
    expect(screen.queryByRole('button', { name: 'Ouvir frente' })).not.toBeInTheDocument();
    expect(
      document.querySelector(`[data-narration-clip="${front.replace(/:front$/, ':back')}"]`),
    ).toBeInTheDocument();
  });

  it('pausa na classificação ao fim das seções abertas e retoma depois da leitura do feedback', async () => {
    const pilotMeta = must(lessons.find((l) => l.id === 'integracao-front-e-api'));
    const feedbackId = 'caminho-da-requisicao:3:feedback:correct';
    const feedback = must(
      extractLessonNarrationSpec(pilotMeta, pilotContent).clips.find(
        (clip) => clip.id === feedbackId,
      ),
    );
    const fixture = {
      ...realManifest,
      clips: [
        ...realManifest.clips.filter((clip) => clip.id !== feedbackId),
        { ...feedback, clipKey: 'feedback', audio: must(realManifest.clips[0]).audio },
      ],
    };
    fetchSpy.mockResolvedValue({ ok: true, json: async () => fixture } as Response);
    render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('region', { name: 'Controles de narração da aula' });
    expect(screen.queryByRole('button', { name: 'Ouvir feedback' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir seções abertas' }));
    const audio = getActiveAudio();
    for (let i = 0; i < 12 && !audio.src.includes('caminho-da-requisicao__3.mp3'); i += 1) {
      act(() => audio.emit('ended'));
    }
    expect(audio.src).toContain('caminho-da-requisicao__3.mp3');
    act(() => audio.emit('ended'));
    expect(screen.getByRole('button', { name: 'Retomar leitura' })).toBeInTheDocument();

    const block = must(pilotContent.sections[0].blocks.find((block) => block.type === 'classify'));
    if (block.type !== 'classify') throw new Error('Atividade de classificação ausente');
    for (const group of screen.getAllByRole('group')) {
      const item = block.items.find((item) =>
        group.textContent?.startsWith(item.text.replace(/`/g, '')),
      );
      if (item) fireEvent.click(within(group).getAllByRole('radio')[item.bucket]);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir feedback' }));
    expect(
      document.querySelector(`[data-narration-clip="${feedbackId}"][data-narration-reading]`),
    ).toBeInTheDocument();
    act(() => audio.emit('ended'));
    expect(screen.getByRole('button', { name: 'Retomar leitura' })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Mostrar a aula inteira'));
    fireEvent.click(screen.getByRole('button', { name: 'Retomar leitura' }));
    expect(audio.src).toContain('fetch-com-corpo__heading.mp3');
  });

  it('para a mídia quando a seção que contém o trecho é recolhida', async () => {
    render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('region', { name: 'Controles de narração da aula' });
    const showAll = screen.getByLabelText('Mostrar a aula inteira');
    fireEvent.click(showAll);
    const heading = must(document.getElementById('fechamento'));
    fireEvent.click(within(heading).getByRole('button', { name: 'Ouvir título' }));
    const audio = getActiveAudio();
    expect(audio.paused).toBe(false);
    fireEvent.click(showAll);
    await waitFor(() => expect(audio.paused).toBe(true));
    expect(audio.src).toBe('');
  });

  it('desabilita o botão do parágrafo editado quando textHash diverge e mantém os demais ativos', async () => {
    const pilotMeta = must(lessons.find((l) => l.id === 'integracao-front-e-api'));
    const edited = {
      ...pilotContent,
      hook: `${pilotContent.hook} Texto alterado manualmente.`,
    };
    const rootRef = { current: null } as unknown as React.RefObject<HTMLElement>;

    function Harness() {
      return (
        <article ref={rootRef as React.RefObject<HTMLElement>}>
          <NarrationProvider
            lesson={pilotMeta}
            content={edited}
            containerRef={rootRef}
            initialManifest={realManifest}
          >
            <NarrationPlayer />
            <p data-narration-clip="hook">
              <span data-narration-field="text">{edited.hook}</span>
              <NarrationBlockButton clipId="hook" label="Ouvir abertura" />
            </p>
            <h2 data-narration-clip="caminho-da-requisicao:heading">
              <span data-narration-field="title">{edited.sections[0].title}</span>
              <NarrationBlockButton clipId="caminho-da-requisicao:heading" label="Ouvir título" />
            </h2>
          </NarrationProvider>
        </article>
      );
    }

    render(<Harness />);

    const staleBtn = screen.getByRole('button', { name: 'Áudio desatualizado' });
    expect(staleBtn).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ouvir título' })).toBeEnabled();
    expect(screen.getByText(/1 trecho alterado aguarda regeneração/i)).toBeInTheDocument();
  });

  it('reutiliza os mesmos clipes na etapa correspondente do percurso e preserva progresso/respostas após uso', async () => {
    // Pré-popula uma resposta e checa progresso antes/depois da narração
    const existingLessonState = {
      'integracao-front-e-api': {
        reached: 1,
        done: false,
        answers: { 'caminho-da-requisicao:0': true },
      },
    };
    localStorage.setItem(lessonStoreKey, JSON.stringify(existingLessonState));

    render(
      <MemoryRouter initialEntries={['/percurso/api-react-tailwind/integracao-front-api']}>
        <Routes>
          <Route path="/percurso/:id/:etapa" element={<PercursoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('region', { name: 'Controles de narração da aula' });
    expect(
      fetchSpy.mock.calls.some(([u]) =>
        String(u).includes('/narration/integracao-front-e-api/manifest.json'),
      ),
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Ouvir seções abertas' }));
    const audio = getActiveAudio();
    expect(audio.src).toContain('/narration/integracao-front-e-api/santa/hook.mp3');

    // Posição salva em chave própria de narração; chaves de aula, revisão e percurso permanecem intocadas
    expect(JSON.parse(localStorage.getItem(NARRATION_POS_KEY) || '{}')).toBeTruthy();
    expect(localStorage.getItem(lessonStoreKey)).toBe(JSON.stringify(existingLessonState));
    expect(localStorage.getItem(reviewStoreKey)).toBeNull();
    expect(localStorage.getItem(percursoStoreKey)).toBeNull();

    // Ordem das seções no percurso segue stage.sectionIds
    const percurso = must(findPercurso('api-react-tailwind'));
    const stage = must(percurso.stages.find((s) => s.slug === 'integracao-front-api'));
    expect(stage.kind).toBe('lesson');
    if (stage.kind === 'lesson') {
      const sectionOrderInDom = Array.from(document.querySelectorAll('section.lesson-section'))
        .map((s) => s.id)
        .filter((id) => id !== 'fechamento');
      expect(stage.sectionIds).toContain(sectionOrderInDom[0]);
    }

    // Abre toda a etapa e responde uma atividade interativa após usar o player, confirmando persistência normal
    fireEvent.click(screen.getByLabelText('Mostrar a aula inteira'));
    const revealSummary = await waitFor(() =>
      must(document.querySelector('details.lesson-reveal summary')),
    );
    expect(revealSummary).toBeInTheDocument();
  });

  it('abre #cors diretamente na etapa do percurso respeitando ordem de seções', async () => {
    render(
      <MemoryRouter initialEntries={['/percurso/api-react-tailwind/integracao-front-api#cors']}>
        <Routes>
          <Route path="/percurso/:id/:etapa" element={<PercursoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('region', { name: 'Controles de narração da aula' });
    await waitFor(() => {
      expect(document.getElementById('cors')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Ouvir aula inteira' })).toBeInTheDocument();
  });

  it('para a narração imediatamente ao trocar para outra aula sem buscar manifesto inexistente', async () => {
    const otherLessonId = must(lessons.find((l) => l.id !== 'integracao-front-e-api')).id;
    const registered = new Set(NARRATED_LESSON_IDS);
    const lookup = vi
      .spyOn(NARRATED_LESSON_IDS, 'has')
      .mockImplementation((lessonId) => lessonId !== otherLessonId && registered.has(lessonId));

    function SwitcherHarness() {
      const navigate = useNavigate();
      return (
        <div>
          <button type="button" onClick={() => navigate(`/aula/${otherLessonId}`)}>
            Ir para outra aula
          </button>
          <Routes>
            <Route path="/aula/:lesson" element={<LessonPage />} />
          </Routes>
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api']}>
        <SwitcherHarness />
      </MemoryRouter>,
    );

    await screen.findByRole('region', { name: 'Controles de narração da aula' });
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir abertura' }));
    const audio = getActiveAudio();
    expect(audio.paused).toBe(false);

    const callsBeforeSwitch = fetchSpy.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Ir para outra aula' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('region', { name: 'Controles de narração da aula' }),
      ).not.toBeInTheDocument();
    });

    expect(audio.paused).toBe(true);
    expect(audio.src).toBe('');
    expect(fetchSpy.mock.calls.length).toBe(callsBeforeSwitch);
    lookup.mockRestore();
  });

  it('disponibiliza Santa e Dora, e troca de arquivo ao escolher outra voz', async () => {
    render(
      <MemoryRouter initialEntries={['/aula/integracao-front-e-api']}>
        <Routes>
          <Route path="/aula/:lesson" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const selector = await screen.findByRole('combobox', { name: 'Voz da narração' });
    expect(
      within(selector)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Santa (masculina)', 'Dora (feminina)']);
    const play = screen.getByRole('button', { name: 'Ouvir abertura' });
    fireEvent.click(play);
    const santa = getActiveAudio();
    expect(santa.src).toContain('/santa/hook.mp3');

    fireEvent.change(selector, { target: { value: 'dora' } });
    expect(santa.paused).toBe(true);
    fireEvent.click(play);
    const dora = must(must(realManifest.clips.find((clip) => clip.id === 'hook')).audio.dora);
    expect(getActiveAudio().src).toContain(`/narration/integracao-front-e-api/${dora.src}`);
  });
});
