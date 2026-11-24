import { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Um código que roda em 15 milissegundos no seu notebook com 200 registros de teste pode travar o servidor por **38 segundos** quando a base chega a 100 mil clientes. Entender **notação assintótica (Big O, Ω e Θ)** e o custo real dos algoritmos de ordenação elementar é a habilidade que evita colocar bombas quadráticas em produção.',
  sections: [
    {
      id: 'por-que-medir-crescimento',
      title: 'Por que segundos enganam — e a taxa de crescimento não',
      blocks: [
        {
          type: 'text',
          text: 'Medir apenas tempo de relógio depende da CPU, da carga do sistema e da linguagem. A análise assintótica mede **como o número de operações básicas cresce quando o tamanho da entrada `n` aumenta**. Em engenharia real, ela responde antes do deploy: "se meus usuários multiplicarem por 10x, o sistema vai escalar 10x ou 100x?"',
        },
        {
          type: 'complexity',
          items: [
            {
              id: '1',
              name: 'Constante',
              text: 'O tempo não depende do tamanho da entrada. Acesso por índice em vetor ou busca em tabela hash bem dimensionada.',
              example: 'Acessar `lista[42]` ou `cache[chave]`',
              code: 'return dados[indice]',
            },
            {
              id: 'log n',
              name: 'Logarítmica',
              text: 'Descarta metade do espaço de busca a cada passo. Com 1 milhão de itens ordenados, faz no máximo 20 comparações.',
              example: 'Busca binária e índices B-Tree em bancos SQL',
              code: 'meio = (esq + dir) // 2',
            },
            {
              id: 'n',
              name: 'Linear',
              text: 'Visita cada elemento um número constante de vezes. Dobrou `n`, dobrou o trabalho.',
              example: 'Varredura completa (full table scan) ou soma de vendas',
              code: 'for x in vendas: total += x',
            },
            {
              id: 'n log n',
              name: 'Linearítmica',
              text: 'Padrão ouro para ordenação por comparação: divide o problema e combina resultados.',
              example: 'Merge Sort, Timsort (`sorted()` do Python) e ordenação em bancos',
              code: 'ordenado = sorted(registros)',
            },
            {
              id: 'n²',
              name: 'Quadrática',
              text: 'Laços aninhados sobre a mesma coleção. Multiplicar `n` por 10 multiplica o tempo por **100**.',
              example: 'Bubble, Selection e Insertion Sort no pior caso; comparar todos os pares',
              code: 'for i in range(n):\n    for j in range(i + 1, n): ...',
            },
            {
              id: '2ⁿ',
              name: 'Exponencial',
              text: 'Cada novo item dobra o trabalho. Inviável mesmo para `n = 40` sem poda ou programação dinâmica.',
              example: 'Força bruta em subconjuntos ou Fibonacci recursivo sem memoização',
              code: 'return fib(n - 1) + fib(n - 2)',
            },
          ],
        },
        {
          type: 'terms',
          items: [
            {
              term: 'Big O — O(f(n))',
              text: 'Limite assintótico **superior** (teto de crescimento). Garante que o algoritmo nunca cresce mais rápido que `f(n)` para entradas grandes — usado para garantir SLAs de pior caso.',
            },
            {
              term: 'Big Ômega — Ω(f(n))',
              text: 'Limite assintótico **inferior** (piso). Indica o mínimo de trabalho inevitável — por exemplo, toda ordenação por comparação precisa de pelo menos `Ω(n log n)` comparações no pior caso.',
            },
            {
              term: 'Big Teta — Θ(f(n))',
              text: 'Limite **exato** (quando o algoritmo é simultaneamente `O(f(n))` e `Ω(f(n))`). Selection Sort, por exemplo, faz sempre `n(n-1)/2` comparações, logo é `Θ(n²)` em qualquer entrada.',
            },
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Por que ignoramos constantes e termos menores — e quando eles importam',
          text: 'Para `T(n) = 3n² + 20n + 50`, quando `n = 10.000`, `3n² = 300.000.000` domina completamente `20n = 200.000`, então dizemos `O(n²)`. **Mas atenção na prática:** para `n` pequeno (ex.: 16 a 64 elementos), constantes e localidade de cache L1 fazem o Insertion Sort superar o Merge Sort! É por isso que bibliotecas reais usam algoritmos híbridos.',
        },
      ],
    },
    {
      id: 'ordenacao-elementar-por-dentro',
      title: 'Selection, Insertion e Bubble Sort: o que realmente acontece na memória',
      blocks: [
        {
          type: 'text',
          text: 'Nos códigos da disciplina (`45338.py`, `45339.py`, `45340.py`), os três algoritmos elementares compartilham pior caso `O(n²)`, mas têm perfis operacionais **muito diferentes** em comparações, trocas, estabilidade e comportamento em entradas quase ordenadas.',
        },
        {
          type: 'table',
          caption: 'Comparação técnica real dos três algoritmos elementares',
          head: [
            'Algoritmo',
            'Melhor caso',
            'Pior caso',
            'Trocas no pior caso',
            'Estável?',
            'Quando brilha',
          ],
          rows: [
            [
              'Selection Sort',
              'Ω(n²)',
              'O(n²)',
              'No máximo n - 1 trocas',
              'Não (versão padrão por troca)',
              'Quando escrever na memória é muito caro (ex.: memória Flash com desgaste)',
            ],
            [
              'Insertion Sort',
              'Ω(n)',
              'O(n²)',
              'O(n²) deslocamentos',
              'Sim',
              'Vetores pequenos (< 64 itens) ou quase ordenados (usado dentro do Timsort!)',
            ],
            [
              'Bubble Sort (com flag)',
              'Ω(n)',
              'O(n²)',
              'O(n²) trocas adjacentes',
              'Sim',
              'Didática; quase nunca usado em produção por excesso de escritas em memória',
            ],
          ],
        },
        {
          type: 'trace',
          caption: 'Insertion Sort em ação: como ele mantém o prefixo ordenado e para cedo',
          code: `v = [7, 3, 5, 2]
for i in range(1, len(v)):
    chave = v[i]
    j = i - 1
    while j >= 0 and v[j] > chave:
        v[j + 1] = v[j]
        j -= 1
    v[j + 1] = chave`,
          steps: [
            {
              line: 3,
              note: 'i = 1: pega chave = 3. Como 7 > 3, desloca 7 para direita e insere 3 no índice 0.',
              memory: [
                ['i / chave', '1 / 3'],
                ['v', '[3, 7, 5, 2]'],
              ],
            },
            {
              line: 3,
              note: 'i = 2: pega chave = 5. Desloca apenas 7; quando compara com 3 (3 > 5 é falso), o laço para imediatamente!',
              memory: [
                ['i / chave', '2 / 5'],
                ['v', '[3, 5, 7, 2]'],
              ],
            },
            {
              line: 8,
              note: 'i = 3: chave = 2 é menor que todos; desloca 7, 5 e 3 e grava 2 no início — exemplo de pior caso local.',
              memory: [
                ['i / chave', '3 / 2'],
                ['v', '[2, 3, 5, 7]'],
              ],
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'alg-q1-estabilidade-melhor-caso',
          question:
            'Você recebe uma lista de 50.000 eventos de log que chegam **quase ordenados por timestamp** (no máximo 2 eventos fora do lugar por segundo). Entre os três elementares, por que o Insertion Sort vence com folga o Selection Sort nesse cenário?',
          options: [
            {
              text: 'Porque o Insertion Sort interrompe o laço interno assim que encontra um elemento menor ou igual à chave, rodando em `O(n)` quase linear, enquanto o Selection Sort varre todo o sufixo sempre em `Θ(n²)`.',
              correct: true,
              feedback:
                'Exatamente! O Selection Sort não tem "saída antecipada": mesmo numa lista 100% ordenada, ele executa `n(n-1)/2` comparações. Já o Insertion Sort faz cerca de `n` comparações quando há poucas inversões.',
            },
            {
              text: 'Porque o Insertion Sort é sempre `O(n log n)` em qualquer entrada.',
              feedback:
                'Não: no pior caso (lista invertida), o Insertion Sort ainda é `O(n²)`. Ele só vira `O(n)` em listas ordenadas ou quase ordenadas.',
            },
            {
              text: 'Porque o Selection Sort exige memória auxiliar `O(n)` enquanto o Insertion Sort é in-place.',
              feedback:
                'Ambos são in-place (`O(1)` de espaço extra). A diferença decisiva aqui é a adaptabilidade do Insertion Sort ao número de inversões.',
            },
            {
              text: 'Porque o Bubble Sort sem flag faz menos trocas que o Insertion Sort.',
              feedback:
                'O Bubble Sort faz muito mais escritas (troca completa de 3 atribuições por inversão), e sem flag nem aproveita a lista ordenada.',
            },
          ],
        },
      ],
    },
    {
      id: 'armadilhas-estabilidade-e-operacoes-ocultas',
      title: 'Armadilhas invisíveis: estabilidade e custo oculto dentro de laços',
      blocks: [
        {
          type: 'text',
          text: 'Na prática, engenheiros raramente erram Big O por não saber a definição — erram porque esquecem **estabilidade** ou escondem uma operação `O(n)` dentro de um laço `for` (como `in lista`, `lista.remove()` ou concatenação repetida de strings).',
        },
        {
          type: 'codeTabs',
          caption: 'Estabilidade na prática: ordenar por departamento e depois por salário',
          tabs: [
            {
              label: 'Por que estabilidade importa',
              language: 'python',
              code: `# Lista já ordenada alfabeticamente por nome:
equipe = [
    {"nome": "Ana", "setor": "Dados"},
    {"nome": "Bruno", "setor": "Web"},
    {"nome": "Carla", "setor": "Dados"},
]
# Um sort ESTÁVEL por setor garante Ana antes de Carla dentro de "Dados".
# Um sort INSTÁVEL (como Selection Sort clássico) pode inverter para Carla, Ana!
ordenado = sorted(equipe, key=lambda p: p["setor"])`,
            },
            {
              label: 'O(n²) escondido em 1 linha',
              language: 'python',
              code: `# RUIM: "x in vistos" em LISTA é O(n) -> laço vira O(n²)!
def duplicados_lento(itens):
    vistos = []
    return [x for x in itens if x in vistos or vistos.append(x)]

# BOM: busca em SET é O(1) médio -> função inteira vira O(n)!
def deduplicar_rapido(itens):
    vistos = set()
    saida = []
    for x in itens:
        if x not in vistos:
            vistos.add(x)
            saida.append(x)
    return saida`,
            },
          ],
        },
        {
          type: 'classify',
          activityId: 'alg-c1-complexidade-real',
          prompt:
            'Classifique cada trecho de código pela sua complexidade real de **pior caso** em tempo:',
          buckets: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
          items: [
            {
              text: 'Verificar se uma chave existe em um `dict` bem distribuído (`chave in mapa`)',
              bucket: 0,
            },
            {
              text: 'Dividir um intervalo ordenado ao meio repetidamente até encontrar um ID',
              bucket: 1,
            },
            {
              text: 'Percorrer um vetor uma vez para encontrar simultaneamente o mínimo e o máximo',
              bucket: 2,
            },
            {
              text: 'Executar `if x in lista:` dentro de um `for x in outra_lista:` (ambas tamanho n)',
              bucket: 3,
            },
            { text: 'Selection Sort em um vetor que já está 100% ordenado', bucket: 3 },
            { text: 'Insertion Sort em um vetor que já está 100% ordenado', bucket: 2 },
          ],
          explanation:
            'Atenção às duas últimas: Selection Sort continua `Θ(n²)` mesmo em entrada ordenada, enquanto Insertion Sort cai para `O(n)`! E `in` em lista dentro de um laço é o `O(n²)` acidental mais comum em código de produção.',
        },
      ],
    },
    {
      id: 'continuidade-busca-binaria-e-timsort',
      title: 'Continuidade: por que ordenar paga a conta (Busca Binária e Timsort)',
      blocks: [
        {
          type: 'text',
          text: 'Nos slides básicos de complexidade, ordenação costuma parecer um fim em si mesma. Na engenharia real, você ordena dados **para destravar buscas em `O(log n)`**, agrupamentos em uma passada e junções eficientes. E quando você chama `sorted()` em Python ou `Arrays.sort()` em Java para objetos, o motor por trás é o **Timsort** — que combina justamente **Insertion Sort** (em fatias pequenas chamadas *runs*) com **Merge Sort**!',
        },
        {
          type: 'table',
          caption: 'Quando vale a pena ordenar antes de buscar?',
          head: [
            'Cenário',
            'Sem ordenar (busca linear)',
            'Ordenar + Busca Binária',
            'Melhor escolha',
          ],
          rows: [
            [
              '1 única busca em 100.000 itens',
              'O(n) ≈ 100.000 passos',
              'O(n log n) + O(log n) ≈ 1.700.000 passos',
              'Busca linear direta (ordenar sairia mais caro!)',
            ],
            [
              '50.000 buscas no mesmo catálogo de 100.000 itens',
              '50.000 × 100.000 = 5 bilhões de passos',
              '1.7M + 50.000 × 17 ≈ 2.5 milhões de passos',
              'Ordenar 1x + Busca Binária (ou índice Hash)',
            ],
            [
              'Consultas por faixa (`preco BETWEEN 100 AND 250`)',
              'O(n) toda vez',
              'O(log n + k) após ordenar / B-Tree',
              'Estrutura ordenada (Hash não faz faixa!)',
            ],
          ],
        },
        {
          type: 'callout',
          tone: 'note',
          title: 'A ponte direta para a próxima aula',
          text: 'Você acabou de ver que algoritmos elementares (`O(n²)`) funcionam muito bem para vetores pequenos ou quase ordenados, mas travam em grandes volumes. Na próxima aula, vamos quebrar a barreira quadrática com **Merge Sort** e **Quick Sort** (`O(n log n)`).',
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: instrumentação real e quebra da barreira quadrática',
      blocks: [
        {
          type: 'text',
          text: 'Hora de provar a teoria medindo operações reais. Comece contando comparações e deslocamentos no Insertion Sort (**Nível 1**), implemente uma Busca Binária à prova de bugs de fronteira (**Nível 2**) e identifique a decisão assintótica correta em um incidente de performance (**Nível 3**).',
        },
        {
          type: 'python',
          activityId: 'alg-py-n1-insertion-metricas',
          title: 'Nível 1 — Insertion Sort instrumentado (compara melhor caso vs. pior caso)',
          task: 'Implemente `insertion_sort_metricas(lista)` sem alterar a lista original. Ela deve retornar `(ordenado, comparacoes, deslocamentos)` onde `comparacoes` conta cada vez que comparamos `v[j] > chave` (inclusive a comparação que faz o `while` parar!) e `deslocamentos` conta cada atribuição `v[j + 1] = v[j]`.',
          code: `def insertion_sort_metricas(lista: list) -> tuple[list, int, int]:
    v = list(lista)
    comparacoes = 0
    deslocamentos = 0
    # TODO: implementar Insertion Sort contando comparacoes e deslocamentos
    return v, comparacoes, deslocamentos

print("Ordenada:", insertion_sort_metricas([1, 2, 3, 4, 5]))
print("Inversa:", insertion_sort_metricas([5, 4, 3, 2, 1]))
`,
          solution: `def insertion_sort_metricas(lista: list) -> tuple[list, int, int]:
    v = list(lista)
    comparacoes = 0
    deslocamentos = 0
    for i in range(1, len(v)):
        chave = v[i]
        j = i - 1
        while j >= 0:
            comparacoes += 1
            if v[j] > chave:
                v[j + 1] = v[j]
                deslocamentos += 1
                j -= 1
            else:
                break
        v[j + 1] = chave
    return v, comparacoes, deslocamentos

print("Ordenada:", insertion_sort_metricas([1, 2, 3, 4, 5]))
print("Inversa:", insertion_sort_metricas([5, 4, 3, 2, 1]))
`,
          checks: [
            {
              label: 'Ordena corretamente sem modificar a lista de entrada',
              test: `(lambda orig: insertion_sort_metricas(orig)[0] == [1, 2, 3, 4, 5] and orig == [5, 1, 4, 2, 3])([5, 1, 4, 2, 3])`,
            },
            {
              label:
                'Em entrada já ordenada de 5 itens, faz exatamente 4 comparações e 0 deslocamentos (O(n))',
              test: `insertion_sort_metricas([1, 2, 3, 4, 5]) == ([1, 2, 3, 4, 5], 4, 0)`,
            },
            {
              label:
                'Em entrada invertida de 5 itens, faz exatamente 10 comparações e 10 deslocamentos (O(n²))',
              test: `insertion_sort_metricas([5, 4, 3, 2, 1]) == ([1, 2, 3, 4, 5], 10, 10)`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'alg-py-n2-busca-binaria-primeira',
          title: 'Nível 2 — Busca Binária retornando a PRIMEIRA ocorrência (com duplicatas)',
          task: 'Uma busca binária ingênua devolve qualquer índice quando há valores repetidos. Implemente `primeira_ocorrencia(ordenado, alvo)` em `O(log n)` retornando `(indice, passos)`: o **menor índice** onde `alvo` aparece (ou `-1` se não existir) e o número de iterações executadas.',
          code: `def primeira_ocorrencia(ordenado: list[int], alvo: int) -> tuple[int, int]:
    # TODO: busca binária em O(log n) que continua à esquerda ao encontrar alvo
    return -1, 0

print(primeira_ocorrencia([2, 4, 4, 4, 7, 9], 4))
`,
          solution: `def primeira_ocorrencia(ordenado: list[int], alvo: int) -> tuple[int, int]:
    esq, dir = 0, len(ordenado) - 1
    achado = -1
    passos = 0
    while esq <= dir:
        passos += 1
        meio = esq + (dir - esq) // 2
        if ordenado[meio] == alvo:
            achado = meio
            dir = meio - 1
        elif ordenado[meio] < alvo:
            esq = meio + 1
        else:
            dir = meio - 1
    return achado, passos

print(primeira_ocorrencia([2, 4, 4, 4, 7, 9], 4))
`,
          checks: [
            {
              label: 'Encontra o primeiro índice quando há elementos duplicados',
              test: `primeira_ocorrencia([2, 4, 4, 4, 7, 9], 4)[0] == 1`,
            },
            {
              label: 'Trata bordas: primeiro item, último item, ausente e lista vazia',
              test: `primeira_ocorrencia([1, 1, 2], 1)[0] == 0 and primeira_ocorrencia([1, 2, 9], 9)[0] == 2 and primeira_ocorrencia([1, 2, 9], 5)[0] == -1 and primeira_ocorrencia([], 1)[0] == -1`,
            },
            {
              label: 'Mantém custo logarítmico (<= 15 passos em lista de 10.000 itens)',
              test: `(lambda res: res[0] == 7777 and res[1] <= 15)(primeira_ocorrencia(list(range(10000)), 7777))`,
            },
          ],
        },
        {
          type: 'fill',
          activityId: 'alg-fill-n2-selection-trocas',
          prompt:
            'Complete o núcleo do Selection Sort para encontrar o menor índice do sufixo e só trocar se o menor não estiver já na posição `i`:',
          language: 'python',
          template: `for i in range(len(v) - 1):
    menor = [[i]]
    for j in range([[i + 1]], len(v)):
        if v[j] < v[menor]:
            menor = [[j]]
    if menor != i:
        v[i], v[menor] = v[menor], v[i]`,
          explanation:
            'Começamos assumindo que o menor está em `i`, varremos de `i + 1` até o fim atualizando `menor = j` sempre que achamos um valor menor, e fazemos no máximo uma troca por iteração externa.',
        },
        {
          type: 'quiz',
          activityId: 'alg-q2-n3-decisao-producao',
          question:
            'Nível 3 (Decisão de Engenharia): Um endpoint de relatórios faz a junção em Python de `pedidos` (20.000 linhas) com `clientes` (10.000 linhas) usando um `for` dentro de outro `for` buscando por `cliente_id`. A latência está em 6 segundos. Qual refatoração ataca a causa raiz com melhor relação custo-benefício?',
          options: [
            {
              text: 'Indexar `clientes` em um dicionário `{c["id"]: c}` em `O(m)` e percorrer `pedidos` uma única vez fazendo lookup `O(1)`, reduzindo o algoritmo de `O(n · m)` para `O(n + m)`.',
              correct: true,
              feedback:
                'Na mosca! Essa técnica (hash join em memória) derruba 200 milhões de comparações para apenas 30 mil operações, reduzindo segundos para poucos milissegundos.',
            },
            {
              text: 'Trocar o Bubble Sort do relatório por Selection Sort para reduzir o número de trocas.',
              feedback:
                'O gargalo está na junção aninhada `O(n · m)`, não nas trocas de ordenação; além disso, Selection Sort ainda é `O(n²)`.',
            },
            {
              text: 'Dobrar a quantidade de vCPUs do servidor para cortar a complexidade assintótica pela metade.',
              feedback:
                'Hardware melhora a constante, nunca a classe assintótica: quando a base dobrar de tamanho, um algoritmo `O(n²)` quadruplicará de novo.',
            },
            {
              text: 'Converter os dois arrays em filas circulares para deixar a varredura em `O(1)`.',
              feedback:
                'Fila circular torna inserção/remoção nas pontas `O(1)`, mas buscar por um `cliente_id` arbitrário dentro dela ainda exige varredura `O(m)`.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Big O (limite superior), Ω (limite inferior) e Θ (limite exato) descrevem como operações crescem com o tamanho da entrada `n`, independentemente do hardware.',
    'Selection Sort é sempre Θ(n²) com no máximo n - 1 trocas; Insertion Sort cai para Ω(n) em listas quase ordenadas e é estável.',
    'Estabilidade preserva a ordem relativa de empates (essencial em ordenação por múltiplas colunas) e `in lista` dentro de laços cria `O(n²)` silencioso.',
    'Bibliotecas reais como o Timsort do Python combinam Insertion Sort (para trechos pequenos/ordenados) com Merge Sort, e ordenar desbloqueia busca binária em O(log n).',
  ],
  cards: [
    {
      id: 'alg-o-omega-theta',
      front: 'Diferencie Big O, Big Ômega (Ω) e Big Teta (Θ).',
      back: 'Big O é o teto (limite superior de crescimento), Ω é o piso (limite inferior) e Θ é o limite exato quando teto e piso têm a mesma ordem.',
    },
    {
      id: 'alg-insertion-vs-selection',
      front: 'Por que Insertion Sort vence Selection Sort em dados quase ordenados?',
      back: 'Porque Insertion Sort interrompe o laço interno assim que encontra um valor menor ou igual (Ω(n)), enquanto Selection Sort varre o restante inteiro toda vez (Θ(n²)).',
    },
    {
      id: 'alg-estabilidade',
      front: 'O que significa dizer que um algoritmo de ordenação é estável?',
      back: 'Elementos com a mesma chave mantêm a ordem relativa que tinham na entrada original — vital ao ordenar por múltiplos critérios.',
    },
    {
      id: 'alg-n2-oculto',
      front: 'Qual o exemplo mais comum de O(n²) acidental em código Python de produção?',
      back: 'Fazer `if x in lista:` ou `lista.pop(0)` dentro de um laço `for` sobre n elementos, convertendo um trabalho linear em quadrático.',
    },
    {
      id: 'alg-busca-binaria',
      front: 'Quantas comparações no máximo a busca binária faz em 1.000.000 de itens ordenados?',
      back: 'No máximo 20 comparações (pois 2²⁰ = 1.048.576), já que cada passo descarta metade do espaço de busca.',
    },
    {
      id: 'alg-timsort',
      front: 'Por que o Timsort (usado em Python e Java) usa Insertion Sort internamente?',
      back: 'Porque em fatias pequenas (runs de ~32–64 itens) ou já parcialmente ordenadas, a baixa constante e a localidade de cache do Insertion Sort superam algoritmos O(n log n) puros.',
    },
  ],
  mission: {
    title: 'Benchmark real: prove na máquina onde o O(n²) quebra',
    text: 'Construa um pequeno script de benchmark comparando algoritmos quadráticos com `sorted()` e busca linear com busca binária.',
    steps: [
      'Gere listas de tamanhos 1.000, 5.000 e 15.000 em três perfis: aleatória, quase ordenada (5 trocas) e invertida.',
      'Meça comparações e tempo de Selection Sort, Insertion Sort e `sorted()` (Timsort) nos três perfis.',
      'Monte uma tabela Markdown mostrando por que Insertion Sort empata ou ganha na quase ordenada, mas explode na invertida.',
      'Encontre um laço aninhado real em algum exercício antigo seu e refatore para `set`/`dict` medindo o ganho.',
    ],
  },
  sources: [
    {
      title: 'MIT OpenCourseWare 6.006 — Análise Assintótica e Ordenação',
      url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/',
    },
    {
      title: 'Python Wiki — TimeComplexity das operações nativas',
      url: 'https://wiki.python.org/moin/TimeComplexity',
    },
    {
      title: 'CPython — Documentação do Timsort (listsort.txt)',
      url: 'https://github.com/python/cpython/blob/main/Objects/listsort.txt',
    },
  ],
};
