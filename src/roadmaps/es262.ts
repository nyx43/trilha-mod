import { withAILearning } from './aiLearning';
import { Level } from '../entity/RoadmapModel';
import { career, project, sql, topic } from './curriculum';
import { resources as r } from './resources';

export const data: Level[] = withAILearning(
  [
    {
      id: 'es262.complexidade-e-estruturas-de-dados',
      label: 'Complexidade de Algoritmos e Estruturas de Dados',
      description:
        'Da escolha de estruturas em memória à análise formal de custo: pilhas, filas, fila circular, notação assintótica e ordenação eficiente.',
      items: [
        topic(
          'Arrays, mapas e análise de custo',
          'Compare operações em listas, conjuntos e tabelas hash antes de otimizar. Reconheça quando um laço aninhado esconde custo quadrático.',
          [r.algorithms, r.algorithmsCourse, r.youtubeAkita],
          'Reescreva uma busca aninhada usando conjunto ou dicionário e meça a diferença de tempo com 50 mil registros.',
          'es262.arrays-mapas-complexidade',
        ),
        topic(
          'Pilhas, filas e fila circular',
          'Domine LIFO e FIFO, entenda por que filas estáticas desperdiçam posições e elimine o desperdício com aritmética modular e ring buffers.',
          [r.algorithms, r.python, r.youtubeAlgorithmsCourse],
          'Implemente uma fila circular com capacidade fixa, trate cheio e vazio sem sobrescrever silenciosamente e valide com testes de wrap-around.',
          'es262.pilhas-filas-circular',
        ),
        topic(
          'Notação assintótica e ordenação elementar',
          'Diferencie Big O, Ω e Θ, conte comparações e trocas em Selection, Insertion e Bubble Sort, e entenda estabilidade, busca binária e Timsort.',
          [r.algorithmsCourse, r.algorithms, r.youtubeAkita],
          'Instrumente Selection, Insertion e Bubble Sort em entradas ordenadas, inversas e aleatórias para explicar o comportamento assintótico.',
          'es262.complexidade-ordenacao-simples',
        ),
        topic(
          'Merge Sort, Quick Sort e estruturas avançadas',
          'Aplique dividir e conquistar com recorrência O(n log n), previna o pior caso O(n²) no Quick Sort e dê continuidade para heaps, árvores balanceadas e hash.',
          [r.algorithmsCourse, r.algorithms, r.python],
          'Compare Merge Sort e Quick Sort em vetor quase ordenado e escolha entre heap, árvore balanceada e tabela hash para consultas de produção.',
          'es262.dividir-conquistar-estruturas',
        ),
      ],
    },
    project(
      'Biblioteca de Estruturas e Benchmark Reproduzível',
      'Implemente pilha, fila circular, Insertion, Merge e Quick Sort em um pacote pequeno com testes de borda e relatório de comparações.',
      'Cubra lista vazia, 1 elemento, duplicatas, entrada já ordenada e inversa, wrap-around da fila circular e tabela de custo medido versus teórico.',
      [r.python, r.pytest, r.algorithms],
      'es262.projeto-estruturas-benchmark',
    ),
    {
      id: 'es262.desenvolvimento-web',
      label: 'Desenvolvimento de Softwares para Web',
      description:
        'Do contrato HTTP e UI reativa com React e Tailwind até arquitetura Django full-stack, depuração de bugs reais e mensageria assíncrona com RabbitMQ.',
      items: [
        topic(
          'Arquitetura web, persistência e contratos REST',
          'Conecte onde o dado mora (memória, localStorage, API e banco) aos contratos REST com verbos, status, paginação e validação.',
          [r.http, r.openapi, r.youtubeDeschampsWeb],
          'Documente um recurso REST com códigos 200, 201, 400, 404 e 409 e valide respostas com curl.',
          'es262.web-rest-e-dados',
        ),
        topic(
          'React e Tailwind CSS na prática',
          'Construa interfaces modulares com componentes, props, estado imutável, eventos controlados e estilização utilitária responsiva com Tailwind.',
          [r.react, r.tailwind, r.youtubeRocketseatTailwind],
          'Crie um catálogo interativo com filtro em tempo real, contador com limites e foco acessível por teclado.',
          'es262.web-react-e-tailwind',
        ),
        topic(
          'Django, integração full-stack e depuração',
          'Domine MVT e APIs no Django, integre frontend React sem reload, diagnostique bugs reais (Capture the Bug) e compare monólito modular e microsserviços.',
          [r.django, r.react, r.youtubeFullCycleArchitecture],
          'Isole e corrija falhas de rota, CORS, serialização e consulta N+1 em uma API conectada a uma tela React.',
          'es262.web-django-depuracao',
        ),
        topic(
          'Mensageria assíncrona com RabbitMQ e eventos',
          'Desacople serviços com AMQP: exchanges Direct/Topic/Fanout, filas, ACK/NACK, Dead Letter Queues, consumidores idempotentes e cache.',
          [r.rabbitmq, r.youtubeMichelliMessaging, r.youtubeFullCycleMessaging],
          'Modele um fluxo de pedido com produtor, exchange topic, worker idempotente e fila de mensagens mortas para falhas permanentes.',
          'es262.web-mensageria-rabbitmq',
        ),
      ],
    },
    {
      id: 'es262.engenharia-de-requisitos',
      label: 'Engenharia de Requisitos de Softwares',
      description:
        'Transforme necessidades vagas de stakeholders em requisitos testáveis, casos de uso, histórias INVEST, especificações SRS e mudanças rastreáveis.',
      items: [
        topic(
          'Elicitação, Casos de Uso UML e Histórias INVEST',
          'Conduza entrevistas, observação e análise documental; separe RF, RNF e restrições testáveis; modele Casos de Uso e critérios BDD/INVEST.',
          [r.umlUseCases, r.istqb, r.contribute],
          'Reescreva requisitos ambíguos de um sistema de academia em requisitos verificáveis, histórias INVEST e cenários Dado/Quando/Então.',
          'es262.requisitos-elicitacao-invest',
        ),
        topic(
          'Especificação SRS, Prototipagem e Gestão de Mudanças',
          'Estruture documentos no padrão IEEE 830/29148, valide fluxos com protótipos, mantenha matriz de rastreabilidade e priorize com MoSCoW, 100 Pontos e Kano.',
          [r.umlUseCases, r.istqb, r.git],
          'Avalie uma solicitação de mudança usando matriz de rastreabilidade, negocie conflitos entre áreas e valide o fluxo num protótipo navegável.',
          'es262.requisitos-ieee-prototipagem-mudancas',
        ),
      ],
    },
    project(
      'Sistema de Academia: Requisitos, API e Fluxo Assíncrono',
      'Conecte a especificação de requisitos de uma academia a um backend REST e um fluxo assíncrono de notificações ou cobranças.',
      'Entregue SRS enxuto com matriz de rastreabilidade, protótipo validado, endpoints testados com critérios BDD e tratamento idempotente de eventos.',
      [r.openapi, r.django, r.rabbitmq],
      'es262.projeto-academia-integrado',
    ),
    {
      id: 'es262.gerenciamento-banco-de-dados',
      label: 'Gerenciamento de Banco de Dados',
      description:
        'Combine base relacional sólida em SQL, modelagem documental com MongoDB e arquitetura orientada a objetos com Java, Spring Boot e persistência JPA.',
      items: [
        sql,
        topic(
          'Acesso a dados, transações e migrações',
          'Conecte aplicações ao banco relacional com consultas parametrizadas, repositórios, controle transacional e migrações versionadas.',
          [r.postgres, r.sql, r.security],
          'Evite SQL injection e N+1, aplique uma transação com ROLLBACK em falha e versione o schema com migrações reproduzíveis.',
          'es262.bd-acesso-e-migracoes',
        ),
        topic(
          'MongoDB, documentos BSON e NoSQL',
          'Modele documentos flexíveis, decida entre embedding e referência, escreva filtros e pipelines de agregação, crie índices e compare ACID e BASE.',
          [r.mongodb, r.postgres, r.youtubeBosonModeling],
          'Modele um catálogo em documentos, justifique embedding versus referência e compare a mesma consulta em SQL e agregação documental.',
          'es262.bd-mongodb-nosql',
        ),
        topic(
          'POO em Java, Spring Boot e persistência JPA',
          'Aplique encapsulamento e regras de domínio em Java, organize APIs Spring Boot em Controller/Service/Repository e proteja fronteiras com DTOs e @Transactional.',
          [r.java, r.spring, r.youtubeDevDojo, r.youtubeMichelliSpring],
          'Modele entidades de domínio com invariantes, exponha endpoints REST em camadas e evite vazar entidades JPA diretamente no contrato HTTP.',
          'es262.bd-poo-java-spring-persistencia',
        ),
      ],
    },
    {
      id: 'es262.sistemas-operacionais',
      label: 'Sistemas Operacionais',
      description:
        'Entenda o que acontece abaixo do seu código: Linux no terminal, arquitetura de kernel, processos, escalonamento, memória virtual, concorrência e sistemas de arquivos.',
      items: [
        topic(
          'Linux, terminal e operações do dia a dia',
          'Domine hierarquia de diretórios, permissões, pipes, logs e inspeção de processos no ambiente Unix/Linux.',
          [r.linux, r.bash, r.youtubeLinuxtips, r.youtubeBosonLinux],
          'Inspecione permissões, filtre logs com grep e pipes e localize processos ativos em um terminal Linux.',
          'es262.so-linux-e-terminal',
        ),
        topic(
          'Arquitetura de SO, processos, memória e concorrência',
          'Compare monolítico, microkernel e hypervisor; acompanhe chamadas de sistema, PCB, escalonamento, paginação virtual, mutex, monitores e deadlocks.',
          [r.ostep, r.linux, r.youtubeBosonLinux],
          'Simule escalonamento Round-Robin, traduza endereços virtuais em físicos com tabela de páginas e identifique condições de deadlock.',
          'es262.so-arquitetura-processos-memoria',
        ),
        topic(
          'Sistemas de arquivos e análise comparativa',
          'Entenda inodes, diretórios, journaling e Copy-on-Write; compare tecnicamente NTFS, ext4, FAT32/exFAT, APFS, Btrfs e ZFS por cenário real.',
          [r.ostep, r.linux, r.youtubeLinuxtips],
          'Compare NTFS, ext4, exFAT, APFS, Btrfs e ZFS em limites, snapshots, detecção de corrupção e escolha justificada por carga de trabalho.',
          'es262.so-sistemas-de-arquivos',
        ),
      ],
    },
    project(
      'Laboratório Integrado de Persistência e Diagnóstico de SO',
      'Construa um serviço com persistência relacional ou documental instrumentado com métricas de fila, tempo de resposta e diagnóstico de disco e processos.',
      'Documente a escolha de banco e sistema de arquivos, demonstre recuperação de transação, reproduza gargalos de memória ou I/O e registre evidências.',
      [r.spring, r.mongodb, r.ostep, r.linux],
      'es262.projeto-persistencia-so',
    ),
    career,
    {
      id: 'es262.aprofundamento-opcional',
      label: 'Aprofundamento opcional',
      description:
        'Tópicos complementares e registros de pendências curriculares do semestre 26.2 para evolução contínua.',
      optional: true,
      items: [
        topic(
          'APTA — Direitos Humanos (lacuna registrada)',
          'A pasta [26.2] APTA - DIREITOS HUMANOS está vazia no pacote atual de materiais. Assim que a ementa e as leituras forem disponibilizadas, este bloco receberá aulas dedicadas sobre ética, privacidade, acessibilidade e impacto social na engenharia de software.',
          [r.accessibility, r.contribute],
          'Registre os tópicos da ementa oficial de Direitos Humanos assim que forem publicados e relacione-os a requisitos éticos e de acessibilidade em software.',
          'es262.apta-direitos-humanos-lacuna',
        ),
      ],
    },
  ],
  'es-26-2',
);
