import type { LessonMeta } from '../types';

const updatedAt = '2026-11-24';

export const lessons: LessonMeta[] = [
  {
    id: 'rust-api-de-dados-emprestados',
    title: 'APIs de dados emprestados com Cow',
    summary: 'Escolha quando devolver uma fatia ou um valor próprio e verifique os dois caminhos.',
    minutes: 24,
    groupIds: ['rust.dados-emprestados'],
    objectives: [
      'Distinguir interfaces com retorno emprestado e retorno próprio',
      'Verificar o resultado e a variante de Cow para diferentes entradas',
      'Materializar a posse na fronteira que realmente a exige',
    ],
    updatedAt,
    load: () => import('../content/rustApiDeDadosEmprestados'),
  },
  {
    id: 'rust-contratos-de-biblioteca',
    title: 'Contratos de bibliotecas e compatibilidade',
    summary:
      'Modele falhas, use interfaces para origens distintas e avalie mudanças do ponto de vista de quem chama.',
    minutes: 26,
    groupIds: ['rust.contratos-publicos'],
    objectives: [
      'Separar ausência de falha operacional na assinatura',
      'Selecionar implementações com objetos de trait',
      'Avaliar mudanças públicas com testes de consumidores',
    ],
    updatedAt,
    load: () => import('../content/rustContratosDeBiblioteca'),
  },
  {
    id: 'rust-fronteira-com-c',
    title: 'Interoperabilidade entre Rust e C',
    summary:
      'Defina uma ABI e compile um consumidor C para verificar a fronteira com uma biblioteca Rust.',
    minutes: 27,
    groupIds: ['rust.fronteira-c'],
    objectives: [
      'Explicar a convenção de chamada e o layout compartilhado',
      'Explicitar a unicidade do símbolo exportado pela biblioteca',
      'Verificar a interface a partir de um consumidor C',
    ],
    updatedAt,
    load: () => import('../content/rustFronteiraComC'),
  },
  {
    id: 'rust-pool-assincrono',
    title: 'Processamento assíncrono com limites e drenagem',
    summary: 'Combine uma fila limitada com JoinSet e verifique os resultados no encerramento.',
    minutes: 28,
    groupIds: ['rust.pool-assincrono'],
    objectives: [
      'Limitar a fila e as tarefas iniciadas separadamente',
      'Coletar erros e resultados do processamento',
      'Descrever o comportamento de drenagem e interrupção',
    ],
    updatedAt,
    load: () => import('../content/rustPoolAssincrono'),
  },
  {
    id: 'rust-observabilidade',
    title: 'Observabilidade do importador com tracing',
    summary:
      'Inspecione execuções por ID, contagens e tempo para diagnosticar um lote com rejeições.',
    minutes: 24,
    groupIds: ['rust.observabilidade'],
    objectives: [
      'Relacionar eventos com spans e identificadores',
      'Escolher campos de diagnóstico e excluir o conteúdo da entrada',
      'Conferir as contagens esperadas para um lote sintético',
    ],
    updatedAt,
    load: () => import('../content/rustObservabilidade'),
  },
  {
    id: 'rust-perfil-de-desempenho',
    title: 'Desempenho de buscas e custo de manter um índice',
    summary:
      'Meça construção e consulta separadamente e confirme que as duas versões preservam os resultados.',
    minutes: 26,
    groupIds: ['rust.perfil-desempenho'],
    objectives: [
      'Medir o custo de uma busca linear e outra indexada',
      'Verificar equivalência de conteúdo, ordem e ausências',
      'Justificar a mudança com reuso, repetições e uso de memória',
    ],
    updatedAt,
    load: () => import('../content/rustPerfilDeDesempenho'),
  },
  {
    id: 'rust-idempotencia',
    title: 'Idempotência e recuperação de importações',
    summary: 'Reconheça repetições por chave e confirme a reserva e o efeito na mesma transação.',
    minutes: 28,
    groupIds: ['rust.reprocessamento'],
    objectives: [
      'Distinguir repetição e conflito de operação',
      'Confirmar a chave e a alteração de dados de forma atômica',
      'Verificar o banco depois de uma falha ou repetição',
    ],
    updatedAt,
    load: () => import('../content/rustIdempotencia'),
  },
  {
    id: 'rust-testes-de-api',
    title: 'Testes de contrato HTTP com Axum e Tower',
    summary:
      'Execute requisições contra o roteador em memória e confira a resposta e os efeitos da operação.',
    minutes: 27,
    groupIds: ['rust.teste-de-api'],
    objectives: [
      'Executar requisições HTTP sem abrir uma porta no teste',
      'Verificar o status e as alterações observáveis no estado',
      'Reproduzir uma gravação parcial e provar a regressão',
    ],
    updatedAt,
    load: () => import('../content/rustTestesDeApi'),
  },
  {
    id: 'rust-migracoes-compativeis',
    title: 'Migrações de dados com compatibilidade e volta',
    summary:
      'Simule duas versões do catálogo e verifique uma atualização do SQLite no laboratório da aula.',
    minutes: 28,
    groupIds: ['rust.migracoes-compativeis'],
    objectives: [
      'Verificar o consumidor anterior contra o esquema expandido',
      'Preencher o campo novo com os dados mais recentes',
      'Planejar o corte de leitura e testar a possibilidade de volta',
    ],
    updatedAt,
    load: () => import('../content/rustMigracoesCompativeis'),
  },
  {
    id: 'rust-entrega-de-producao',
    title: 'Projeto final de Rust com aceite e entrega',
    summary:
      'Prepare uma correção reproduzível, automatize a verificação e demonstre os critérios ao cliente.',
    minutes: 32,
    groupIds: ['rust.projeto-entrega'],
    objectives: [
      'Transformar critérios de cliente em testes reproduzíveis',
      'Documentar a verificação automatizada, a versão e os dados usados',
      'Demonstrar a mudança e a volta em um ambiente de teste',
    ],
    updatedAt,
    load: () => import('../content/rustEntregaDeProducao'),
  },
];
