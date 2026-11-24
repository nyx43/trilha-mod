# Frente 1 — Mapa de Cobertura das Matérias 26.2 (`es-26-2`)

**Data de criação:** 2026-11-23  
**Origem auditada:** `/home/joaovt/Área de trabalho/aulas` (6 pastas de disciplinas, **81 arquivos totais**, sendo **2 duplicatas exatas por SHA-256** e **1 pasta vazia**)  
**Trilha / Curso alvo no Trilha Mod:** `es-26-2` — **Engenharia de Software 26.2**

---

## 1. Resumo Executivo e Decisões Editoriais

Cada disciplina foi auditada em texto integral (PDF, PPTX, DOCX, XLSX, TXT, PY e projetos ZIP inspecionados em modo somente leitura, sem execução de artefatos externos). Em vez de apenas resumir os slides originais, as **11 novas aulas** do Trilha Mod foram desenhadas para superar o material bruto da faculdade em cinco frentes:

1. **Aplicação real em produção:** toda aula abre conectando o tema a sistemas reais (buffers de kernel/áudio, ordenação em bancos e Timsort, mensageria RabbitMQ/DLQ, requisitos testáveis em produto real, BSON/índices no MongoDB, JPA/ORM em Spring Boot, paginação/deadlock/ZFS/ext4 em Linux).
2. **Visualizações interativas:** uso sistemático de `flow`, `trace`, `anatomy`, `codeTabs`, `table`, `terms`, `analogy`, `reveal` e `callout` para tornar mecanismos internos visíveis.
3. **Correção e superação de falhas do material bruto:** bugs reais encontrados nos códigos da disciplina (como `48083.py`, que imprime `"Fila Vazia!!"` no caso de fila cheia e ignora o retorno de `vazia()`/`cheia()`) viram estudos de caso práticos de depuração.
4. **Continuidade lógica além do conteúdo incompleto:** como os arquivos de 26.2 ainda não fecham todo o semestre, cada aula possui uma seção explícita de **continuidade** (ex.: Heaps/Árvores Balanceadas/Hash após Quick/Merge Sort; Outbox/Idempotência/Redis após RabbitMQ; BDD/ISO 29148/Kano após SRS; índices compostos/Aggregation/ACID×BASE após aclimatação MongoDB; DTO/JPA/`@Transactional` após `demo1` Spring; escalonamento/paginação/deadlock e journaling/CoW/bit-rot em SO).
5. **Prática progressiva não trivial (`pratica-progressiva`):** cada aula termina com uma seção dedicada de exercícios em 3 níveis progressivos (**Nível 1: Mecanismo/Rastreamento**, **Nível 2: Aplicação/Depuração/Casos de Borda**, **Nível 3: Decisão Arquitetural/Integração**), com laboratórios executáveis em **Python (Pyodide)**, **SQL (SQLite/sql.js)**, **Playground HTML/CSS/React** e **Terminal Linux guiado**.

As 11 aulas de 26.2 têm 445 clipes por voz, em Santa e Dora. O catálogo de narração agora cobre as 89 aulas do Trilha Mod.

---

## 2. Mapa de Cobertura por Disciplina (81 arquivos)

### 2.1 `[26.2] APTA - DIREITOS HUMANOS` — 0 arquivos

| Arquivo / Pasta | Decisão | Destino / Observação |
| --- | --- | --- |
| Pasta vazia (0 arquivos) | **Lacuna registrada** | Registrada explicitamente no estágio *Aprofundamento opcional* da trilha `es-26-2` e neste mapa. Nenhuma aula foi inventada sem ementa ou material de referência; será adicionada assim que os arquivos da disciplina chegarem. |

---

### 2.2 `[26.2] COMPLEXIDADE DE ALGORITMOS E ESTRUTURA DE DADOS` — 20 arquivos

| Arquivos de origem | Conteúdo real auditado | Decisão | Aula(s) no Trilha Mod (`es-26-2`) |
| --- | --- | --- | --- |
| `Aula 01.pdf` (apresentação e ementa), `Complexidade.txt` | Visão da disciplina, motivação de eficiência, introdução à complexidade. | **Reutilizar + Criar** | Reutiliza [`arrays-mapas-e-complexidade`](../src/lessons/content/arraysMapasEComplexidade.ts) + nova [`alg-complexidade-e-ordenacao-simples`](../src/lessons/content/algComplexidadeOrdenacao.ts) |
| `Estrutura de Dados - Estruturas Básicas (1).pdf`, `Fila_Circular (1).xlsx`, `48081.py` (Pilha), `48082.py` (Fila), `48083.py` (Fila Circular — com bug real `"Fila Vazia!!"` no branch de fila cheia), `50687.py` (Menu interativo) | Pilha LIFO, Fila FIFO, desperdício de posições na fila estática, aritmética modular `(fim + 1) % cap` na fila circular, `push`/`pop`/`peek`, `enqueue`/`dequeue`, estados vazio/cheio/wrap-around. | **Criar (Piloto enriquecido)** | [`ed-pilhas-filas-e-fila-circular`](../src/lessons/content/edPilhasFilasCircular.ts) (incorpora piloto C1/C2/C3 de `rascunhos-pilotos-estudo-es.md` + depuração do bug real de `48083.py` + continuidade para deque/ring buffer/backpressure) |
| `Aula 02.pdf`, `Aula 03.pdf`, `Aula 04.pdf`, `45338.py` (Selection Sort), `45339.py` (Insertion Sort), `45340.py` (Bubble Sort) | Contagem de operações, assintótica Big O, Ω e Θ, classes `O(1)` a `O(2ⁿ)`, Selection, Insertion e Bubble Sort, comparações e trocas. | **Criar** | [`alg-complexidade-e-ordenacao-simples`](../src/lessons/content/algComplexidadeOrdenacao.ts) (+ continuidade para estabilidade, busca binária `O(log n)` e Timsort) |
| `Ordenação - MergeSort.pdf`, `Ordenação - QuickSort.pdf`, `Merge_Sort.py`, `Quick_Sort.py`, `Tarefas/Enunciados.txt`, `Tarefas/Comparação entre Merge Sort e Quick Sort.txt` | Dividir e conquistar, recorrência `O(n log n)`, particionamento Hoare (`leftmark`/`rightmark`), pior caso `O(n²)` em vetor ordenado, memória auxiliar `O(n)` vs `O(log n)`, tarefa comparativa Merge × Quick. | **Criar** | [`alg-mergesort-quicksort-e-continuidade`](../src/lessons/content/algMergesortQuicksort.ts) (+ continuidade para pivô mediana-de-três/aleatório, Heaps/Priority Queue, Árvores Balanceadas e Tabelas Hash) |

---

### 2.3 `[26.2] DESENVOLVIMENTO DE SOFTWARES PARA WEB` — 20 arquivos (2 duplicatas exatas)

**Duplicatas exatas verificadas por SHA-256 (descartadas sem perda):**
- `_[V2 - 2026] UGB - Desenvolvimento de Software para WEB (1).pdf` === `_[V2 - 2026] UGB - Desenvolvimento de Software para WEB (1) (1).pdf` (Tailwind CSS — mesmo hash SHA-256).
- `_[V2 - 2026] UGB - Desenvolvimento de Software para WEB.pdf` === `_[V2 - 2026] UGB - Desenvolvimento de Software para WEB (4).pdf` (Mensageria e RabbitMQ — mesmo hash SHA-256).

| Arquivos de origem | Conteúdo real auditado | Decisão | Aula(s) no Trilha Mod (`es-26-2`) |
| --- | --- | --- | --- |
| `Aula 1 - Desenvolvimento de Software para WEB.pdf`, `Aula 2 - ...pdf`, `Aulas 3 e 4 - Desenvolvimento de Software para WEB.pdf`, `ugb-node-api-main.zip` | Fundamentos web, HTTP, API REST, rotas, contratos JSON, persistência em memória vs banco, Node/Express. | **Reutilizar** | [`onde-o-dado-mora`](../src/lessons/content/ondeODadoMora.ts) e [`api-rest-e-contratos`](../src/lessons/content/apiRestEContratos.ts) |
| `_[V2 - 2026] ... (1).pdf` (Tailwind CSS), `Aula 6 - React.pdf`, `conceitos-react.zip`, `Tarefas/Trabalho - ... (2).pdf` (3 exercícios React: Card Perfil, Contador com Limite, Lista de Tarefas) | Tailwind CSS utilitário, JSX, componentes, props, `useState`, listas controladas e eventos. | **Reutilizar** | [`tailwind-na-pratica`](../src/lessons/content/tailwindNaPratica.ts), [`react-jsx-componentes-e-props`](../src/lessons/content/reactJsxComponentesEProps.ts) e [`react-estado-e-eventos`](../src/lessons/content/reactEstadoEEventos.ts) |
| `Aula 5 - Capture the Bug - desafios Django.zip`, `_[V2 - 2026] ... (2).pdf`, `_[V2 - 2026] ... (8).pdf` (Monólito × Microsserviços), `_[V2 - 2026] ... (6).pdf` (Lab React + Django), `catalogo-games-main.zip` | Arquitetura MVT/DRF no Django, integração full-stack React + Django (`catalogo-games`), desafios de depuração (*Capture the Bug*), decisão Monólito Modular vs Microsserviços. | **Criar** | [`web-django-arquitetura-e-depuracao`](../src/lessons/content/webDjangoDepuracao.ts) (+ continuidade para CORS, N+1 ORM, paginação, validação server-side e observabilidade) |
| `_[V2 - 2026] ... .pdf` (RabbitMQ), `UGB-rabbitmq-main.zip` | Comunicação síncrona vs assíncrona, AMQP, Producer → Exchange (Direct/Topic/Fanout) → Queue → Consumer, desacoplamento. | **Criar** | [`web-mensageria-rabbitmq-e-eventos`](../src/lessons/content/webMensageriaRabbitmq.ts) (+ continuidade para ACK/NACK, Dead Letter Queue, idempotência, Transactional Outbox e Redis cache) |

---

### 2.4 `[26.2] ENGENHARIA DE REQUISITOS DE SOFTWARES` — 26 arquivos

| Arquivos de origem | Conteúdo real auditado | Decisão | Aula(s) no Trilha Mod (`es-26-2`) |
| --- | --- | --- | --- |
| `Aula1.pptx`, `Aula2.pptx`, `Aula3.pptx`, `aula1.pdf` a `aula6.pdf`, `aula5.docx`, `aula6.docx`, `aula7.pdf`, `aula8.pdf` (e arquivos de exercícios práticos de *Sistema de Academia*) | Ciclo de vida da Engenharia de Requisitos, stakeholders, técnicas de elicitação (entrevistas, questionários, brainstorming, observação, análise documental), requisitos funcionais (RF), não funcionais (RNF) e restrições, Casos de Uso UML (atores, `<<include>>`, `<<extend>>`), Histórias de Usuário e critérios INVEST. | **Criar (Piloto enriquecido)** | [`req-elicitacao-casos-de-uso-e-invest`](../src/lessons/content/reqElicitacaoInvest.ts) (incorpora piloto 2 de `rascunhos-pilotos-estudo-es.md` sobre requisitos testáveis + caso contínuo Sistema de Academia + continuidade para BDD/Gherkin e revisão crítica de requisitos gerados por IA) |
| `aula9.pdf`, `aula10.pdf`, `aula11.pdf`, `aula12.pdf`, `aula9.pptx` a `aula12.pptx` e documentos de avaliação prática (Academia) | Especificação SRS (IEEE 830), prototipagem (papel, baixa e alta fidelidade), Matriz de Rastreabilidade (forward/backward), Gestão de Mudanças (Change Request, análise de impacto, CCB), Priorização (MoSCoW, 100 Pontos, Modelo de Kano) e negociação de conflitos entre stakeholders. | **Criar** | [`req-especificacao-prototipagem-e-mudancas`](../src/lessons/content/reqEspecificacaoMudancas.ts) (+ continuidade para ISO/IEC/IEEE 29148, ADRs, versionamento de requisitos e validação contínua com protótipo interativo) |

---

### 2.5 `[26.2] GERENCIAMENTO DE BANCO DE DADOS` — 7 arquivos

> **Auditoria importante:** a pasta da disciplina contém duas frentes explícitas: (a) a atividade de **MongoDB** em `Tarefas/Enunciados.txt` e (b) 6 arquivos de **POO em Java e Web Services com Spring Boot** (`Aula - OO [Java].pdf`, `ExerciciosOO.pdf`, `ExerciciosOOClasses.pdf`, `revisaoPOOSpring.pdf`, `DW2-Modulo6-Intro-Web-Services-Spring.pdf` e `demo1.zip` com `SoftwareEngineer` Entity/Repository/Service/Controller). Ambas foram tratadas explicitamente em aulas dedicadas, além da reutilização da base relacional SQL do Trilha Mod.

| Arquivos de origem | Conteúdo real auditado | Decisão | Aula(s) no Trilha Mod (`es-26-2`) |
| --- | --- | --- | --- |
| Base relacional exigida pela disciplina (contraponto SQL × NoSQL e persistência JPA) | Consultas SQL, modelagem relacional, chaves, JOINs, transações, índices e migrações. | **Reutilizar** | [`sql-consultas`](../src/lessons/content/sqlConsultas.ts), [`sql-tabelas-e-relacoes`](../src/lessons/content/sqlTabelasERelacoes.ts) e [`banco-acesso-e-migracoes`](../src/lessons/content/bancoAcessoEMigracoes.ts) |
| `Tarefas/Enunciados.txt` (aclimatação MongoDB: coleções, documentos JSON/BSON, CRUD e consultas) | Modelo orientado a documentos, BSON, `insertOne`/`find`/`updateOne`, projeções, embedding vs referência. | **Criar** | [`bd-mongodb-documentos-e-nosql`](../src/lessons/content/bdMongodbNosql.ts) (+ continuidade para Aggregation Pipeline, índices simples/compostos, consistência ACID × BASE e decisão SQL × NoSQL; prática local explicitamente sinalizada como simulação em memória) |
| `Aula - OO [Java].pdf`, `ExerciciosOO.pdf` (Lâmpada, Livro, ContaCorrente, Aluno), `ExerciciosOOClasses.pdf`, `revisaoPOOSpring.pdf`, `DW2-Modulo6-Intro-Web-Services-Spring.pdf`, `demo1.zip` (`SoftwareEngineer`) | Encapsulamento, construtores, herança/polimorfismo, camadas REST no Spring Boot (`Controller` → `Service` → `Repository` → `Entity`), IoC e Injeção de Dependências. | **Criar** | [`bd-poo-java-spring-e-persistencia`](../src/lessons/content/bdPooJavaSpring.ts) (+ continuidade para Spring Data JPA, mapeamento objeto-relacional, DTO vs Entity, `@Transactional` e problema N+1; prática local em SQLite + simulação orientada a objetos) |

---

### 2.6 `[26.2] SISTEMAS OPERACIONAIS` — 8 arquivos

| Arquivos de origem | Conteúdo real auditado | Decisão | Aula(s) no Trilha Mod (`es-26-2`) |
| --- | --- | --- | --- |
| `Iniciante.pdf` (Guia Foca Linux), `Unix_History.pdf`, `Sistemas Operacionais.txt` | História Unix/Linux, hierarquia de diretórios, permissões, pipes, processos no terminal. | **Reutilizar + Criar** | Reutiliza [`linux-e-terminal`](../src/lessons/content/linuxETerminal.ts) + integra histórico e conceitos nas 2 novas aulas de SO |
| `Sistemas Oeracionais - Aula 2.pdf`, `Aula 3.pdf`, `Aula 4.pdf`, `Aula 5.pdf` | Arquitetura de SO (monolítico, microkernel, camadas, hypervisor), kernel, drivers, boot, chamadas de sistema, processos/PCB, estados, threads, memória virtual/paginação, concorrência e monitores. | **Criar** | [`so-arquitetura-processos-e-memoria`](../src/lessons/content/soArquiteturaProcessosMemoria.ts) (+ continuidade para algoritmos de escalonamento FCFS/SJF/Round-Robin, thrashing/TLB, condição de corrida, mutex, semáforos e deadlock) |
| `Sistemas Oeracionais - Aula 5.pdf` (parte de arquivos), `Tarefas/Enunciados.txt` (Análise Comparativa de Sistemas de Arquivos: **NTFS, ext4, FAT32/exFAT, APFS, Btrfs, ZFS** + referência Nostr) | Organização de arquivos, inodes, diretórios, chamadas de I/O, journaling, Copy-on-Write, snapshots, checksums e comparação técnica dos 6 sistemas de arquivos exigidos na tarefa. | **Criar** | [`so-sistemas-de-arquivos-e-comparacao`](../src/lessons/content/soSistemasArquivos.ts) (+ continuidade para links rígidos vs simbólicos, recuperação após queda de energia, detecção de bit-rot e escolha por carga de trabalho) |

---

## 3. Catálogo Consolidado das 11 Novas Aulas Criadas

| # | ID da Aula | Disciplina 26.2 | Laboratórios Executáveis |
| --- | --- | --- | --- |
| 1 | `ed-pilhas-filas-e-fila-circular` | Complexidade e Estruturas de Dados | Python (3 labs: Pilha/balanceamento, Fila Circular sem bug, Ring Buffer com política de descarte) |
| 2 | `alg-complexidade-e-ordenacao-simples` | Complexidade e Estruturas de Dados | Python (2 labs: Insertion Sort instrumentado + Busca Binária `O(log n)` com contagem de passos) |
| 3 | `alg-mergesort-quicksort-e-continuidade` | Complexidade e Estruturas de Dados | Python (2 labs: Merge Sort com contagem de inversões + Quick Sort com pivô mediana-de-três / Top-K com heap) |
| 4 | `web-django-arquitetura-e-depuracao` | Desenvolvimento de Softwares para Web | Python (lab de filtro/paginação e contrato API estilo Django) + Playground React (Catálogo de Jogos sem reload) |
| 5 | `web-mensageria-rabbitmq-e-eventos` | Desenvolvimento de Softwares para Web | Python (2 labs: roteamento Exchange Direct/Topic + Worker idempotente com retry e DLQ) |
| 6 | `req-elicitacao-casos-de-uso-e-invest` | Engenharia de Requisitos de Softwares | Python (2 labs: auditor de requisitos ambíguos vs testáveis + validador de histórias INVEST/BDD) |
| 7 | `req-especificacao-prototipagem-e-mudancas` | Engenharia de Requisitos de Softwares | Playground HTML/CSS (protótipo de check-in do Sistema de Academia) + Python (matriz de impacto e priorização 100 Pontos/MoSCoW) |
| 8 | `bd-mongodb-documentos-e-nosql` | Gerenciamento de Banco de Dados | SQL (SQLite comparativo relacional) + Python (simulação local de coleção documental e pipeline de agregação) |
| 9 | `bd-poo-java-spring-e-persistencia` | Gerenciamento de Banco de Dados | SQL (schema `software_engineer` + `conta_corrente` com transação) + Python (simulação local de domínio POO + repositório desacoplado) |
| 10 | `so-arquitetura-processos-e-memoria` | Sistemas Operacionais | Terminal Linux (`ps`/`free`/`dmesg`) + Python (escalonador Round-Robin + tradutor de paginação virtual → física) |
| 11 | `so-sistemas-de-arquivos-e-comparacao` | Sistemas Operacionais | Terminal Linux (`df -Th`/`ls -li`/`ln -s`) + Python (motor de decisão NTFS × ext4 × exFAT × APFS × Btrfs × ZFS) |

---

## 4. Critérios de Validação Aplicados

- `npm run check` (TypeScript estrito sem erros).
- `npm run lint` (ESLint sem erros nem avisos).
- `npm run test:run` (todos os testes de currículo, cursos, contrato editorial e **execução real de todas as soluções Python e SQL** via `src/lessons/solutions.test.ts`).
- `npm run narration:export -- --all --audit-catalog` (auditoria de 100% dos blocos das 89 aulas sem gerar MP3s).
- `npm run release:joint` (build conjunto Web `dist/` + APK Android assinado com verificação de paridade offline).
