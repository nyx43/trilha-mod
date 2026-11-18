import { LessonContent } from '../lessons/types';

export interface PercursoLessonStage {
  kind: 'lesson';
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  lessonId: string;
  sectionIds: string[];
  focusNote: string;
  cardIds?: string[];
  load: () => Promise<{ content: LessonContent }>;
}

export interface PercursoMissionStage {
  kind: 'mission';
  slug: string;
  title: string;
  summary: string;
  minutes: number;
}

export type PercursoStage = PercursoLessonStage | PercursoMissionStage;

export interface Percurso {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  goalNote: string;
  stages: PercursoStage[];
}

export const apiReactTailwindPercurso: Percurso = {
  id: 'api-react-tailwind',
  eyebrow: 'Percurso curto · Entrega da semana',
  title: 'API Node, requisições no React, integração e Tailwind na prática',
  summary:
    'Roteiro enxuto reunindo as seções essenciais de Node e Express, requisições no React, integração front/API e a nova aula de Tailwind, terminando com a missão prática usando o contrato de GET /heroes e POST /heroes.',
  goalNote:
    'Este percurso prepara você para escrever e testar seu próprio código (API Node + frontend React com Tailwind) antes de enviar os dois links do GitHub ao professor.',
  stages: [
    {
      kind: 'lesson',
      slug: 'node-e-express',
      title: 'Node.js e Express',
      summary:
        'JavaScript no servidor, projeto Node, anatomia do Express, rotas com status 200/201/400/404, middlewares e testes com curl.',
      minutes: 16,
      lessonId: 'node-e-express',
      sectionIds: [
        'javascript-fora-do-navegador',
        'projeto-e-modulos',
        'anatomia-do-servidor',
        'rotas-e-status',
        'middleware-e-erros',
        'mini-roteador',
      ],
      focusNote:
        'Observe com atenção o `express.json()`, o retorno de status `200`/`201`/`400` e o teste com `curl -i`: essa é a mesma estrutura que sustenta `GET /heroes` e `POST /heroes`.',
      load: () => import('../lessons/content/nodeEExpress'),
    },
    {
      kind: 'lesson',
      slug: 'requisicoes-react',
      title: 'Requisições no React',
      summary:
        'Buscar dados ao abrir a tela com useEffect, tratar carregando, vazio e erro, e evitar respostas fora de ordem.',
      minutes: 9,
      lessonId: 'react-rotas-e-requisicoes',
      sectionIds: ['dados-no-efeito', 'corrida-e-cancelamento', 'bibliotecas-de-dados'],
      focusNote:
        'Aqui estão apenas as 3 seções de requisições da aula “Rotas e requisições”, deixando React Router de fora para manter o percurso curto.',
      cardIds: [
        'quatro-estados-react',
        'condicao-de-corrida',
        'abort-controller',
        'tanstack-query',
      ],
      load: () => import('../lessons/content/reactRotasERequisicoes'),
    },
    {
      kind: 'lesson',
      slug: 'integracao-front-api',
      title: 'Integração entre frontend e API',
      summary:
        'POST com fetch e JSON.stringify, CORS no Express vs proxy no Vite, VITE_API_URL e tratamento de falhas sem apagar o formulário.',
      minutes: 16,
      lessonId: 'integracao-front-e-api',
      sectionIds: [
        'caminho-da-requisicao',
        'fetch-com-corpo',
        'cors',
        'proxy-e-ambientes',
        'estados-e-falhas',
        'atualizacao-otimista',
      ],
      focusNote:
        'Fique de olho em CORS (seção 3) e no tratamento de resposta 400 (seção 5): na sua API de heróis, o erro 400 volta no campo `message`, então leia `corpo?.message ?? corpo?.erro`.',
      load: () => import('../lessons/content/integracaoFrontEApi'),
    },
    {
      kind: 'lesson',
      slug: 'tailwind-na-pratica',
      title: 'Tailwind na prática',
      summary:
        'Classes utilitárias em um exemplo diferente da entrega, foco acessível por teclado, layout mobile-first e passos reais no React + Vite.',
      minutes: 16,
      lessonId: 'tailwind-na-pratica',
      sectionIds: [
        'classes-utilitarias',
        'foco-e-estados',
        'layout-responsivo',
        'pratica-no-playground-e-vite',
      ],
      focusNote:
        'O exemplo da aula é um Painel de Oficinas (fora do tema de super-heróis) para você treinar utilitários, foco e mobile-first antes de aplicar na sua interface.',
      load: () => import('../lessons/content/tailwindNaPratica'),
    },
    {
      kind: 'mission',
      slug: 'missao-final',
      title: 'Missão final: sua entrega (API + React + Tailwind)',
      summary:
        'Construa por conta própria a listagem e o cadastro contra GET/POST /heroes, diagnostique uma falha real, confira no celular e valide os dois links do GitHub.',
      minutes: 30,
    },
  ],
};

export const percursos: Percurso[] = [apiReactTailwindPercurso];
export const diagnosticoWebSlug = 'diagnostico-web';
export const diagnosticoWebDownload = '/praticas/diagnostico-web.zip';

export function findPercurso(id: string | undefined): Percurso | undefined {
  return percursos.find((item) => item.id === id);
}

export const superheroesContractSnippet = `// Contrato conferido na cópia de estudo (/exercicios/superheroes-api)
// Servidor Express na porta 3000 · app.use(express.json()) · app.use("/heroes", heroesRoutes)

// 1) GET /heroes
//    Chama Hero.findAll() no Sequelize (SQLite: ./datebase.sqlite)
//    Resposta 200 OK -> array JSON:
[
  {
    "id": 1,
    "name": "Tempestade",
    "universe": "Marvel",
    "power": "Controle do clima",
    "createdAt": "2026-11-05T09:09:00.000Z",
    "updatedAt": "2026-11-05T09:09:00.000Z"
  }
]

// 2) POST /heroes
//    Corpo esperado (Content-Type: application/json):
{ "name": "Tempestade", "universe": "Marvel", "power": "Controle do clima" }

//    Se faltar name, universe ou power -> 400 Bad Request:
{ "message": "Nome, universo e poder são obrigatórios" }

//    Se válido -> 201 Created com o objeto criado (incluindo id, createdAt, updatedAt).

// Atenção ao conectar com o frontend React/Vite (:5173):
// src/app.js atual ainda NÃO configura o middleware cors().`;

export const missionTasks = [
  '**1. Subir a API e conferir o contrato real**: rode a API na porta `3000`, teste `GET /heroes` e `POST /heroes` (válido `201` e inválido `400` com `message`) usando `curl -i`, e libere CORS para `http://localhost:5173` (ou configure o proxy `/api` no Vite).',
  '**2. Listar dados (`GET /heroes`)**: no seu projeto React + Vite + Tailwind, busque `GET /heroes` ao abrir a página com `useEffect`, mostrando estado de carregamento, estado vazio quando a lista vier `[]` e erro com botão para tentar novamente.',
  '**3. Cadastrar (`POST /heroes`)**: monte um formulário controlado com `<label>` conectado aos campos `name`, `universe` e `power`, envie JSON com `Content-Type: application/json`, desative o botão enquanto salva, atualize a lista no `201` e exiba `dados.message` no `400` sem apagar o que você digitou.',
  '**4. Diagnosticar uma falha**: provoque de propósito duas falhas — (a) chamar `http://localhost:3000/heroes` a partir de `:5173` sem CORS (ou com a API parada) para ler a causa no Console e na aba Network; (b) enviar um `POST /heroes` com campo vazio para conferir o status `400` e o JSON `{ message }` no Network.',
  '**5. Conferir a tela no celular**: abra o DevTools em modo dispositivo (`360px`) — e, se possível, no celular pela rede local — conferindo que não há rolagem horizontal, que o layout empilha em 1 coluna (`grid-cols-1`) antes de expandir (`sm:`/`md:`), que os botões têm boa área de toque (`min-h-[44px]`) e que o `Tab` mostra foco visível (`focus-visible:ring-2`).',
];

export const missionCriteria = [
  '`curl http://localhost:3000/heroes` devolve `200` com JSON e `POST /heroes` responde `201` (válido) e `400` com `{ "message": "..." }` (faltando campo).',
  'A interface carrega a lista ao abrir, trata lista vazia/carregamento/erro e mantém um herói recém-cadastrado após recarregar a página (`F5`).',
  'Com a API desligada ou campo inválido, a tela mostra mensagem útil em português e preserva os dados digitados no formulário.',
  'Em `360px` de largura não existe barra de rolagem horizontal (`scrollWidth <= innerWidth`) e toda ação pode ser feita pelo teclado com foco visível.',
  'Você consegue explicar cada arquivo que escreveu (rotas/controller da API, `fetch`/estados do React e classes utilitárias/responsivas do Tailwind) sem depender de IA.',
];

export function githubDeliveryChecklist(frontendStack: string) {
  return [
    '**Link 1 — GitHub da API Node**: código próprio enviado ao GitHub (sem `node_modules/`), `package.json` com scripts funcionando e `README.md` explicando como rodar (`npm install`, `npm start`) e os contratos `GET /heroes` e `POST /heroes`.',
    `**Link 2 — GitHub do frontend ${frontendStack}**: código próprio enviado ao GitHub (sem \`node_modules/\` nem \`.env\` com segredos), Tailwind configurado, foco e responsividade, e \`README.md\` explicando como configurar a URL da API e rodar o projeto.`,
    '**Conferência final dos dois links**: abrir ambos os repositórios no navegador em janela anônima para confirmar que estão acessíveis, com o último commit visível e com os testes manuais feitos por você.',
  ];
}

export const missionGithubChecklist = githubDeliveryChecklist('React + Tailwind');
