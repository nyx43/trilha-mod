import { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Num catálogo de e-commerce, uma camiseta tem `tamanho` e `tecido`, um notebook tem `ram_gb` e `gpu`, e um livro tem `isbn` e `paginas`. Tentar enfiar centenas de atributos variáveis numa única tabela SQL rígida gera tabelas esparsas ou o temido padrão EAV impossível de consultar. **MongoDB e bancos orientados a documentos** brilham exatamente aí — mas escolher NoSQL sem critério em dados altamente relacionais ou financeiros cria dores de cabeça muito piores.',
  sections: [
    {
      id: 'onde-nosql-brilha-e-onde-falha',
      title: 'SQL vs. MongoDB: onde bancos documentais são usados na vida real',
      blocks: [
        {
          type: 'text',
          text: 'Bancos orientados a documentos como o **MongoDB** armazenam registros como **documentos BSON** (Binary JSON) agrupados em **coleções**, sem exigir que todos os documentos tenham exatamente as mesmas chaves. Isso reduz o descompasso entre objetos da aplicação e o armazenamento em disco — e permite ler um objeto agregado inteiro numa única operação sem `JOIN`.',
        },
        {
          type: 'table',
          caption: 'Comparação honesta de produção: Relacional (PostgreSQL) × Documental (MongoDB)',
          head: [
            'Critério',
            'Relacional (SQL / PostgreSQL)',
            'Documental (MongoDB / BSON)',
            'Regra prática de escolha',
          ],
          rows: [
            [
              'Unidade de dado',
              'Linha em tabela com schema fixo',
              'Documento BSON aninhado em coleção',
              'Schema muito polimórfico favorece documento (ou `JSONB` no Postgres)',
            ],
            [
              'Relacionamentos N:N',
              'Chaves estrangeiras + `JOIN` nativo e rápido',
              'Referências + `$lookup` (mais caro sob escala)',
              'Muitos cruzamentos N:N apontam fortemente para SQL',
            ],
            [
              'Leitura de agregado completo',
              'Pode exigir múltiplos JOINs',
              '1 única leitura de documento (embedding)',
              'Catálogos, carrinhos, perfis e logs de eventos brilham em documentos',
            ],
            [
              'Integridade & Transações',
              'ACID nativo desde a base; FKs garantidas pelo motor',
              'Atômico por documento (e transações multi-doc mais custosas)',
              'Saldos bancários, contabilidade e estoque crítico preferem SQL',
            ],
            [
              'Escala horizontal',
              'Replicação de leitura + sharding mais complexo',
              'Sharding nativo por chave de partição (shard key)',
              'Sharding só faz sentido em volumes enormes (> terabytes)',
            ],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Mito perigoso: "MongoDB é schemaless, então não precisa modelar!"',
          text: '"Sem schema rígido no banco" significa apenas que **o schema passou a morar no seu código** (schema-on-read). Se cada versão da API grava `preco` ora como `number`, ora como `string` (`"49.90"`), suas consultas e somatórios quebram silenciosamente. Em produção, times usam **JSON Schema Validation** no MongoDB e validação rigorosa na API.',
        },
      ],
    },
    {
      id: 'modelagem-embedding-vs-referencia',
      title: 'A decisão #1 no MongoDB: Embedding (aninhar) vs. Referência (normalizar)',
      blocks: [
        {
          type: 'text',
          text: 'A maior diferença entre modelar em SQL e modelar em MongoDB resume-se a uma frase: **em SQL você modela pelos dados (normalização); em MongoDB você modela pelos padrões de acesso (como a aplicação lê e escreve)**.',
        },
        {
          type: 'codeTabs',
          caption: 'O mesmo pedido modelado com Embedding vs. Referência',
          tabs: [
            {
              label: 'Embedding (Recomendado para itens do pedido)',
              language: 'json',
              code: `{
  "_id": "ped_901",
  "cliente_id": "cli_42",
  "status": "PAGO",
  "criado_em": "2026-11-20T14:10:00Z",
  "itens": [
    { "sku": "LIV-01", "titulo": "Sistemas Operacionais", "qtd": 1, "preco_unit": 120.0 },
    { "sku": "MOU-09", "titulo": "Mouse Ergonômico", "qtd": 2, "preco_unit": 85.0 }
  ]
}`,
            },
            {
              label: 'Referência (Recomendado para coleções ilimitadas)',
              language: 'json',
              code: `// Coleção: clientes (1 documento por cliente)
{ "_id": "cli_42", "nome": "Ana Souza", "tier": "PRO" }

// Coleção: eventos_auditoria (pode crescer para milhões de registros!)
// NUNCA aninhe arrays sem limite dentro do cliente (limite de 16 MB por doc no MongoDB!)
{ "_id": "ev_8801", "cliente_id": "cli_42", "acao": "LOGIN", "ip": "10.0.0.5" }`,
            },
          ],
        },
        {
          type: 'terms',
          items: [
            {
              term: 'Embedding (Aninhamento)',
              text: 'Use para relações `1:1` ou `1:poucos` que são **sempre lidas juntas** e têm tamanho limitado (ex.: endereços de entrega, itens de um pedido). Uma única leitura traz tudo e a atualização é atômica.',
            },
            {
              term: 'Referência (Linking)',
              text: 'Use para relações `1:muitos` sem limite (logs, comentários de um vídeo viral, transações de uma conta) ou `N:N` com atualizações frequentes, evitando estourar o **limite de 16 MB por documento BSON** e duplicar atualizações.',
            },
            {
              term: 'Unbounded Array Anti-Pattern',
              text: 'O antipadrão mais clássico no MongoDB: empurrar itens infinitamente num array (`$push`) dentro de um único documento. O documento cresce, precisa ser realocado no disco o tempo todo e acaba quebrando no limite de 16 MB.',
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'mdb-q1-embedding-vs-ref',
          question:
            'Você está modelando um sistema de streaming no MongoDB. Um filme tem cerca de 5 gêneros e 3 links de pôster, mas pode receber **500.000 avaliações (reviews)** de usuários ao longo dos anos. Como modelar?',
          options: [
            {
              text: 'Aninhar `generos` e `posteres` dentro do documento `filmes` (embedding), mas armazenar as `avaliacoes` em uma coleção separada referenciando `filme_id` (e opcionalmente manter `nota_media` e `total_avaliacoes` pré-calculados no filme).',
              correct: true,
              feedback:
                'Modelagem impecável! `generos` e `posteres` são pequenos e sempre lidos com o filme; `avaliacoes` crescem sem limite (evita o antipadrão de array ilimitado de 16 MB), e o resumo pré-calculado deixa a tela inicial em O(1).',
            },
            {
              text: 'Aninhar todas as 500.000 avaliações dentro de um array `reviews: [...]` no documento do filme para ler tudo numa única query.',
              feedback:
                '500 mil objetos dentro de um único documento estouram facilmente o limite de 16 MB do BSON e tornam cada consulta lentíssima ao trafegar megabytes só para mostrar a capa do filme.',
            },
            {
              text: 'Criar coleções separadas para `generos`, `posteres`, `filmes_generos` e `avaliacoes`, fazendo 4 `$lookup`s em toda leitura.',
              feedback:
                'Super-normalizar tudo no MongoDB desperdiça a principal vantagem do banco documental e cria `$lookup`s caros. Se tudo precisa ser super-normalizado, PostgreSQL seria escolha melhor.',
            },
            {
              text: 'Salvar tudo como uma única string CSV dentro do campo `dados` do filme.',
              feedback:
                'Armazenar CSV dentro de campo texto impede indexação, filtros, projeções e agregações no banco.',
            },
          ],
        },
      ],
    },
    {
      id: 'crud-aggregation-e-indices',
      title: 'Consultas, Aggregation Pipeline e Índices compostos (ESR)',
      blocks: [
        {
          type: 'text',
          text: 'A atividade de aclimatação da disciplina apresenta o CRUD (`insertOne`, `find`, `updateOne`, `deleteOne`). Em aplicações reais, dois recursos separam quem apenas "salva JSON" de quem opera MongoDB com performance: o **Aggregation Pipeline** (transformação em estágios encadeados) e **índices bem projetados**.',
        },
        {
          type: 'anatomy',
          caption: 'Aggregation Pipeline real: faturamento por categoria apenas de pedidos pagos',
          language: 'javascript',
          parts: [
            { text: 'db.pedidos.aggregate([\n  ' },
            {
              text: '{ $match: { status: "PAGO" } },',
              label: '$match cedo (usa índice!)',
              note: 'Filtrar no 1º estágio reduz drasticamente os documentos processados e permite que o MongoDB use índice em `status`.',
            },
            { text: '\n  ' },
            {
              text: '{ $unwind: "$itens" },',
              label: '$unwind (desdobra array)',
              note: 'Transforma cada elemento do array `itens` em um documento temporário no pipeline para poder somar por categoria.',
            },
            { text: '\n  ' },
            {
              text: '{ $group: { _id: "$itens.categoria", receita: { $sum: { $multiply: ["$itens.qtd", "$itens.preco"] } } } },',
              label: '$group (agregação)',
              note: 'Equivalente ao `GROUP BY` do SQL, calculando soma, média ou contagem por chave `_id`.',
            },
            { text: '\n  ' },
            {
              text: '{ $sort: { receita: -1 } }',
              label: '$sort final',
              note: 'Ordena apenas o resultado já resumido por categoria (poucas linhas!).',
            },
            { text: '\n])' },
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Regra ESR para Índices Compostos no MongoDB',
          text: 'Ao criar um índice composto `createIndex({ a: 1, b: 1, c: 1 })`, siga a ordem **E → S → R**: primeiro campos de **E**quality (`status: "PAGO"`), depois **S**ort (`criado_em: -1`), por último **R**ange (`total: { $gte: 100 }`). Isso evita ordenação em memória (`SORT` stage) e evita `COLLSCAN` (varredura total da coleção).',
        },
      ],
    },
    {
      id: 'continuidade-acid-base-e-polyglot',
      title: 'Continuidade: ACID × BASE, Persistência Poliglota e JSONB no PostgreSQL',
      blocks: [
        {
          type: 'text',
          text: 'Sistemas modernos raramente são "100% SQL" ou "100% NoSQL". Na prática, arquiteturas maduras usam **Persistência Poliglota** (ex.: PostgreSQL para transações financeiras, MongoDB para catálogo/CMS, Redis para cache/sessões) — ou aproveitam colunas `JSONB` com índice GIN dentro do próprio PostgreSQL quando só 10% do sistema precisa de atributos flexíveis.',
        },
        {
          type: 'classify',
          activityId: 'mdb-c1-sql-vs-nosql',
          prompt:
            'Indique a abordagem de persistência mais adequada para cada requisito de produção:',
          buckets: [
            'SQL Relacional (PostgreSQL)',
            'Documental (MongoDB)',
            'Chave-Valor em Memória (Redis)',
          ],
          items: [
            {
              text: 'Livro-razão contábil de transferências entre contas com integridade referencial rígida',
              bucket: 0,
            },
            {
              text: 'Catálogo de marketplace onde cada categoria de produto possui dezenas de atributos técnicos diferentes',
              bucket: 1,
            },
            {
              text: 'Contador de rate-limit por IP que expira automaticamente após 60 segundos (TTL)',
              bucket: 2,
            },
            {
              text: 'Relatório gerencial cruzando 5 entidades (alunos, turmas, professores, unidades, pagamentos) via JOINs',
              bucket: 0,
            },
            {
              text: 'Armazenamento de formulários dinâmicos criados pelos próprios clientes com campos arbitrários',
              bucket: 1,
            },
            {
              text: 'Cache temporário da página inicial de catálogo para evitar bater no disco a cada visita',
              bucket: 2,
            },
          ],
          explanation:
            'SQL vence em integridade relacional e transações complexas; MongoDB brilha em documentos polimórficos e leitura de agregados; Redis é imbatível em cache volátil e contadores com TTL.',
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: SQL relacional comparativo + motor documental simulado',
      blocks: [
        {
          type: 'text',
          text: 'Você vai comparar os dois mundos na prática: primeiro escreva a consulta relacional equivalente em **SQLite real** (**Nível 1**), depois implemente filtros, projeção e Aggregation Pipeline em uma **simulação local em memória em Python** (sinalizada explicitamente como simulação didática — sem servidor MongoDB externo) (**Nível 2**) e feche com decisão de índice ESR (**Nível 3**).',
        },
        {
          type: 'sql',
          activityId: 'mdb-sql-n1-comparativo-relacional',
          title: 'Nível 1 — O lado SQL: receita por categoria apenas de pedidos PAGOS',
          task: "No SQLite real abaixo, escreva uma consulta que junte `pedidos` e `itens_pedido`, considere **apenas** `status = 'PAGO'`, calcule `receita` como `SUM(qtd * preco)` agrupado por `categoria` e ordene por `receita DESC`.",
          setup: `CREATE TABLE pedidos (id INTEGER PRIMARY KEY, status TEXT);
CREATE TABLE itens_pedido (id INTEGER PRIMARY KEY, pedido_id INTEGER, categoria TEXT, qtd INTEGER, preco REAL);
INSERT INTO pedidos VALUES (1, 'PAGO'), (2, 'CANCELADO'), (3, 'PAGO');
INSERT INTO itens_pedido VALUES
  (1, 1, 'Livros', 2, 60.0),
  (2, 1, 'Perifericos', 1, 150.0),
  (3, 2, 'Livros', 10, 60.0),
  (4, 3, 'Livros', 1, 80.0),
  (5, 3, 'Cursos', 2, 100.0);`,
          query: `-- Escreva SELECT categoria, SUM(...) AS receita ...
SELECT categoria, 0 AS receita FROM itens_pedido GROUP BY categoria;`,
          solution: `SELECT i.categoria, SUM(i.qtd * i.preco) AS receita
FROM pedidos p
JOIN itens_pedido i ON i.pedido_id = p.id
WHERE p.status = 'PAGO'
GROUP BY i.categoria
ORDER BY receita DESC;`,
          checks: [
            {
              label: 'Ignora pedidos CANCELADO e calcula receita exata por categoria',
              test: `if (!result) return false;
              const rows = result.rows;
              return rows.length === 3 && rows[0][0] === 'Livros' && Number(rows[0][1]) === 200 && rows[1][0] === 'Cursos' && Number(rows[1][1]) === 200 || (rows.length === 3 && Number(rows[0][1]) === 200 && Number(rows[1][1]) === 200 && rows[2][0] === 'Perifericos' && Number(rows[2][1]) === 150);`,
            },
            {
              label: 'Ordena da maior receita para a menor',
              test: `if (!result || result.rows.length < 3) return false;
              return Number(result.rows[0][1]) >= Number(result.rows[1][1]) && Number(result.rows[1][1]) >= Number(result.rows[2][1]);`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'mdb-py-n2-aggregation-simulada',
          title:
            'Nível 2 — Simulação local em memória: Aggregation Pipeline documental (estilo MongoDB)',
          task: 'Nota: esta prática roda sobre uma **coleção simulada em memória** (lista de dicts Python) reproduzindo a lógica exata do pipeline `$match -> $unwind -> $group -> $sort` do MongoDB. Implemente `pipeline_receita_categoria(colecao_pedidos)` que filtra `status == "PAGO"`, desdobra `itens`, soma `qtd * preco` por `categoria` e retorna lista de documentos `[{"_id": cat, "receita": total}, ...]` ordenada por `receita` decrescente e `_id` crescente.',
          code: `# Dados simulados localmente representando documentos BSON da coleção "pedidos"
PEDIDOS_SIMULADOS = [
    {"_id": "p1", "status": "PAGO", "itens": [{"categoria": "Livros", "qtd": 2, "preco": 60.0}, {"categoria": "Perifericos", "qtd": 1, "preco": 150.0}]},
    {"_id": "p2", "status": "CANCELADO", "itens": [{"categoria": "Livros", "qtd": 10, "preco": 60.0}]},
    {"_id": "p3", "status": "PAGO", "itens": [{"categoria": "Livros", "qtd": 1, "preco": 80.0}, {"categoria": "Cursos", "qtd": 2, "preco": 100.0}]},
]

def pipeline_receita_categoria(colecao_pedidos: list[dict]) -> list[dict]:
    # TODO: implementar estágios equivalentes a $match, $unwind, $group e $sort
    return []

print(pipeline_receita_categoria(PEDIDOS_SIMULADOS))
`,
          solution: `PEDIDOS_SIMULADOS = [
    {"_id": "p1", "status": "PAGO", "itens": [{"categoria": "Livros", "qtd": 2, "preco": 60.0}, {"categoria": "Perifericos", "qtd": 1, "preco": 150.0}]},
    {"_id": "p2", "status": "CANCELADO", "itens": [{"categoria": "Livros", "qtd": 10, "preco": 60.0}]},
    {"_id": "p3", "status": "PAGO", "itens": [{"categoria": "Livros", "qtd": 1, "preco": 80.0}, {"categoria": "Cursos", "qtd": 2, "preco": 100.0}]},
]

def pipeline_receita_categoria(colecao_pedidos: list[dict]) -> list[dict]:
    # 1. $match
    pagos = [doc for doc in colecao_pedidos if doc.get("status") == "PAGO"]
    # 2. $unwind + 3. $group
    totais = {}
    for doc in pagos:
        for item in doc.get("itens", []):
            cat = item["categoria"]
            totais[cat] = totais.get(cat, 0.0) + item["qtd"] * item["preco"]
    # 4. $sort
    ordenado = sorted(totais.items(), key=lambda kv: (-kv[1], kv[0]))
    return [{"_id": cat, "receita": val} for cat, val in ordenado]

print(pipeline_receita_categoria(PEDIDOS_SIMULADOS))
`,
          checks: [
            {
              label: 'Ignora documentos CANCELADO e agrega receita correta por categoria',
              test: `pipeline_receita_categoria(PEDIDOS_SIMULADOS) == [{"_id": "Cursos", "receita": 200.0}, {"_id": "Livros", "receita": 200.0}, {"_id": "Perifericos", "receita": 150.0}]`,
            },
            {
              label: 'Trata documento PAGO sem itens ou coleção vazia sem erro',
              test: `pipeline_receita_categoria([{"_id": "p9", "status": "PAGO"}]) == [] and pipeline_receita_categoria([]) == []`,
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'mdb-q2-n3-indice-esr',
          question:
            'Nível 3 (Performance de Índice ESR): Sua API executa 3.000 vezes por minuto a consulta `db.pedidos.find({ loja_id: "L1", total: { $gte: 100 } }).sort({ criado_em: -1 })`. Seguindo a regra **ESR (Equality → Sort → Range)**, qual índice composto evita ordenação em memória e `COLLSCAN`?',
          options: [
            {
              text: '`{ loja_id: 1, criado_em: -1, total: 1 }`',
              correct: true,
              feedback:
                'Exatamente! `loja_id` é Equality (E), `criado_em` é Sort (S) e `total >= 100` é Range (R). Nessa ordem, o MongoDB já percorre as entradas do índice na ordem final de `criado_em`!',
            },
            {
              text: '`{ total: 1, loja_id: 1, criado_em: -1 }`',
              feedback:
                'Colocar o campo de Range (`total`) primeiro impede que o índice entregue os documentos já ordenados por `criado_em`, forçando um `SORT` custoso em memória.',
            },
            {
              text: 'Três índices separados de um campo só (`loja_id`, `total`, `criado_em`), pois o MongoDB sempre funde todos sem perda.',
              feedback:
                'Index intersection raramente bate um único índice composto ESR e ainda exige ordenação adicional em memória.',
            },
            {
              text: 'Não criar índice algum, porque MongoDB já guarda tudo em JSON na memória RAM.',
              feedback:
                'Sem índice, o MongoDB faz `COLLSCAN` lendo 100% da coleção do disco/cache em `O(n)` a cada requisição!',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'MongoDB armazena documentos BSON flexíveis ideais para esquemas polimórficos e leitura rápida de agregados inteiros, mas exige modelagem intencional orientada aos padrões de acesso.',
    'Aninhe (embedding) dados pequenos sempre lidos juntos; use referências para coleções sem limite (evitando o antipadrão de array ilimitado e o teto de 16 MB).',
    'No Aggregation Pipeline, aplicar `$match` cedo aproveita índices; em índices compostos, a ordem ESR (Equality → Sort → Range) evita ordenação em memória.',
    'Bancos relacionais (ACID/JOINs) e NoSQL (documentos/chave-valor) são complementares na arquitetura real.',
  ],
  cards: [
    {
      id: 'mdb-bson',
      front: 'O que é BSON no MongoDB e como difere de JSON puro?',
      back: 'Binary JSON: representação binária usada internamente pelo MongoDB que é mais rápida de percorrer e suporta tipos extras como `ObjectId`, `Date`, `Decimal128` e binários.',
    },
    {
      id: 'mdb-embedding-vs-ref',
      front: 'Quando escolher Embedding vs. Referência no MongoDB?',
      back: 'Embedding para relações 1:1 ou 1:poucos lidas sempre juntas; Referência para relações 1:muitos ilimitadas ou N:N muito atualizadas.',
    },
    {
      id: 'mdb-unbounded-array',
      front: 'Por que arrays que crescem sem limite dentro de um documento são um antipadrão?',
      back: 'Causam realocações constantes, degradação de I/O e falham ao atingir o limite rígido de 16 MB por documento BSON.',
    },
    {
      id: 'mdb-match-cedo',
      front: 'Por que colocar `$match` no início de um Aggregation Pipeline?',
      back: 'Para descartar documentos irrelevantes logo no começo e permitir que o otimizador utilize índices da coleção.',
    },
    {
      id: 'mdb-regra-esr',
      front: 'O que significa a regra ESR para índices compostos no MongoDB?',
      back: 'Equality (igualdade), Sort (ordenação) e Range (faixas como `$gte`/`$lt`) — ordenar as chaves do índice nessa sequência maximiza a seletividade e evita ordenação em memória.',
    },
    {
      id: 'mdb-schemaless-mito',
      front: 'Por que "schemaless" não dispensa validação de dados?',
      back: 'Porque sem validação (JSON Schema no banco + validação na API), tipos inconsistentes (`"100"` vs `100`) corrompem filtros e agregações silenciosamente.',
    },
  ],
  mission: {
    title: 'Compare SQL e MongoDB no mesmo domínio do seu projeto',
    text: 'Amplie a atividade de aclimatação do MongoDB da disciplina com critérios de engenharia reais.',
    steps: [
      'Escolha um domínio com 2 entidades principais (ex.: Pedidos+Itens ou Academia+Checkins) e modele o mesmo cenário em tabelas SQL e em documentos JSON.',
      'Identifique pelo menos uma relação que você aninharia (embedding) e uma que você separaria por referência, justificando pelo crescimento esperado.',
      'Escreva um Aggregation Pipeline de 3 estágios (`$match`, `$group`, `$sort`) e compare com o `SELECT ... GROUP BY` equivalente.',
      'Proponha o índice composto ideal pela regra ESR para a consulta mais frequente do seu sistema.',
    ],
  },
  sources: [
    {
      title: 'MongoDB Manual — Data Modeling & Embedding vs References',
      url: 'https://www.mongodb.com/docs/manual/data-modeling/',
    },
    {
      title: 'MongoDB Manual — Aggregation Pipeline',
      url: 'https://www.mongodb.com/docs/manual/core/aggregation-pipeline/',
    },
    {
      title: 'MongoDB Manual — The ESR (Equality, Sort, Range) Guideline',
      url: 'https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-guideline/',
    },
  ],
};
