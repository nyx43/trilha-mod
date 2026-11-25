import type { LessonContent } from '../types';

const schemaV1 = `CREATE TABLE aulas (
    id INTEGER PRIMARY KEY,
    titulo TEXT NOT NULL,
    estudada INTEGER NOT NULL
);
INSERT INTO aulas (id, titulo, estudada) VALUES
  (7, 'Rust básico', 1),
  (8, 'Filas', 0);`;

const reconciliarTitulos =
  'UPDATE aulas SET titulo_exibicao = titulo WHERE titulo_exibicao IS NOT titulo;';

const retomada = `ALTER TABLE aulas ADD COLUMN titulo_exibicao TEXT;

-- A versão anterior ainda pode criar e editar aulas.
INSERT INTO aulas (id, titulo, estudada) VALUES (9, 'API', 0);
UPDATE aulas SET titulo = 'Fundamentos' WHERE id = 7;

-- Primeiro corte para a versão nova.
${reconciliarTitulos}

-- Voltamos à versão anterior. Ela muda apenas a coluna que conhece.
UPDATE aulas SET titulo = 'Fundamentos de Rust' WHERE id = 7;

-- As escritas antigas foram pausadas de novo.
-- Reconcilie os títulos antes de retomar a versão nova.
`;

const consultarCatalogo = `
SELECT id, titulo_exibicao AS titulo, estudada FROM aulas ORDER BY id;`;

export const content: LessonContent = {
  revision: 2,
  hook: 'A versão nova do catálogo quer separar o título de exibição do campo antigo. Planeje a mudança para que a versão anterior ainda consiga ler e escrever durante a troca, e teste uma sequência que preserva títulos e progresso.',
  sections: [
    {
      id: 'coexistencia-das-versoes',
      title: 'Aumente o esquema e mantenha o contrato dos escritores antigos',
      blocks: [
        {
          type: 'text',
          text: 'Adicione `titulo_exibicao` como uma coluna opcional. Durante a coexistência, continue lendo e escrevendo o título canônico em `titulo`. Colunas novas costumam conviver com consultas que nomeiam os campos que usam. Um `INSERT INTO aulas VALUES (...)` sem lista de colunas pode falhar após a expansão. Rode o consumidor antigo contra o esquema expandido para descobrir essas dependências.',
        },
        {
          type: 'quiz',
          activityId: 'escrita-antiga-apos-expansao',
          question: 'Qual escrita antiga consegue continuar após adicionar a coluna opcional?',
          options: [
            {
              text: "`INSERT INTO aulas (id, titulo, estudada) VALUES (9, 'API', 0)`",
              correct: true,
              feedback: 'A escrita nomeia as colunas existentes. A coluna nova recebe NULL.',
            },
            {
              text: "`INSERT INTO aulas VALUES (9, 'API', 0)`",
              feedback:
                'Sem lista de colunas, a operação exige um valor para cada coluna da tabela expandida.',
            },
          ],
        },
      ],
    },
    {
      id: 'preencher-depois-de-parar-escritas',
      title: 'Preencha com os valores mais recentes',
      blocks: [
        {
          type: 'text',
          text: 'Depois de pausar os escritores antigos, copie de `titulo` as linhas em que as colunas divergem. No SQLite, `IS NOT` detecta tanto um título diferente quanto um valor NULL na coluna nova. Repita essa reconciliação após uma volta de versão, pois a aplicação anterior pode mudar um título que já havia sido copiado.',
        },
        {
          type: 'sql',
          activityId: 'preencher-titulos-e-preservar-progresso',
          title: 'Teste a migração com o catálogo em memória',
          task: 'A migração inicial já foi aplicada. Depois da volta, a versão antiga mudou o título da aula 7. Complete a reconciliação para que a consulta final mostre “Fundamentos de Rust” e preserve o progresso.',
          setup: schemaV1,
          query: retomada + consultarCatalogo,
          solution: retomada + reconciliarTitulos + consultarCatalogo,
          checks: [
            {
              label: 'Reconcilia as duas colunas após a volta',
              test: 'const consulta = run("SELECT COUNT(*) FROM aulas WHERE titulo_exibicao IS NOT titulo"); return consulta?.rows[0][0] === 0;',
            },
            {
              label: 'Mostra os títulos atualizados e preserva o progresso',
              test: 'return !!result && JSON.stringify(result.rows) === JSON.stringify([[7, "Fundamentos de Rust", 1], [8, "Filas", 0], [9, "API", 0]]);',
            },
          ],
        },
        {
          type: 'fill',
          activityId: 'preencher-sem-sobrescrever',
          language: 'sql',
          prompt:
            'Complete a comparação que detecta tanto valores ausentes quanto títulos desatualizados.',
          template:
            'UPDATE aulas SET titulo_exibicao = titulo\nWHERE titulo_exibicao [[IS NOT]] titulo;',
          explanation:
            'O SQLite compara as colunas mesmo na presença de NULL. A mesma atualização funciona no primeiro corte e depois de voltar à versão anterior.',
        },
      ],
    },
    {
      id: 'virar-a-leitura-e-testar-volta',
      title: 'Teste a versão que lê a coluna nova e planeje a volta',
      blocks: [
        {
          type: 'text',
          text: 'Valide contagens, títulos e progresso com o mesmo conjunto inicial. Quando trocar a leitura, mantenha temporariamente as duas colunas e faça a versão nova escrever o título canônico nas duas se houver necessidade de reverter a aplicação. Remova a coluna antiga apenas em uma alteração posterior, depois de verificar que consumidores e rotas de volta já não dependem dela.',
        },
        {
          type: 'order',
          activityId: 'ordem-de-migracao',
          prompt: 'Ordene a transição deste laboratório.',
          items: [
            'Expandir o esquema e verificar o consumidor anterior',
            'Parar as escritas antigas e preencher a coluna nova',
            'Verificar a paridade dos dados e mudar as leituras',
            'Remover a coluna antiga quando os consumidores já estiverem atualizados',
          ],
          explanation:
            'As etapas permitem testar compatibilidade e preparar uma volta antes de remover dados ou campos usados por outra versão.',
        },
      ],
    },
  ],
  recap: [
    'Confiro se a expansão do esquema funciona com o consumidor anterior.',
    'Copio os dados no momento em que conheço seu valor mais recente.',
    'Verifico a paridade e combino a volta antes de remover campos.',
  ],
  cards: [
    {
      id: 'expandir',
      front: 'Qual é a primeira mudança do esquema neste caso?',
      back: 'Adicionar uma coluna opcional sem remover a anterior.',
    },
    {
      id: 'colunas',
      front: 'Por que INSERT com lista de colunas ajuda na expansão?',
      back: 'A instrução continua mencionando só os campos que conhece.',
    },
    {
      id: 'preencher',
      front: 'Por que esperar o fim das escritas antigas para o preenchimento final?',
      back: 'Para que o valor copiado inclua as últimas atualizações feitas pelo consumidor anterior.',
    },
    {
      id: 'volta',
      front: 'Como manter uma volta possível enquanto as duas colunas existem?',
      back: 'Mantenha os dados necessários à versão anterior atualizados e teste sua leitura e escrita.',
    },
  ],
  mission: {
    title: 'Demonstre uma atualização de esquema reproduzível',
    text: 'Use dois conjuntos de operações, um de cada versão da aplicação.',
    steps: [
      'Suba o esquema expandido e prove que os comandos da versão anterior ainda funcionam.',
      'Simule a volta, edite um título na versão anterior e repita a reconciliação antes de retomar a versão nova.',
    ],
  },
  sources: [
    {
      title: 'SQLite — ALTER TABLE e ADD COLUMN',
      url: 'https://www.sqlite.org/lang_altertable.html',
    },
    { title: 'SQLite — INSERT e lista de colunas', url: 'https://www.sqlite.org/lang_insert.html' },
    {
      title: 'SQLite — operadores IS e IS NOT',
      url: 'https://www.sqlite.org/lang_expr.html#operators_and_parse_affecting_attributes',
    },
  ],
};
