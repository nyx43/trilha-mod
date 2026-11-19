import { Level, LinkContentType } from '../entity/RoadmapModel';
import { convertToRoadmapRead, reconcileRoadmapRead, updateReadAttribute } from './roadmapUtils';

const link = (label: string) => ({
  label,
  url: 'https://example.com',
  contentType: LinkContentType.READ,
});
const initial: Level[] = [
  {
    label: 'Base',
    items: [{ label: 'HTML', children: [{ label: 'O básico', links: [link('Semântica')] }] }],
  },
];

function completed() {
  const saved = convertToRoadmapRead(initial);
  updateReadAttribute('Base-HTML', true, () => undefined, saved);
  return saved;
}

describe('Reconciliação do progresso em trilhas revisadas', () => {
  it('migra os identificadores antigos usando o tópico do pai', () => {
    const saved = completed();
    const resource = saved[0].children?.[0].children?.[0].children?.[0];
    if (!resource) throw new Error('Missing fixture resource');
    resource.label = 'O básico-Semântica';
    const restored = reconcileRoadmapRead(initial, saved);
    expect(restored[0].read).toBe(true);
    expect(restored[0].children?.[0].children?.[0].children?.[0].label).toBe(
      'HTML-O básico-Semântica',
    );
  });

  it('mantém práticas diferentes independentes quando compartilham uma referência', () => {
    const levels: Level[] = [
      {
        label: 'Base',
        items: [
          { label: 'HTML', children: [{ label: 'Pratique', links: [link('Documentação')] }] },
          { label: 'CSS', children: [{ label: 'Pratique', links: [link('Documentação')] }] },
        ],
      },
    ];
    const saved = convertToRoadmapRead(levels);
    updateReadAttribute('HTML-Pratique', true, () => undefined, saved);
    const restored = reconcileRoadmapRead(levels, saved);
    expect(restored[0].children?.map((child) => child.read)).toEqual([true, false]);
  });

  it('preserva recursos concluídos após mover e acrescentar etapas', () => {
    const revised: Level[] = [
      { ...initial[0], label: 'Primeiros passos' },
      { label: 'Projeto', items: [{ label: 'Demo' }] },
    ];
    const restored = reconcileRoadmapRead(revised, completed());
    expect(restored[0].children?.[0].children?.[0].children?.[0].read).toBe(true);
    expect(restored[0].read).toBe(true);
    expect(restored[1].read).toBe(false);
  });

  it('não conclui material novo mesmo quando a quantidade de etapas não muda', () => {
    const revised: Level[] = [
      {
        label: 'Base',
        items: [
          {
            label: 'HTML',
            children: [{ label: 'O básico', links: [link('Semântica'), link('Formulários')] }],
          },
        ],
      },
    ];
    const restored = reconcileRoadmapRead(revised, completed());
    const section = restored[0].children?.[0].children?.[0];
    expect(section?.children?.map((child) => child.read)).toEqual([true, false]);
    expect(section?.read).toBe(false);
    expect(restored[0].read).toBe(false);
  });

  it('não altera os registros recebidos e é estável após a reconciliação', () => {
    const saved = completed();
    const snapshot = JSON.stringify(saved);
    const restored = reconcileRoadmapRead(initial, saved);
    expect(JSON.stringify(saved)).toBe(snapshot);
    expect(reconcileRoadmapRead(initial, restored)).toEqual(restored);
  });

  it('preserva marcações por id estável mesmo quando rótulos e quantidade de níveis mudam', () => {
    const original: Level[] = [
      {
        id: 'level.base',
        label: 'Base',
        items: [
          {
            id: 'topic.html',
            label: 'HTML',
            children: [
              {
                id: 'topic.html.basics',
                label: 'O básico',
                links: [{ ...link('Semântica'), id: 'resource.semantica' }],
              },
            ],
          },
        ],
      },
    ];
    const saved = convertToRoadmapRead(original);
    updateReadAttribute('Base-HTML', true, () => undefined, saved);

    const revised: Level[] = [
      {
        id: 'level.base',
        label: 'Fundamentos da Web',
        items: [
          {
            id: 'topic.html',
            label: 'HTML5 Semântico',
            children: [
              {
                id: 'topic.html.basics',
                label: 'Essenciais',
                links: [{ ...link('Semântica na Web'), id: 'resource.semantica' }],
              },
            ],
          },
        ],
      },
      {
        id: 'level.projeto',
        label: 'Projeto extra',
        items: [{ id: 'topic.demo', label: 'Demo' }],
      },
    ];

    const restored = reconcileRoadmapRead(revised, saved);
    expect(restored).toHaveLength(2);
    expect(restored[0].children?.[0]?.children?.[0]?.children?.[0]?.read).toBe(true);
    expect(restored[0].read).toBe(true);
    expect(restored[1].read).toBe(false);
  });

  it('trata níveis vazios sem lançar erro e sem marcar níveis vazios como concluídos', () => {
    const emptyLevels: Level[] = [{ items: [] }, { label: '', items: [] }];
    const converted = convertToRoadmapRead(emptyLevels);
    expect(converted).toHaveLength(2);
    expect(converted.every((level) => level.read === false)).toBe(true);

    const reconciled = reconcileRoadmapRead(emptyLevels, converted);
    expect(reconciled).toHaveLength(2);
    expect(reconciled.every((level) => level.read === false)).toBe(true);
  });

  it('não transfere conclusão para recurso novo com ID e URL diferentes mesmo com o mesmo título', () => {
    const original: Level[] = [
      {
        id: 'level.base',
        label: 'Base',
        items: [
          {
            id: 'topic.html',
            label: 'HTML',
            children: [
              {
                id: 'topic.html.basics',
                label: 'O básico',
                links: [
                  {
                    id: 'resource.docs-antiga',
                    label: 'Documentação',
                    url: 'https://antigo.example.com/docs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const saved = convertToRoadmapRead(original);
    updateReadAttribute('Base-HTML', true, () => undefined, saved);

    const replaced: Level[] = [
      {
        id: 'level.base',
        label: 'Base',
        items: [
          {
            id: 'topic.html',
            label: 'HTML',
            children: [
              {
                id: 'topic.html.basics',
                label: 'O básico',
                links: [
                  {
                    id: 'resource.docs-nova',
                    label: 'Documentação',
                    url: 'https://novo.example.com/docs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const restored = reconcileRoadmapRead(replaced, saved);
    const leaf = restored[0].children?.[0]?.children?.[0]?.children?.[0];
    expect(leaf?.read).toBe(false);
    expect(restored[0].children?.[0]?.children?.[0]?.read).toBe(false);
    expect(restored[0].read).toBe(false);
  });

  it('não transfere conclusão quando um recurso sem ID muda de URL mantendo o mesmo título', () => {
    const original: Level[] = [
      {
        label: 'Base',
        items: [
          {
            label: 'HTML',
            children: [
              {
                label: 'O básico',
                links: [
                  {
                    label: 'Documentação',
                    url: 'https://antigo.example.com/docs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const saved = convertToRoadmapRead(original);
    updateReadAttribute('Base-HTML', true, () => undefined, saved);

    const replaced: Level[] = [
      {
        label: 'Base',
        items: [
          {
            label: 'HTML',
            children: [
              {
                label: 'O básico',
                links: [
                  {
                    label: 'Documentação',
                    url: 'https://novo.example.com/docs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const restored = reconcileRoadmapRead(replaced, saved);
    expect(restored[0].children?.[0]?.children?.[0]?.children?.[0]?.read).toBe(false);
    expect(restored[0].read).toBe(false);
  });

  it('mantém compatibilidade com progresso legado salvo apenas por rótulo sem ID nem URL', () => {
    const modern: Level[] = [
      {
        id: 'level.base',
        label: 'Base',
        items: [
          {
            id: 'topic.html',
            label: 'HTML',
            children: [
              {
                id: 'topic.html.basics',
                label: 'O básico',
                links: [
                  {
                    id: 'resource.docs',
                    label: 'Documentação',
                    url: 'https://example.com/docs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const legacySaved = [
      {
        label: 'Base',
        read: true,
        children: [
          {
            label: 'Base-HTML',
            read: true,
            children: [
              {
                label: 'HTML-O básico',
                read: true,
                children: [{ label: 'HTML-O básico-Documentação', read: true }],
              },
            ],
          },
        ],
      },
    ];

    const restored = reconcileRoadmapRead(modern, legacySaved);
    expect(restored[0].children?.[0]?.children?.[0]?.children?.[0]?.read).toBe(true);
    expect(restored[0].read).toBe(true);
  });

  it('preserva conclusão quando uma seção sem ID recebe seu primeiro ID e o recurso mantém ID, título e URL', () => {
    const beforeSectionId: Level[] = [
      {
        id: 'level.base',
        label: 'Base',
        items: [
          {
            id: 'topic.html',
            label: 'HTML',
            children: [
              {
                label: 'O básico',
                links: [
                  {
                    id: 'resource.docs',
                    label: 'Documentação',
                    url: 'https://example.com/docs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const saved = convertToRoadmapRead(beforeSectionId);
    updateReadAttribute('Base-HTML', true, () => undefined, saved);

    const afterSectionId: Level[] = [
      {
        id: 'level.base',
        label: 'Base',
        items: [
          {
            id: 'topic.html',
            label: 'HTML',
            children: [
              {
                id: 'topic.html.basics',
                label: 'O básico',
                links: [
                  {
                    id: 'resource.docs',
                    label: 'Documentação',
                    url: 'https://example.com/docs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const restored = reconcileRoadmapRead(afterSectionId, saved);
    const leaf = restored[0].children?.[0]?.children?.[0]?.children?.[0];
    expect(leaf?.id).toBe('topic.html.basics::resource.docs');
    expect(leaf?.read).toBe(true);
    expect(restored[0].children?.[0]?.children?.[0]?.read).toBe(true);
    expect(restored[0].read).toBe(true);
  });

  it('mantém pendente um recurso substituído (outro ID e outra URL) quando uma seção sem ID recebe seu primeiro ID', () => {
    const beforeSectionId: Level[] = [
      {
        id: 'level.base',
        label: 'Base',
        items: [
          {
            id: 'topic.html',
            label: 'HTML',
            children: [
              {
                label: 'O básico',
                links: [
                  {
                    id: 'resource.docs-antiga',
                    label: 'Documentação',
                    url: 'https://antigo.example.com/docs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const saved = convertToRoadmapRead(beforeSectionId);
    updateReadAttribute('Base-HTML', true, () => undefined, saved);

    const afterSectionIdAndReplacement: Level[] = [
      {
        id: 'level.base',
        label: 'Base',
        items: [
          {
            id: 'topic.html',
            label: 'HTML',
            children: [
              {
                id: 'topic.html.basics',
                label: 'O básico',
                links: [
                  {
                    id: 'resource.docs-nova',
                    label: 'Documentação',
                    url: 'https://novo.example.com/docs',
                    contentType: LinkContentType.READ,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const restored = reconcileRoadmapRead(afterSectionIdAndReplacement, saved);
    const leaf = restored[0].children?.[0]?.children?.[0]?.children?.[0];
    expect(leaf?.read).toBe(false);
    expect(restored[0].read).toBe(false);
  });
});
