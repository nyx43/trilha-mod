import { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Ordenar 1 milhão de registros em `O(n²)` exige cerca de **500 bilhões** de operações; em `O(n log n)` cai para cerca de **20 milhões** — uma diferença de **25.000 vezes**. Mas escolher errado entre **Merge Sort**, **Quick Sort** e estruturas como **Heaps** ou **Árvores Balanceadas** ainda pode derrubar uma API por explosão de memória ou pior caso `O(n²)` sob ataque.',
  sections: [
    {
      id: 'dividir-e-conquistar-em-producao',
      title: 'Dividir e conquistar: onde Merge Sort e Quick Sort vivem no mundo real',
      blocks: [
        {
          type: 'text',
          text: 'Tanto o Merge Sort quanto o Quick Sort seguem a estratégia **Dividir e Conquistar**: quebram um vetor grande em subproblemas menores, resolvem recursivamente e combinam. A diferença está em **onde o trabalho pesado acontece**: no Merge Sort o trabalho pesado está na **intercalação (merge)** na volta da recursão; no Quick Sort está no **particionamento (partition)** na ida.',
        },
        {
          type: 'table',
          caption: 'Merge Sort vs. Quick Sort — o comparativo de engenharia além dos slides',
          head: [
            'Critério',
            'Merge Sort',
            'Quick Sort (clássico / bom pivô)',
            'Impacto em produção',
          ],
          rows: [
            [
              'Melhor / Médio caso',
              'Θ(n log n)',
              'Θ(n log n)',
              'Quick Sort costuma ter constante menor por excelente uso de cache L1',
            ],
            [
              'Pior caso de tempo',
              'O(n log n) garantido',
              'O(n²) se pivô sempre extremo',
              'Quick Sort ingênuo (pivô = 1º item) trava em entrada já ordenada!',
            ],
            [
              'Memória auxiliar',
              'O(n) para vetor temporário',
              'O(log n) na pilha (ou O(n) no pior caso)',
              'Em sistemas embarcados com RAM apertada, espaço extra O(n) pesa',
            ],
            [
              'Estabilidade',
              'Estável (se usar `<=` no merge)',
              'Instável na versão in-place',
              'Para ordenar tabelas por múltiplas colunas, estabilidade é decisiva',
            ],
            [
              'Onde é usado',
              'Timsort (Python/Java), ordenação externa em disco (PostgreSQL/Spark)',
              'Introsort (`std::sort` C++), ordenação in-memory de primitivos',
              'Bancos de dados usam External Merge Sort quando dados não cabem na RAM',
            ],
          ],
        },
        {
          type: 'analogy',
          title: 'Merge Sort x Quick Sort em uma frase',
          text: '**Merge Sort** corta o baralho exatamente no meio sem olhar as cartas e gasta esforço juntando duas pilhas já ordenadas. **Quick Sort** escolhe uma carta-pivô, joga menores para a esquerda e maiores para a direita — quando termina de dividir, o baralho já está ordenado sem precisar mesclar.',
        },
      ],
    },
    {
      id: 'mecanismo-merge-e-partition',
      title: 'Por dentro do Merge e do Particionamento Hoare (leftmark / rightmark)',
      blocks: [
        {
          type: 'text',
          text: 'Nos arquivos da disciplina (`Merge_Sort.py` e `Quick_Sort.py`), o Quick Sort usa o particionamento com dois marcadores convergentes (`leftmark` avançando da esquerda e `rightmark` recuando da direita) a partir de um pivô no início da fatia. Entender o momento exato em que os marcadores se cruzam evita erros clássicos de loop infinito.',
        },
        {
          type: 'trace',
          caption: 'Rastreamento de uma chamada de partition com pivô = v[0] = 54',
          code: `v = [54, 26, 93, 17, 77, 31]
pivo = v[0]
esq, dir = 1, len(v) - 1
# avança esq até v[esq] > pivo; recua dir até v[dir] < pivo
# troca v[esq] com v[dir] enquanto esq <= dir
# ao cruzar (dir < esq), troca v[0] com v[dir]`,
          steps: [
            {
              line: 3,
              note: 'pivo = 54. esq começa em 1 (26) e dir começa em 5 (31).',
              memory: [
                ['v', '[54, 26, 93, 17, 77, 31]'],
                ['esq / dir', '1 (26) / 5 (31)'],
              ],
            },
            {
              line: 4,
              note: 'esq pula 26 (<=54) e para em 2 (93 > 54). dir já para em 5 (31 < 54). Troca 93 com 31!',
              memory: [
                ['v', '[54, 26, 31, 17, 77, 93]'],
                ['esq / dir', '2 (31) / 5 (93)'],
              ],
            },
            {
              line: 5,
              note: 'esq avança pulando 31 e 17, para em 4 (77 > 54). dir recua pulando 93 e 77, para em 3 (17 < 54). Cruzaram (dir=3 < esq=4)!',
              memory: [
                ['v', '[54, 26, 31, 17, 77, 93]'],
                ['esq / dir', '4 (77) / 3 (17) — cruzou!'],
              ],
            },
            {
              line: 6,
              note: 'Troca o pivô v[0]=54 com v[dir]=17. Agora 54 está na sua posição final (índice 3): tudo à esquerda <= 54 e à direita >= 54!',
              memory: [
                ['v', '[17, 26, 31, 54, 77, 93]'],
                ['posição final pivô', 'índice 3'],
              ],
            },
          ],
        },
        {
          type: 'anatomy',
          caption: 'O detalhe de 1 caractere que preserva a estabilidade no Merge Sort',
          language: 'python',
          parts: [
            { text: 'if esquerda[i] ' },
            {
              text: '<=',
              label: 'Menor OU igual (estabilidade)',
              note: 'Usar `<=` garante que, em caso de empate, o elemento que já estava na metade esquerda entra primeiro no resultado, preservando a ordem original.',
            },
            { text: ' direita[j]:\n    saida.append(esquerda[i]); i += 1' },
          ],
        },
        {
          type: 'quiz',
          activityId: 'mq-q1-pior-caso-quicksort',
          question:
            'No `Quick_Sort.py` da disciplina, o pivô escolhido é sempre `alist[first]` (o primeiro elemento da fatia). O que acontece se você rodar esse código sobre um vetor de 20.000 IDs **já ordenados**?',
          options: [
            {
              text: 'Cada partição separa 0 elementos de um lado e `n - 1` do outro: o tempo degrada para `O(n²)` e a profundidade da recursão atinge `n`, podendo estourar a pilha (`RecursionError`).',
              correct: true,
              feedback:
                'Exato! Com pivô sempre mínimo ou máximo, a árvore de recursão deixa de ter altura `log₂ n` (~15) e vira uma escada de altura `n` (20.000), causando tanto lentidão quadrática quanto estouro da call stack.',
            },
            {
              text: 'Roda ainda mais rápido, em `O(n)`, porque não precisa fazer trocas.',
              feedback:
                'Esse é o comportamento do Insertion Sort, NÃO do Quick Sort com pivô fixo no início! Para Quick Sort ingênuo, entrada ordenada é justamente o pior caso.',
            },
            {
              text: 'Mantém `O(n log n)` porque o particionamento sempre divide o vetor ao meio.',
              feedback:
                'Só divide ao meio quando o pivô está próximo da mediana. Quando o pivô é o menor elemento, uma metade fica vazia e a outra fica com n - 1 itens.',
            },
            {
              text: 'Aloca `O(n)` de memória auxiliar exatamente como o Merge Sort.',
              feedback:
                'O problema não é vetor temporário de intercalação, e sim a pilha de chamadas recursivas atingindo profundidade O(n).',
            },
          ],
        },
      ],
    },
    {
      id: 'armadilhas-pivo-e-introsort',
      title: 'Como a indústria blindou o Quick Sort: Mediana de Três, Aleatorização e Introsort',
      blocks: [
        {
          type: 'text',
          text: 'Se Quick Sort ingênuo tem pior caso `O(n²)` em entradas ordenadas ou adversariais (um atacante pode enviar uma requisição HTTP crafted para travar sua CPU — ataque *Algorithmic Complexity DoS*), por que C++ e Rust usam derivados dele? Porque aplicam três defesas diretas:',
        },
        {
          type: 'steps',
          items: [
            {
              title: '1. Escolha inteligente de pivô (Mediana de Três ou Aleatório)',
              text: 'Em vez de pegar `v[first]`, calcula-se a mediana entre `v[inicio]`, `v[meio]` e `v[fim]` (ou sorteia-se um índice aleatório). Isso elimina imediatamente o pior caso em entradas ordenadas ou reversas.',
            },
            {
              title: '2. Particionamento de 3 vias (Dutch National Flag) para muitas duplicatas',
              text: 'Se 90% dos itens forem iguais (ex.: coluna `status = "ATIVO"`), separar em `< pivô`, `== pivô` e `> pivô` impede recursões inúteis sobre elementos idênticos, caindo para `O(n)` quando todos são iguais.',
            },
            {
              title: '3. Hibridização (Introsort = Quick + Heap + Insertion)',
              text: 'Se a profundidade da recursão ultrapassar `2 * log₂(n)`, o algoritmo alterna automaticamente para **Heap Sort** (garantindo pior caso `O(n log n)` em espaço `O(1)`). Para fatias menores que ~16 itens, finaliza com **Insertion Sort**.',
            },
          ],
        },
      ],
    },
    {
      id: 'continuidade-heaps-arvores-hash',
      title: 'Continuidade do semestre: Heaps, Árvores Balanceadas e Tabelas Hash',
      blocks: [
        {
          type: 'text',
          text: 'O pacote atual de 26.2 termina em Merge Sort e Quick Sort, mas a disciplina completa de Estruturas de Dados e Algoritmos fecha o ciclo com **três estruturas não-lineares** que respondem a perguntas que vetores ordenados não resolvem bem quando os dados mudam o tempo todo:',
        },
        {
          type: 'table',
          caption: 'Qual estrutura escolher depois de dominar ordenação?',
          head: ['Estrutura', 'Operação estrela', 'Complexidade', 'Onde roda no mundo real'],
          rows: [
            [
              'Heap / Fila de Prioridade (`heapq`)',
              'Inserir item e extrair sempre o menor/maior sem reordenar tudo',
              'Inserir/Remover `O(log n)`, ver topo `O(1)`',
              'Escalonadores de tarefas por prioridade, Top-K em streams, algoritmo de Dijkstra (GPS/rotas)',
            ],
            [
              'Árvore Balanceada (AVL, Red-Black, B-Tree)',
              'Manter dados ordenados com inserção, remoção e busca por faixa',
              'Busca, inserção e remoção `O(log n)` garantido',
              'Índices de PostgreSQL/MySQL/SQLite (B+Tree), `TreeMap` do Java, escalonador CFS do Linux',
            ],
            [
              'Tabela Hash (`dict`, `set`)',
              'Busca exata por chave (tratando colisões com encadeamento ou open addressing)',
              '`O(1)` amortizado (pior caso `O(n)` com colisões ruins)',
              'Cache Redis, sessões, deduplicação, índices hash, contagem de frequência',
            ],
          ],
        },
        {
          type: 'classify',
          activityId: 'mq-c1-escolha-estrutura',
          prompt: 'Escolha o algoritmo ou estrutura mais adequado para cada requisito de produção:',
          buckets: [
            'Merge Sort / External Merge',
            'Heap / Fila de Prioridade',
            'Árvore Balanceada (B-Tree / Red-Black)',
            'Tabela Hash (dict / set)',
          ],
          items: [
            {
              text: 'Ordenar um arquivo de 40 GB de logs que não cabe nos 8 GB de RAM da máquina',
              bucket: 0,
            },
            {
              text: 'Manter continuamente os 10 produtos mais vendidos em tempo real num fluxo de milhões de compras',
              bucket: 1,
            },
            {
              text: 'Indexar datas de transações para responder `WHERE data BETWEEN ...` com inserções contínuas',
              bucket: 2,
            },
            {
              text: 'Verificar instantaneamente se um token de requisição já foi processado (idempotência por chave exata)',
              bucket: 3,
            },
            {
              text: 'Ordenar uma tabela de clientes por cidade mantendo a ordem prévia de cadastro em caso de empate',
              bucket: 0,
            },
            {
              text: 'Escolher sempre o próximo paciente de maior gravidade em uma fila dinâmica de pronto-socorro',
              bucket: 1,
            },
          ],
          explanation:
            'External Merge ordena volumes maiores que a RAM e é estável; Heap resolve Top-K e filas de prioridade em O(log n); B-Tree suporta faixas com dados dinâmicos; Hash entrega O(1) para chave exata.',
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: inversões no Merge Sort, Quick Sort seguro e Top-K com Heap',
      blocks: [
        {
          type: 'text',
          text: 'Estes laboratórios conectam diretamente o conteúdo de 26.2 com problemas clássicos de entrevistas e sistemas reais: conte inversões usando Merge Sort (**Nível 1**), blinde o Quick Sort contra entrada ordenada (**Nível 2**) e resolva um problema real de Top-K sem ordenar a coleção inteira (**Nível 3**).',
        },
        {
          type: 'python',
          activityId: 'mq-py-n1-merge-inversoes',
          title: 'Nível 1 — Merge Sort que também mede quão desordenada estava a lista (inversões)',
          task: 'Implemente `merge_sort_inversoes(lista)` retornando `(ordenada, inversoes)` em `O(n log n)`. Uma **inversão** é um par `(i, j)` com `i < j` e `lista[i] > lista[j]`. Dica: sempre que no merge um item de `direita[j]` for estritamente menor que `esquerda[i]`, ele forma inversão com **todos** os elementos restantes de `esquerda` (`len(esquerda) - i`).',
          code: `def merge_sort_inversoes(lista: list[int]) -> tuple[list[int], int]:
    # TODO: dividir ao meio, resolver recursivamente e somar inversões no merge
    return list(lista), 0

print(merge_sort_inversoes([2, 4, 1, 3, 5]))
`,
          solution: `def merge_sort_inversoes(lista: list[int]) -> tuple[list[int], int]:
    if len(lista) <= 1:
        return list(lista), 0
    meio = len(lista) // 2
    esq, inv_e = merge_sort_inversoes(lista[:meio])
    dir_, inv_d = merge_sort_inversoes(lista[meio:])
    i = j = 0
    saida = []
    inv = inv_e + inv_d
    while i < len(esq) and j < len(dir_):
        if esq[i] <= dir_[j]:
            saida.append(esq[i])
            i += 1
        else:
            saida.append(dir_[j])
            inv += len(esq) - i
            j += 1
    saida.extend(esq[i:])
    saida.extend(dir_[j:])
    return saida, inv

print(merge_sort_inversoes([2, 4, 1, 3, 5]))
`,
          checks: [
            {
              label: 'Ordena e conta exatamente 3 inversões em [2, 4, 1, 3, 5]',
              test: `merge_sort_inversoes([2, 4, 1, 3, 5]) == ([1, 2, 3, 4, 5], 3)`,
            },
            {
              label: 'Conta 0 inversões em lista ordenada e 10 em [5, 4, 3, 2, 1]',
              test: `merge_sort_inversoes([1, 2, 3, 4]) == ([1, 2, 3, 4], 0) and merge_sort_inversoes([5, 4, 3, 2, 1]) == ([1, 2, 3, 4, 5], 10)`,
            },
            {
              label: 'Trata corretamente duplicatas sem contar empates como inversão',
              test: `merge_sort_inversoes([3, 3, 1, 3]) == ([1, 3, 3, 3], 2)`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'mq-py-n2-quicksort-3vias',
          title: 'Nível 2 — Quick Sort blindado (mediana de três + partição em 3 vias)',
          task: 'Implemente `quicksort_seguro(lista)` que escolhe como pivô a **mediana entre o primeiro, o do meio e o último elemento** e particiona em três listas (`menores`, `iguais`, `maiores`). Ele deve ordenar sem travar tanto uma lista já ordenada de 3.000 itens quanto uma lista com 3.000 valores repetidos!',
          code: `def quicksort_seguro(lista: list[int]) -> list[int]:
    # TODO: caso-base, mediana de 3 como pivô, partição 3 vias (<, ==, >)
    return list(lista)

print(quicksort_seguro([9, 3, 7, 3, 1, 3, 8]))
`,
          solution: `def quicksort_seguro(lista: list[int]) -> list[int]:
    if len(lista) <= 1:
        return list(lista)
    a, b, c = lista[0], lista[len(lista) // 2], lista[-1]
    pivo = sorted([a, b, c])[1]
    menores = [x for x in lista if x < pivo]
    iguais = [x for x in lista if x == pivo]
    maiores = [x for x in lista if x > pivo]
    return quicksort_seguro(menores) + iguais + quicksort_seguro(maiores)

print(quicksort_seguro([9, 3, 7, 3, 1, 3, 8]))
`,
          checks: [
            {
              label: 'Ordena corretamente lista com duplicatas e negativos',
              test: `quicksort_seguro([9, -2, 3, 7, 3, 1, 3, 8]) == [-2, 1, 3, 3, 3, 7, 8, 9]`,
            },
            {
              label: 'Não estoura recursão nem fica quadrático em lista já ordenada de 3.000 itens',
              test: `quicksort_seguro(list(range(3000))) == list(range(3000))`,
            },
            {
              label: 'Lida em O(n) com 3.000 elementos idênticos sem estourar recursão',
              test: `quicksort_seguro([7] * 3000) == [7] * 3000`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'mq-py-n3-topk-heap',
          title: 'Nível 3 — Continuidade: Top-K alertas críticos em O(n log k) com Min-Heap',
          task: 'Você recebe um fluxo de eventos `(nome, severidade)` e precisa retornar os `k` eventos de **maior severidade** (ordenados da maior para a menor, empatando por nome crescente), usando `heapq` para manter apenas `k` itens na memória em vez de ordenar tudo com `sorted()` na entrada inteira.',
          code: `import heapq

def top_k_criticos(eventos: list[tuple[str, int]], k: int) -> list[tuple[str, int]]:
    # TODO: use um min-heap de tamanho máximo k com heapq
    return []

amostra = [("db-timeout", 90), ("cache-miss", 20), ("oom-kill", 99), ("disk-80", 75), ("auth-err", 90)]
print(top_k_criticos(amostra, 3))
`,
          solution: `import heapq

def top_k_criticos(eventos: list[tuple[str, int]], k: int) -> list[tuple[str, int]]:
    if k <= 0:
        return []
    heap = []
    for nome, sev in eventos:
        item = (sev, nome)
        if len(heap) < k:
            heapq.heappush(heap, item)
        elif sev > heap[0][0] or (sev == heap[0][0] and nome < heap[0][1]):
            heapq.heapreplace(heap, item)
    return [(nome, sev) for sev, nome in sorted(heap, key=lambda x: (-x[0], x[1]))]

amostra = [("db-timeout", 90), ("cache-miss", 20), ("oom-kill", 99), ("disk-80", 75), ("auth-err", 90)]
print(top_k_criticos(amostra, 3))
`,
          checks: [
            {
              label: 'Retorna os 3 eventos mais críticos com desempate alfabético',
              test: `top_k_criticos([("db-timeout", 90), ("cache-miss", 20), ("oom-kill", 99), ("disk-80", 75), ("auth-err", 90)], 3) == [("oom-kill", 99), ("auth-err", 90), ("db-timeout", 90)]`,
            },
            {
              label: 'Trata k == 0 e k maior que o número de eventos',
              test: `top_k_criticos([("a", 5)], 0) == [] and top_k_criticos([("b", 2), ("a", 8)], 5) == [("a", 8), ("b", 2)]`,
            },
            {
              label: 'Utiliza o módulo heapq na implementação',
              test: `'heapq' in __codigo__ and ('heappush' in __codigo__ or 'nlargest' in __codigo__)`,
            },
          ],
        },
        {
          type: 'order',
          activityId: 'mq-ord-external-merge',
          prompt:
            'Ordene as etapas do External Merge Sort usado por bancos de dados quando um conjunto de 50 GB precisa ser ordenado em uma máquina com 4 GB de RAM:',
          items: [
            'Ler o arquivo em blocos (chunks) que caibam confortavelmente na RAM disponível',
            'Ordenar cada bloco em memória com um algoritmo O(n log n) rápido',
            'Gravar cada bloco ordenado como um arquivo temporário (run) em disco',
            'Abrir ponteiros simultâneos para o primeiro registro de cada run usando um min-heap',
            'Intercalar continuamente o menor elemento do heap para o arquivo final ordenado em disco',
          ],
          explanation:
            'Esse é o algoritmo real por trás do `ORDER BY` em discos grandes: ordena runs na RAM e faz k-way merge com min-heap para nunca estourar a memória.',
        },
      ],
    },
  ],
  recap: [
    'Merge Sort garante Θ(n log n) em todos os casos e é estável (com `<=`), mas exige O(n) de memória auxiliar.',
    'Quick Sort é rápido em memória pela localidade de cache, mas escolher pivô fixo degrada para O(n²) em entradas ordenadas.',
    'Mediana de três, particionamento de 3 vias e Introsort blindam o Quick Sort contra entradas adversariais e duplicatas.',
    'Heaps (Top-K e prioridades), Árvores Balanceadas (faixas ordenadas dinâmicas) e Tabelas Hash (chave exata O(1)) completam o arsenal de estruturas de dados.',
  ],
  cards: [
    {
      id: 'mq-diferenca-trabalho',
      front: 'Onde está o trabalho principal do Merge Sort comparado ao Quick Sort?',
      back: 'No Merge Sort o trabalho pesado é na volta da recursão (intercalar duas metades ordenadas); no Quick Sort é na ida (particionar em torno do pivô).',
    },
    {
      id: 'mq-pior-caso-quick',
      front:
        'Quando o Quick Sort com pivô no primeiro elemento vira O(n²) e pode dar stack overflow?',
      back: 'Quando o vetor já está ordenado ou inversamente ordenado: cada partição separa 0 de um lado e n-1 do outro, criando profundidade n.',
    },
    {
      id: 'mq-estabilidade-merge',
      front: 'Qual condição exata mantém o Merge Sort estável?',
      back: 'Usar `esquerda[i] <= direita[j]` (menor OU igual) para priorizar o elemento da metade esquerda em empates.',
    },
    {
      id: 'mq-introsort',
      front: 'O que é Introsort e por que bibliotecas como C++ `std::sort` o usam?',
      back: 'É um híbrido que começa com Quick Sort, cai para Heap Sort se a recursão passar de `2 log₂ n` (evitando O(n²)) e usa Insertion Sort em subvetores pequenos.',
    },
    {
      id: 'mq-external-merge',
      front: 'Como ordenar 100 GB de dados com apenas 4 GB de RAM?',
      back: 'Com External Merge Sort: ordena blocos que cabem na RAM, salva runs temporários em disco e faz intercalação k-way com um min-heap.',
    },
    {
      id: 'mq-heap-vs-btree-vs-hash',
      front: 'Quando escolher Heap, B-Tree ou Hash em sistemas reais?',
      back: 'Heap para máximo/mínimo contínuo e Top-K; B-Tree para buscas por faixa com dados mutáveis ordenados; Hash para lookup exato em O(1).',
    },
  ],
  mission: {
    title: 'Escreva um relatório técnico comparando Merge Sort e Quick Sort',
    text: 'Refaça e eleve a tarefa comparativa da disciplina com evidência medida em vez de apenas texto teórico.',
    steps: [
      'Execute `Merge_Sort` e `Quick_Sort` (versão ingênua vs. mediana de três) em listas de 5.000 itens: aleatória, ordenada e com 90% de valores repetidos.',
      'Registre tempo, número de comparações e se houve `RecursionError` na versão ingênua.',
      'Explique em um parágrafo por que bancos de dados relacionais usam External Merge Sort e B+Tree em vez de Quick Sort puro em disco.',
      'Anexe um pequeno teste de regressão que falha se a estabilidade do seu Merge Sort for quebrada.',
    ],
  },
  sources: [
    {
      title: 'MIT OpenCourseWare 6.006 — Merge Sort, Heaps e Balanced Trees',
      url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/',
    },
    {
      title: 'Python Docs — heapq (Heap queue algorithm)',
      url: 'https://docs.python.org/pt-br/3/library/heapq.html',
    },
    {
      title: 'PostgreSQL Docs — External Sorting e Work Memory',
      url: 'https://www.postgresql.org/docs/current/runtime-config-resource.html',
    },
  ],
};
