import type { LessonContent } from '../types';

const schemaV1 = `CREATE TABLE aulas (
    id INTEGER PRIMARY KEY,
    titulo TEXT NOT NULL,
    estudada INTEGER NOT NULL
);
INSERT INTO aulas (id, titulo, estudada) VALUES
  (7, 'Rust básico', 1),
  (8, 'Filas', 0);`;

const migracao = `ALTER TABLE aulas ADD COLUMN titulo_exibicao TEXT;

-- A versão anterior ainda pode criar e editar aulas.
INSERT INTO aulas (id, titulo, estudada) VALUES (9, 'API', 0);
UPDATE aulas SET titulo = 'Fundamentos' WHERE id = 7;

-- Após parar as escritas antigas, preencha a coluna nova.
UPDATE aulas SET titulo_exibicao = titulo WHERE titulo_exibicao IS NULL;

SELECT id, titulo_exibicao AS titulo, estudada FROM aulas ORDER BY id;`;

export const content: LessonContent = {
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
          text: 'Depois de retirar ou pausar os escritores antigos, faça o preenchimento e verifique a coluna nova antes de trocar as leituras. Neste roteiro, a coluna fica vazia até o corte, então copiamos apenas nas linhas com NULL. Enquanto uma versão anterior ainda puder mudar `titulo`, trate-o como a fonte canônica. Em bancos grandes, planeje lotes e um mecanismo explícito para sincronizar escritas que ocorrerem durante a cópia.',
        },
        {
          type: 'sql',
          activityId: 'preencher-titulos-e-preservar-progresso',
          title: 'Teste a migração com o catálogo em memória',
          task: 'Complete a atualização da coluna nova no trecho indicado. A aplicação anterior acaba de criar a aula 9 e mudar o título da aula 7. A consulta final precisa mostrar os títulos mais recentes e manter o progresso existente.',
          setup: schemaV1,
          query: migracao.replace(
            'UPDATE aulas SET titulo_exibicao = titulo WHERE titulo_exibicao IS NULL;',
            '-- Preencha titulo_exibicao a partir de titulo.',
          ),
          solution: migracao,
          checks: [
            {
              label: 'Preenche a nova coluna para as três aulas',
              test: 'const consulta = run("SELECT COUNT(*) FROM aulas WHERE titulo_exibicao IS NOT NULL"); return consulta?.rows[0][0] === 3;',
            },
            {
              label: 'Mostra os títulos atualizados e preserva o progresso',
              test: 'return !!result && JSON.stringify(result.rows) === JSON.stringify([[7, "Fundamentos", 1], [8, "Filas", 0], [9, "API", 0]]);',
            },
          ],
        },
        {
          type: 'fill',
          activityId: 'preencher-sem-sobrescrever',
          language: 'sql',
          prompt:
            'Complete a condição que limita a cópia aos registros ainda sem título de exibição.',
          template: 'UPDATE aulas SET titulo_exibicao = titulo\nWHERE titulo_exibicao IS [[NULL]];',
          explanation:
            'O preenchimento incide apenas sobre a parte ainda pendente. Execute a migração de esquema pela ordem registrada no histórico.',
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
      'Faça o preenchimento, compare todos os campos relevantes e registre em que momento deixaria de ser possível voltar.',
    ],
  },
  sources: [
    {
      title: 'SQLite — ALTER TABLE e ADD COLUMN',
      url: 'https://www.sqlite.org/lang_altertable.html',
    },
    { title: 'SQLite — INSERT e lista de colunas', url: 'https://www.sqlite.org/lang_insert.html' },
  ],
};
