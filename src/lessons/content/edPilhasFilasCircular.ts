import { LessonContent } from '../types';

export const content: LessonContent = {
  revision: 2,
  hook: 'Um buffer de áudio em tempo real, a fila de pacotes da placa de rede ou o botão Desfazer do seu editor não podem realocar memória a cada milissegundo — nem perder dados quando chegam ao fim do vetor. Entender **pilhas**, **filas** e **fila circular** é o que separa um código didático que desperdiça memória de uma estrutura previsível em `O(1)` usada em produção.',
  sections: [
    {
      id: 'onde-aparece-na-vida-real',
      title: 'Onde pilhas, filas e fila circular movem sistemas reais',
      blocks: [
        {
          type: 'text',
          text: 'Estruturas lineares restritas parecem simples demais até você perceber por que elas restringem o acesso de propósito: ao proibir inserções no meio, você garante operações em tempo constante `O(1)` e invariantes fáceis de provar sob concorrência e memória limitada.',
        },
        {
          type: 'table',
          caption: 'Pilhas, filas e ring buffers fora da sala de aula',
          head: ['Estrutura', 'Regra de saída', 'Onde roda em produção', 'O que quebra se errar'],
          rows: [
            [
              'Pilha (Stack)',
              'LIFO — último a entrar, primeiro a sair',
              'Call stack de chamadas de função, Desfazer/Refazer (Ctrl+Z), parser de parênteses/HTML, DFS em grafos',
              'Stack overflow em recursão sem caso-base ou tags mal fechadas sem detecção',
            ],
            [
              'Fila (Queue)',
              'FIFO — primeiro a entrar, primeiro a sair',
              'Filas de impressão, agendamento de jobs em background, BFS em grafos, buffer de requisições HTTP',
              'Starvation (tarefas antigas nunca rodam) ou uso de `list.pop(0)` virando `O(n)` sob carga',
            ],
            [
              'Fila Circular (Ring Buffer)',
              'FIFO em vetor fixo com retorno ao índice 0',
              'Drivers de placa de rede (NIC), buffers de áudio/vídeo, logs em memória no kernel Linux (`dmesg`), telemetria embarcada',
              'Falso "cheio" com posições livres, perda silenciosa de eventos ou corrupção de ponteiros',
            ],
          ],
        },
        {
          type: 'analogy',
          title: 'Por que a fila estática comum "quebra" mesmo vazia',
          text: 'Imagine um estacionamento estreito de 5 vagas numeradas de 0 a 4 onde os carros só entram pelo fundo e saem pela frente. Se 5 carros entram e 4 saem, as vagas 0, 1, 2 e 3 estão vazias, mas o ponteiro de entrada já bateu na vaga 4. Sem conectar o fim ao começo com aritmética modular, você ou bloqueia novos carros com 80% do pátio livre, ou precisa empurrar todos os carros uma vaga para trás a cada saída — custando `O(n)`.',
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Armadilha clássica em Python: list.pop(0) não é O(1)',
          text: 'Muita gente implementa fila com `lista.append(x)` e `lista.pop(0)`. Em listas contíguas, remover o índice 0 obriga o runtime a deslocar **todos** os elementos restantes uma casa para a esquerda (`O(n)`). Com 100 mil requisições na fila, processar tudo vira `O(n²)`. Para fila real em Python use `collections.deque` ou uma fila circular com índices `inicio` e `fim`.',
        },
      ],
    },
    {
      id: 'mecanismo-por-dentro',
      title: 'Aritmética modular: como a fila circular dá a volta em O(1)',
      blocks: [
        {
          type: 'text',
          text: 'Na fila circular de capacidade `cap`, o vetor nunca cresce nem desloca elementos. Mantemos três invariantes simples: `inicio` (índice do próximo item a sair), `fim` (índice da próxima vaga livre) e `qtd` (quantos itens estão ocupados). Avançar qualquer ponteiro usa resto da divisão: `(indice + 1) % cap`.',
        },
        {
          type: 'anatomy',
          caption: 'A operação central que elimina deslocamento de memória',
          language: 'python',
          parts: [
            { text: 'self.fim = ' },
            {
              text: '(self.fim + 1)',
              label: 'Avanço linear',
              note: 'Move o cursor uma posição à frente após gravar o novo elemento.',
            },
            { text: ' ' },
            {
              text: '% self.capacidade',
              label: 'Wrap-around modular',
              note: 'Quando fim + 1 atinge capacidade (ex.: 4 % 4 == 0), o índice retorna instantaneamente à posição 0 em O(1).',
            },
          ],
        },
        {
          type: 'trace',
          caption: 'Rastreamento passo a passo do wrap-around em capacidade 3',
          code: `dados = [None, None, None]
inicio, fim, qtd = 0, 0, 0
dados[fim] = "A"; fim = (fim + 1) % 3; qtd += 1
dados[fim] = "B"; fim = (fim + 1) % 3; qtd += 1
dados[fim] = "C"; fim = (fim + 1) % 3; qtd += 1
saiu = dados[inicio]; dados[inicio] = None; inicio = (inicio + 1) % 3; qtd -= 1
dados[fim] = "D"; fim = (fim + 1) % 3; qtd += 1`,
          steps: [
            {
              line: 2,
              note: 'Fila vazia: inicio e fim apontam para 0, mas qtd == 0 distingue vazio de cheio.',
              memory: [
                ['dados', '[None, None, None]'],
                ['inicio / fim', '0 / 0'],
                ['qtd', '0'],
              ],
            },
            {
              line: 3,
              note: 'Enfileira "A" na posição 0; fim avança para 1.',
              memory: [
                ['dados', '["A", None, None]'],
                ['inicio / fim', '0 / 1'],
                ['qtd', '1'],
              ],
            },
            {
              line: 5,
              note: 'Após "B" e "C", fim deu a volta para 0! Agora inicio == fim == 0, mas qtd == 3 indica fila CHEIA.',
              memory: [
                ['dados', '["A", "B", "C"]'],
                ['inicio / fim', '0 / 0'],
                ['qtd', '3 (cheia)'],
              ],
            },
            {
              line: 6,
              note: 'Desenfileira "A" da posição 0; inicio vai para 1 e a posição 0 volta a ficar livre.',
              memory: [
                ['dados', '[None, "B", "C"]'],
                ['inicio / fim', '1 / 0'],
                ['qtd', '2'],
              ],
              output: 'saiu = "A"',
            },
            {
              line: 7,
              note: 'Enfileira "D" exatamente na vaga 0 reaproveitada! Ordem lógica na fila agora é B → C → D.',
              memory: [
                ['dados', '["D", "B", "C"]'],
                ['inicio / fim', '1 / 1'],
                ['qtd', '3 (cheia)'],
              ],
            },
          ],
        },
        {
          type: 'reveal',
          question:
            'Por que guardar `qtd` (ou sacrificar 1 slot) é obrigatório quando `inicio == fim`?',
          answer:
            'Porque `inicio == fim` acontece em **dois estados opostos**: quando a fila está completamente vazia (`qtd == 0`) e quando acabou de encher dando a volta completa (`qtd == cap`). Sem um contador `qtd` (ou sem deixar 1 posição sentinela sempre vazia), o algoritmo não consegue distinguir fila vazia de fila cheia.',
        },
        {
          type: 'quiz',
          activityId: 'ed-q1-wrap-index',
          question:
            'Uma fila circular de capacidade 5 está com `inicio = 3`, `fim = 1` e `qtd = 3`. Depois de **2 remoções** e **3 inserções**, quais serão `inicio`, `fim` e `qtd`?',
          options: [
            {
              text: '`inicio = 0`, `fim = 4`, `qtd = 4`',
              correct: true,
              feedback:
                'Exato! Duas remoções levam `inicio` de 3 → 4 → 0 (`(3 + 2) % 5 = 0`) e `qtd` para 1. Três inserções levam `fim` de 1 → 2 → 3 → 4 (`(1 + 3) % 5 = 4`) e `qtd` para 4.',
            },
            {
              text: '`inicio = 5`, `fim = 4`, `qtd = 4`',
              feedback:
                'Em uma fila circular de capacidade 5, os índices válidos são apenas 0, 1, 2, 3 e 4. `(3 + 2) % 5` resulta em 0, nunca em 5.',
            },
            {
              text: '`inicio = 0`, `fim = 3`, `qtd = 4`',
              feedback:
                'Confira o avanço de `fim`: saindo de 1 com 3 inserções válidas, você ocupa os índices 1, 2 e 3, deixando `fim` na próxima vaga livre (4).',
            },
            {
              text: 'A 3ª inserção falha por fila cheia',
              feedback:
                'Como houve 2 remoções antes, `qtd` caiu de 3 para 1; cabem ainda 4 itens antes de atingir capacidade 5.',
            },
          ],
        },
      ],
    },
    {
      id: 'bugs-reais-e-casos-de-borda',
      title: 'Caça ao bug: falhas reais em implementações de fila circular',
      blocks: [
        {
          type: 'text',
          text: 'No arquivo `48083.py`, a inserção em fila cheia imprime “Fila Vazia!!”. Há também um erro na remoção. Execute `init(5)`, chame `push` cinco vezes e depois chame `pop()` cinco vezes. Os dois cursores ficam em 5. Na próxima remoção, `fila[rpos]` tenta acessar `fila[5]` antes de voltar o cursor para 0, e o Python lança `IndexError`.',
        },
        {
          type: 'codeTabs',
          caption: 'Verificação de fila vazia no material original e contrato com contador',
          tabs: [
            {
              label: 'Remoção original (48083.py)',
              language: 'python',
              code: `def pop():
    global fila, rpos

    if rpos == spos and fila[rpos] == None:
        print("Fila Vazia!!")
        return
    if rpos == MAX:
        rpos = 0
    valor = fila[rpos]
    fila[rpos] = None
    rpos = rpos + 1
    return valor`,
            },
            {
              label: 'Remoção com contador e índice modular',
              language: 'python',
              code: `def desenfileirar(self):
    if self.qtd == 0:
        return None
    item = self.dados[self.inicio]
    self.dados[self.inicio] = None
    self.inicio = (self.inicio + 1) % self.cap
    self.qtd -= 1
    return item`,
            },
          ],
        },
        {
          type: 'classify',
          activityId: 'ed-c1-diagnostico-borda',
          prompt:
            'Classifique cada sintoma de bug de acordo com a causa raiz na implementação da fila circular:',
          buckets: [
            'Erro de aritmética modular / ponteiro',
            'Falha na distinção vazio vs. cheio',
            'Vazamento de memória / contrato frágil',
          ],
          items: [
            {
              text: 'Ao inserir o 6º item após 1 remoção em capacidade 5, ocorre IndexError: list assignment index out of range',
              bucket: 0,
            },
            {
              text: 'A fila está 100% cheia, mas `esta_vazia()` retorna True porque só compara `inicio == fim`',
              bucket: 1,
            },
            {
              text: 'Itens antigos desenfileirados nunca são limpos (`None`) e continuam retendo objetos pesados na RAM',
              bucket: 2,
            },
            {
              text: '`enfileirar` imprime erro no terminal e retorna `None`, fazendo o produtor acreditar que o evento foi entregue',
              bucket: 2,
            },
            {
              text: 'Ao reiniciar `fim = 0` apenas quando `fim == cap - 1`, a última posição do vetor nunca é utilizada',
              bucket: 0,
            },
            {
              text: 'Com capacidade 1, inserir 1 item deixa `inicio == fim == 0` e bloqueia a leitura do único elemento',
              bucket: 1,
            },
          ],
          explanation:
            'Erros de índice geram IndexError ou slots mortos; comparar só `inicio == fim` confunde cheio e vazio; manter referências antigas ou suprimir erros com `print` cria vazamentos e falhas silenciosas.',
        },
      ],
    },
    {
      id: 'continuidade-ring-buffer-e-backpressure',
      title: 'Continuidade: Deque, Ring Buffer sobrescritivo e Backpressure',
      blocks: [
        {
          type: 'text',
          text: 'O material básico da faculdade costuma parar no "se estiver cheia, recuse". Em sistemas reais de engenharia de software, existem **três políticas arquiteturais** quando uma fila limitada enche — e escolher a errada causa indisponibilidade ou perda de dados financeiros.',
        },
        {
          type: 'cards',
          columns: 3,
          items: [
            {
              label: 'Política 1 · Rejeitar (Backpressure)',
              title: 'Recusar com erro explícito (HTTP 429 / 503)',
              text: 'Usada em APIs de pagamento e pedidos: melhor avisar o cliente para tentar de novo do que derrubar o banco por sobrecarga.',
              points: [
                'Retorna False ou lança exceção',
                'Preserva integridade dos itens já aceitos',
              ],
            },
            {
              label: 'Política 2 · Sobrescrever o mais antigo',
              title: 'Ring Buffer deslizante (logs e sensores)',
              text: 'Usada em `dmesg`, telemetria IoT e replay de vídeo: quando enche, o novo dado sobrescreve `inicio` e avança `inicio = (inicio + 1) % cap`.',
              points: ['Memória 100% constante', 'Mantém sempre a janela dos últimos N eventos'],
            },
            {
              label: 'Política 3 · Deque (Fila dupla)',
              title: 'Inserção e remoção nas duas pontas em O(1)',
              text: 'Base de algoritmos de janela deslizante e work-stealing em schedulers de threads (Go, Tokio, ForkJoinPool do Java).',
              points: [
                '`append`/`pop` no fim e `appendleft`/`popleft` no início',
                'Une pilha e fila numa única estrutura',
              ],
            },
          ],
        },
        {
          type: 'flow',
          caption: 'Como o Ring Buffer com política de sobrecarga protege o sistema',
          actors: ['Produtor rápido', 'Fila Circular (cap=3)', 'Consumidor lento'],
          steps: [
            {
              from: 0,
              to: 1,
              label: 'enqueue(e1, e2, e3)',
              text: 'Buffer absorve pico momentâneo sem travar o produtor.',
              tone: 'ok',
            },
            {
              from: 0,
              to: 1,
              label: 'enqueue(e4) com fila cheia',
              text: 'Sem política clara, ocorreria corrupção ou OOM. Aqui aplica-se backpressure (rejeita) ou ring overwrite (descarta e1).',
              tone: 'error',
            },
            {
              from: 1,
              to: 2,
              label: 'dequeue() -> e1 ou e2',
              text: 'Consumidor processa no seu ritmo estável e libera slots em O(1).',
              tone: 'ok',
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'ed-q2-politica-sobrecarga',
          question:
            'Você está projetando dois subsistemas: (A) um buffer de métricas de CPU em memória que exibe sempre as últimas 60 amostras em um painel e (B) uma fila de transações PIX aguardando liquidação. Qual política cabe em cada caso?',
          options: [
            {
              text: '(A) Ring buffer sobrescrevendo a amostra mais antiga; (B) backpressure explícito rejeitando ou bloqueando com sinalização, sem nunca descartar silenciosamente.',
              correct: true,
              feedback:
                'Perfeito! Em telemetria recente, manter as últimas 60 leituras com memória fixa evita OOM. Em transações financeiras, sobrescrever silenciosamente significaria perder dinheiro/rastreabilidade.',
            },
            {
              text: 'Sobrescrever o mais antigo em ambos, pois garante O(1) e nunca lança exceção.',
              feedback:
                'Nunca lançar exceção em transações financeiras perdendo registros é um erro gravíssimo de integridade.',
            },
            {
              text: 'Usar uma lista dinâmica ilimitada em ambos para nunca precisar tratar fila cheia.',
              feedback:
                'Filas ilimitadas em produção viram bombas-relógio de Out-Of-Memory (OOM) quando o consumidor desacelera.',
            },
            {
              text: '(A) Pilha LIFO para descartar os dados mais novos; (B) lista com `pop(0)`.',
              feedback:
                'Em (A) você perderia justamente as amostras mais recentes; em (B) `pop(0)` degrada para O(n) por operação.',
            },
          ],
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: do rastreamento ao Ring Buffer de produção',
      blocks: [
        {
          type: 'text',
          text: 'Esta seção exige código real e atenção a casos de borda. Nenhum exercício aqui é trivial: avance do **Nível 1** (invariante de pilha em validação de sintaxe), passe pelo **Nível 2** (fila circular sem bugs com wrap-around e ordem lógica) e feche no **Nível 3** (ring buffer deslizante para telemetria com descarte rastreado).',
        },
        {
          type: 'python',
          activityId: 'ed-py-n1-pilha-delimitadores',
          title: 'Nível 1 — Validador de delimitadores com Pilha (parser de código)',
          task: 'Implemente `delimitadores_validos(expr)` usando uma pilha explícita para validar `()`, `[]` e `{}`. Atenção aos casos de borda: fechamento sem abertura (`")("`), cruzamento inválido (`"([)]"`) e abertura sem fechar (`"({}"`).',
          code: `def delimitadores_validos(expr: str) -> bool:
    # TODO: use uma pilha (lista com append/pop) e um dicionário de pares
    return False

print(delimitadores_validos("def f(x): return [x, {'a': (1 + 2)}]"))
print(delimitadores_validos("([)]"))
`,
          solution: `def delimitadores_validos(expr: str) -> bool:
    pilha = []
    pares = {')': '(', ']': '[', '}': '{'}
    aberturas = set(pares.values())
    for ch in expr:
        if ch in aberturas:
            pilha.append(ch)
        elif ch in pares:
            if not pilha or pilha.pop() != pares[ch]:
                return False
    return len(pilha) == 0

print(delimitadores_validos("def f(x): return [x, {'a': (1 + 2)}]"))
print(delimitadores_validos("([)]"))
`,
          checks: [
            {
              label: 'Aceita expressão válida aninhada com texto misturado',
              test: `delimitadores_validos("def f(x): return [x, {'a': (1 + 2)}]") is True`,
            },
            {
              label: 'Rejeita delimitadores cruzados como "([)]"',
              test: `delimitadores_validos("([)]") is False`,
            },
            {
              label: 'Rejeita fechamento sem abertura e string com sobra aberta',
              test: `delimitadores_validos(")(") is False and delimitadores_validos("({}") is False`,
            },
            {
              label: 'Aceita string vazia ou sem delimitadores',
              test: `delimitadores_validos("") is True and delimitadores_validos("abc") is True`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'ed-py-n2-fila-circular',
          title: 'Nível 2 — Fila Circular completa sem os bugs de 48083.py',
          task: 'Complete `FilaCircular` usando vetor de tamanho fixo, `inicio`, `fim` e `qtd` (sem usar `pop(0)`). `enfileirar` retorna `True/False`, `desenfileirar` retorna o item (ou `None` se vazia, limpando a posição) e `ordem_logica()` devolve os elementos na ordem FIFO correta mesmo após vários wrap-arounds.',
          code: `class FilaCircular:
    def __init__(self, capacidade: int):
        if capacidade <= 0:
            raise ValueError("capacidade deve ser > 0")
        self.dados = [None] * capacidade
        self.cap = capacidade
        self.inicio = 0
        self.fim = 0
        self.qtd = 0

    def enfileirar(self, item) -> bool:
        # TODO: recusar se cheia (retornar False), senão gravar em fim e avançar com %
        return False

    def desenfileirar(self):
        # TODO: se vazia retornar None; senão ler inicio, limpar com None e avançar com %
        return None

    def ordem_logica(self) -> list:
        # TODO: devolver lista na ordem FIFO a partir de self.inicio
        return []
`,
          solution: `class FilaCircular:
    def __init__(self, capacidade: int):
        if capacidade <= 0:
            raise ValueError("capacidade deve ser > 0")
        self.dados = [None] * capacidade
        self.cap = capacidade
        self.inicio = 0
        self.fim = 0
        self.qtd = 0

    def enfileirar(self, item) -> bool:
        if self.qtd == self.cap:
            return False
        self.dados[self.fim] = item
        self.fim = (self.fim + 1) % self.cap
        self.qtd += 1
        return True

    def desenfileirar(self):
        if self.qtd == 0:
            return None
        item = self.dados[self.inicio]
        self.dados[self.inicio] = None
        self.inicio = (self.inicio + 1) % self.cap
        self.qtd -= 1
        return item

    def ordem_logica(self) -> list:
        return [self.dados[(self.inicio + i) % self.cap] for i in range(self.qtd)]
`,
          checks: [
            {
              label: 'Enche até a capacidade e recusa o excedente retornando False',
              test: `(lambda f: [f.enfileirar(x) for x in (10, 20, 30, 40)] == [True, True, True, False])(FilaCircular(3))`,
            },
            {
              label: 'Faz wrap-around corretamente após remoções e preserva ordem FIFO',
              test: `(lambda f: (f.enfileirar('A'), f.enfileirar('B'), f.enfileirar('C'), f.desenfileirar(), f.desenfileirar(), f.enfileirar('D'), f.enfileirar('E'), f.ordem_logica() == ['C', 'D', 'E'] and f.inicio == 2 and f.fim == 2)[-1])(FilaCircular(3))`,
            },
            {
              label: 'Limpa referências antigas ao desenfileirar e trata fila vazia',
              test: `(lambda f: (f.enfileirar('X'), f.desenfileirar() == 'X' and f.dados == [None, None] and f.desenfileirar() is None)[-1])(FilaCircular(2))`,
            },
            {
              label: 'Após encher e esvaziar, uma nova remoção sinaliza fila vazia',
              test: `(lambda f: (
    [f.enfileirar(i) for i in range(5)],
    [f.desenfileirar() for i in range(6)] == [0, 1, 2, 3, 4, None]
)[1])(FilaCircular(5))`,
            },
            {
              label: 'Não usa list.pop(0)',
              test: `'pop(0)' not in __codigo__`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'ed-py-n3-ring-buffer-telemetria',
          title: 'Nível 3 — Ring Buffer deslizante com contagem de descartes',
          task: 'Implemente `RingBufferLog(capacidade)` para um coletor de logs em memória: quando estiver cheio, `registrar(evento)` **sobrescreve o evento mais antigo**, avança `inicio`, incrementa `self.descartados` e mantém a janela exata dos últimos `capacidade` eventos em `ultimos()`.',
          code: `class RingBufferLog:
    def __init__(self, capacidade: int):
        self.dados = [None] * capacidade
        self.cap = capacidade
        self.inicio = 0
        self.fim = 0
        self.qtd = 0
        self.descartados = 0

    def registrar(self, evento: str) -> None:
        # TODO: se cheio, avançar inicio e incrementar descartados antes/ao gravar em fim
        pass

    def ultimos(self) -> list:
        # TODO: retornar eventos do mais antigo retido até o mais recente
        return []
`,
          solution: `class RingBufferLog:
    def __init__(self, capacidade: int):
        self.dados = [None] * capacidade
        self.cap = capacidade
        self.inicio = 0
        self.fim = 0
        self.qtd = 0
        self.descartados = 0

    def registrar(self, evento: str) -> None:
        if self.qtd == self.cap:
            self.inicio = (self.inicio + 1) % self.cap
            self.descartados += 1
        else:
            self.qtd += 1
        self.dados[self.fim] = evento
        self.fim = (self.fim + 1) % self.cap

    def ultimos(self) -> list:
        return [self.dados[(self.inicio + i) % self.cap] for i in range(self.qtd)]
`,
          checks: [
            {
              label: 'Retém exatamente os 3 últimos eventos após 5 registros',
              test: `(lambda r: ([r.registrar(f'e{i}') for i in range(1, 6)], r.ultimos() == ['e3', 'e4', 'e5'])[-1])(RingBufferLog(3))`,
            },
            {
              label: 'Contabiliza corretamente 2 eventos descartados',
              test: `(lambda r: ([r.registrar(f'e{i}') for i in range(1, 6)], r.descartados == 2)[-1])(RingBufferLog(3))`,
            },
            {
              label: 'Funciona antes de encher sem registrar descartes indevidos',
              test: `(lambda r: (r.registrar('a'), r.registrar('b'), r.ultimos() == ['a', 'b'] and r.descartados == 0)[-1])(RingBufferLog(4))`,
            },
          ],
        },
        {
          type: 'order',
          activityId: 'ed-ord-auditoria-fila',
          prompt:
            'Ordene os passos corretos para desenfileirar com segurança um item em uma fila circular de capacidade fixa:',
          items: [
            'Verificar se `qtd == 0` e sinalizar fila vazia sem alterar os ponteiros',
            'Ler o valor em `dados[inicio]` numa variável local',
            'Atribuir `None` em `dados[inicio]` para liberar a referência na memória',
            'Avançar `inicio = (inicio + 1) % cap` e decrementar `qtd -= 1`',
            'Retornar o valor capturado ao chamador',
          ],
          explanation:
            'Validar vazio antes de ler evita devolver lixo; limpar a posição evita vazamento de referência em objetos grandes; só depois avançamos o ponteiro modular e atualizamos `qtd`.',
        },
      ],
    },
  ],
  recap: [
    'Pilhas (LIFO) e filas (FIFO) restringem pontos de acesso para garantir operações previsíveis em O(1).',
    'Usar `list.pop(0)` para implementar fila degrada para O(n) por remoção devido ao deslocamento de elementos.',
    'A fila circular reutiliza posições liberadas em O(1) usando aritmética modular `(indice + 1) % cap` e um contador `qtd` para distinguir vazio de cheio.',
    'Em produção, uma fila limitada exige política explícita de sobrecarga: backpressure (rejeitar/sinalizar) para dados críticos ou ring buffer sobrescritivo para telemetria recente.',
  ],
  cards: [
    {
      id: 'ed-lifo-fifo',
      front: 'Qual a diferença prática entre LIFO (pilha) e FIFO (fila) em sistemas reais?',
      back: 'LIFO (Last In, First Out) atende primeiro o mais recente — ideal para call stack, Ctrl+Z e parsers. FIFO (First In, First Out) preserva ordem de chegada — ideal para filas de jobs, rede e impressão.',
    },
    {
      id: 'ed-pop0-custo',
      front: 'Por que `list.pop(0)` em Python é perigoso como fila sob carga?',
      back: 'Porque uma lista dinâmica armazena itens em memória contígua: remover o índice 0 desloca todos os n-1 itens restantes, custando O(n) por operação.',
    },
    {
      id: 'ed-wrap-formula',
      front: 'Como a fila circular retorna do último índice para o índice 0 em O(1)?',
      back: 'Usando aritmética modular: `proximo = (indice + 1) % capacidade`. Quando `indice + 1 == capacidade`, o resto é 0.',
    },
    {
      id: 'ed-vazio-vs-cheio',
      front: 'Por que `inicio == fim` sozinho não basta na fila circular?',
      back: 'Porque `inicio == fim` ocorre tanto na fila vazia (`qtd == 0`) quanto na fila cheia (`qtd == capacidade`). É preciso manter `qtd` ou reservar um slot sentinela.',
    },
    {
      id: 'ed-limpar-slot',
      front: 'Por que atribuir `None` ao slot desenfileirado antes de avançar `inicio`?',
      back: 'Para não manter referências mortas a objetos grandes dentro do vetor interno, permitindo que o coletor de lixo libere a memória (evitando memory leak).',
    },
    {
      id: 'ed-backpressure-vs-ring',
      front:
        'Quando usar backpressure (rejeitar) vs. ring buffer sobrescritivo quando a fila enche?',
      back: 'Backpressure para eventos que não podem ser perdidos (pagamentos, pedidos); ring buffer sobrescritivo para janelas recentes de telemetria, áudio ou logs em memória.',
    },
  ],
  mission: {
    title: 'Audite e corrija um código real de fila circular',
    text: 'Pegue a estrutura de fila circular vista em aula e transforme-a em um módulo testável com casos de borda que quebram implementações ingênuas.',
    steps: [
      'Escreva testes unitários cobrindo: capacidade 1, encher/esvaziar duas vezes seguidas, wrap-around completo e recusa quando cheia.',
      'Meça no Python o tempo de enfileirar e desenfileirar 80.000 itens com `list.pop(0)` versus `collections.deque` e registre a razão entre os tempos.',
      'Documente em 5 linhas qual política de sobrecarga (rejeitar ou sobrescrever) você escolheria para uma fila de notas fiscais e para um buffer de sensores.',
      'Compare uma solução gerada por IA com seus testes de borda e verifique se ela limpa referências e distingue vazio de cheio.',
    ],
  },
  sources: [
    {
      title: 'Python Docs — collections.deque e estruturas de dados',
      url: 'https://docs.python.org/pt-br/3/library/collections.html#collections.deque',
    },
    {
      title: 'Linux Kernel Docs — Circular Buffers (ring buffers em sistemas reais)',
      url: 'https://www.kernel.org/doc/html/latest/core-api/circular-buffers.html',
    },
    {
      title: 'MIT OpenCourseWare 6.006 — Introduction to Algorithms',
      url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/',
    },
  ],
};
