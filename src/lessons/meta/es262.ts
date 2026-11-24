import { LessonMeta } from '../types';

const updatedAt = '2026-11-23';

export const lessons: LessonMeta[] = [
  {
    id: 'ed-pilhas-filas-e-fila-circular',
    title: 'Pilhas, filas e fila circular sem vazamento',
    summary:
      'Domine LIFO, FIFO, aritmética modular (indice + 1) % cap, depuração de bugs reais de fila circular e políticas de backpressure e ring buffer em produção.',
    minutes: 24,
    groupIds: ['es262.pilhas-filas-circular'],
    objectives: [
      'Escolher entre pilha, fila e fila circular (ring buffer) explicando onde cada uma roda em sistemas reais',
      'Evitar a armadilha de `list.pop(0)` em O(n) e usar aritmética modular para operar em O(1)',
      'Distinguir fila vazia de fila cheia sem ambiguidade, limpar referências antigas e testar wrap-around',
      'Decidir entre backpressure explícito e ring buffer sobrescritivo sob sobrecarga',
    ],
    updatedAt,
    load: () => import('../content/edPilhasFilasCircular'),
  },
  {
    id: 'alg-complexidade-e-ordenacao-simples',
    title: 'Notação assintótica e ordenação elementar',
    summary:
      'Diferencie Big O, Ω e Θ, instrumente Selection, Insertion e Bubble Sort, detecte O(n²) oculto em laços e conecte ordenação com busca binária e Timsort.',
    minutes: 24,
    groupIds: ['es262.complexidade-ordenacao-simples'],
    objectives: [
      'Interpretar limites assintóticos Big O, Ω e Θ e identificar operações O(n²) escondidas em laços',
      'Comparar Selection, Insertion e Bubble Sort em comparações, trocas, estabilidade e entradas quase ordenadas',
      'Instrumentar algoritmos de ordenação e busca binária O(log n) provando o comportamento na prática',
      'Explicar por que o Timsort combina Insertion Sort com Merge Sort em bibliotecas reais',
    ],
    updatedAt,
    load: () => import('../content/algComplexidadeOrdenacao'),
  },
  {
    id: 'alg-mergesort-quicksort-e-continuidade',
    title: 'Merge Sort, Quick Sort e estruturas avançadas',
    summary:
      'Entenda dividir e conquistar em O(n log n), blinde o Quick Sort contra o pior caso O(n²) com mediana de três e dê continuidade para Heaps, Árvores Balanceadas e Hash.',
    minutes: 26,
    groupIds: ['es262.dividir-conquistar-estruturas'],
    objectives: [
      'Comparar Merge Sort e Quick Sort em estabilidade, memória auxiliar, localidade de cache e pior caso',
      'Rastrear o particionamento com marcadores convergentes e corrigir o pior caso de pivô fixo',
      'Aplicar Merge Sort para contagem de inversões e Quick Sort de 3 vias para entradas adversariais',
      'Escolher entre External Merge, Heap (Top-K), B-Tree e Tabela Hash em cenários reais',
    ],
    updatedAt,
    load: () => import('../content/algMergesortQuicksort'),
  },
  {
    id: 'web-django-arquitetura-e-depuracao',
    title: 'Django full-stack, Capture the Bug e Monólito vs. Microsserviços',
    summary:
      'Conecte React a APIs Django com validação, paginação e prevenção de N+1/CORS, investigue bugs reais por camada e decida entre monólito modular e microsserviços.',
    minutes: 25,
    groupIds: ['es262.web-django-depuracao'],
    objectives: [
      'Traçar uma requisição do navegador React até o ORM Django e identificar erros de CORS, 400 vs 500 e N+1',
      'Implementar filtro, ordenação, paginação com teto e contratos seguros numa API web',
      'Construir busca e cadastro reativos sem reload em React mantendo atualizações imutáveis',
      'Avaliar trade-offs reais entre monólito modular e microsserviços evitando monólito distribuído',
    ],
    updatedAt,
    load: () => import('../content/webDjangoDepuracao'),
  },
  {
    id: 'web-mensageria-rabbitmq-e-eventos',
    title: 'Mensageria assíncrona com RabbitMQ, DLQ e Idempotência',
    summary:
      'Desacople serviços com AMQP (Exchanges Direct, Fanout e Topic), proteja workers com Manual ACK, Dead Letter Queue e idempotência, e entenda Transactional Outbox.',
    minutes: 24,
    groupIds: ['es262.web-mensageria-rabbitmq'],
    objectives: [
      'Decidir quando usar comunicação síncrona HTTP versus mensageria assíncrona com broker',
      'Configurar e prever roteamento de Exchanges Direct, Fanout e Topic (`*` e `#`) no RabbitMQ',
      'Evitar perda de mensagens, poison messages e duplicidade usando Manual ACK, DLQ e consumidor idempotente',
      'Aplicar o padrão Transactional Outbox para eliminar falhas de dual-write entre banco e fila',
    ],
    updatedAt,
    load: () => import('../content/webMensageriaRabbitmq'),
  },
  {
    id: 'req-elicitacao-casos-de-uso-e-invest',
    title: 'Elicitação, Requisitos Testáveis, Casos de Uso e INVEST/BDD',
    summary:
      'Transforme pedidos vagos em RF/RNF verificáveis, modele Casos de Uso UML (include vs extend), escreva histórias INVEST com BDD e revise saídas de IA criticamente.',
    minutes: 24,
    groupIds: ['es262.requisitos-elicitacao-invest'],
    objectives: [
      'Combinar entrevistas, observação direta, questionários e análise documental na elicitação',
      'Distinguir RF, RNF mensurável e Restrições eliminando termos ambíguos não testáveis',
      'Aplicar corretamente `<<include>>` e `<<extend>>` (e direção das setas) em Casos de Uso UML',
      'Validar Histórias de Usuário pelo critério INVEST com cenários BDD cobrindo caminho feliz e exceções',
    ],
    updatedAt,
    load: () => import('../content/reqElicitacaoInvest'),
  },
  {
    id: 'req-especificacao-prototipagem-e-mudancas',
    title: 'Especificação SRS, Prototipagem, Rastreabilidade e Priorização',
    summary:
      'Estruture SRS no padrão IEEE 830/ISO 29148, valide fluxos com protótipos, estime impactos com Matriz de Rastreabilidade e negocie prioridades com MoSCoW, 100 Pontos e Kano.',
    minutes: 24,
    groupIds: ['es262.requisitos-ieee-prototipagem-mudancas'],
    objectives: [
      'Escolher o nível certo de prototipagem (papel, baixa ou alta fidelidade) para validar regras antes do código',
      'Usar uma Matriz de Rastreabilidade para calcular impacto técnico de Change Requests',
      'Aplicar MoSCoW, Votação dos 100 Pontos e Modelo de Kano para priorizar sob escassez real',
      'Mediar conflitos entre stakeholders e conter scope creep mantendo integridade da entrega',
    ],
    updatedAt,
    load: () => import('../content/reqEspecificacaoMudancas'),
  },
  {
    id: 'bd-mongodb-documentos-e-nosql',
    title: 'MongoDB, Modelagem Documental, Aggregation e SQL vs. NoSQL',
    summary:
      'Decida entre embedding e referência evitando arrays ilimitados, domine Aggregation Pipeline e índices ESR, e compare na prática persistência relacional e documental.',
    minutes: 24,
    groupIds: ['es262.bd-mongodb-nosql'],
    objectives: [
      'Comparar bancos relacionais (PostgreSQL) e documentais (MongoDB) por padrão de acesso, integridade e escala',
      'Escolher entre embedding e referência evitando o antipadrão de arrays sem limite (teto de 16 MB)',
      'Construir pipelines de agregação (`$match`, `$unwind`, `$group`, `$sort`) comparando com SQL equivalente',
      'Projetar índices compostos pela regra ESR (Equality → Sort → Range)',
    ],
    updatedAt,
    load: () => import('../content/bdMongodbNosql'),
  },
  {
    id: 'bd-poo-java-spring-e-persistencia',
    title: 'POO em Java, Spring Boot em Camadas e Persistência JPA',
    summary:
      'Proteja invariantes em classes de domínio, estruture APIs Spring Boot (Controller → Service → Repository) com Injeção de Dependências e evite armadilhas de DTO, @Transactional e JPA.',
    minutes: 25,
    groupIds: ['es262.bd-poo-java-spring-persistencia'],
    objectives: [
      'Diferenciar classes anêmicas de entidades encapsuladas que garantem invariantes de negócio',
      'Organizar serviços REST Spring Boot com Injeção de Dependências por construtor em camadas desacopladas',
      'Separar Request/Response DTOs de entidades JPA para prevenir Mass Assignment e vazamento de dados',
      'Garantir atomicidade em operações multi-escrita com transações e migrações versionadas',
    ],
    updatedAt,
    load: () => import('../content/bdPooJavaSpring'),
  },
  {
    id: 'so-arquitetura-processos-e-memoria',
    title: 'Arquitetura de SO, Processos, Memória Virtual e Concorrência',
    summary:
      'Entenda User/Kernel Mode e syscalls, PCB e threads, escalonamento Round-Robin, paginação virtual e Page Faults, e como prevenir condições de corrida e deadlocks.',
    minutes: 26,
    groupIds: ['es262.so-arquitetura-processos-memoria'],
    objectives: [
      'Comparar arquiteturas monolítica, microkernel e hypervisor e explicar o papel das syscalls',
      'Simular escalonamento Round-Robin analisando o trade-off do quantum e trocas de contexto',
      'Traduzir endereços virtuais em físicos via tabela de páginas e diagnosticar Page Faults e thrashing',
      'Identificar condições de corrida, uso de mutex/monitores e prevenção de deadlock (4 condições de Coffman)',
    ],
    updatedAt,
    load: () => import('../content/soArquiteturaProcessosMemoria'),
  },
  {
    id: 'so-sistemas-de-arquivos-e-comparacao',
    title: 'Sistemas de Arquivos: Inodes, CoW e NTFS × ext4 × exFAT × APFS × Btrfs × ZFS',
    summary:
      'Explore inodes, hard vs. symbolic links, journaling vs. Copy-on-Write e a análise comparativa completa dos 6 sistemas de arquivos exigidos em 26.2.',
    minutes: 24,
    groupIds: ['es262.so-sistemas-de-arquivos'],
    objectives: [
      'Explicar diretórios, inodes, hard links, symlinks e por que `ENOSPC` pode ocorrer com espaço livre',
      'Diferenciar Journaling (ext4/NTFS) de Copy-on-Write com snapshots e checksums (APFS/Btrfs/ZFS)',
      'Comparar tecnicamente NTFS, ext4, FAT32/exFAT, APFS, Btrfs e ZFS em limites, integridade e bit-rot',
      'Selecionar e justificar o sistema de arquivos ideal para servidores, desktops, NAS e mídias portáteis',
    ],
    updatedAt,
    load: () => import('../content/soSistemasArquivos'),
  },
];
