import { LessonContent } from '../types';

export const content: LessonContent = {
  revision: 2,
  hook: 'Quando seu container Docker toma **OOMKilled**, quando duas threads corrompem o saldo de uma conta sem lançar erro, ou quando uma API fica lenta mesmo com 15% de CPU porque está presa em troca de contexto e *page faults*, quem explica o mistério não é o framework web — é o **Sistema Operacional** rodando por baixo de tudo.',
  sections: [
    {
      id: 'arquitetura-kernel-e-syscalls',
      title: 'Kernel, Modo Usuário × Modo Núcleo e por que chamadas de sistema custam tempo',
      blocks: [
        {
          type: 'text',
          text: 'O Sistema Operacional atua como **gerente de recursos** (CPU, RAM, disco, rede) e **máquina estendida** (oferecendo abstrações limpas como arquivos e sockets no lugar de registradores de hardware). Para impedir que um programa com bug ou malicioso apague a memória de outro, a CPU opera em níveis de privilégio distintos: **Modo Usuário (User Mode)** e **Modo Núcleo (Kernel Mode)**.',
        },
        {
          type: 'table',
          caption: 'Arquiteturas de SO estudadas em aula — e onde cada uma vive hoje',
          head: ['Arquitetura', 'Como funciona', 'Prós e Contras', 'Exemplos reais'],
          rows: [
            [
              'Monolítica (modular)',
              'Drivers, rede, sistema de arquivos e escalonador rodam no espaço do kernel',
              'Altíssima performance (sem IPC extra); bug em driver pode travar o kernel',
              'Linux, FreeBSD, macOS/Windows (híbridos)',
            ],
            [
              'Microkernel',
              'Kernel mínimo (IPC, memória básica, agendamento); drivers rodam em user space',
              'Mais isolado e tolerante a falhas de driver; maior custo de troca de mensagens (IPC)',
              'MINIX, QNX (automotivo/médico), seL4',
            ],
            [
              'Hypervisor / Virtualização',
              'Camada abaixo dos SOs convidados compartilha hardware físico com isolamento',
              'Base absoluta da computação em nuvem e VMs (Tipo 1 bare-metal vs. Tipo 2 hospedado)',
              'KVM (Linux), VMware ESXi, Xen, VirtualBox',
            ],
          ],
        },
        {
          type: 'flow',
          caption: 'O que acontece quando seu programa faz `open("/etc/hosts")` (System Call)',
          actors: [
            'Seu App (User Mode)',
            'CPU Trap / Syscall',
            'Kernel Linux (Kernel Mode)',
            'Driver / Disco',
          ],
          steps: [
            {
              from: 0,
              to: 1,
              label: 'syscall read(fd, buf, 4096)',
              text: 'App NÃO pode ler o disco diretamente; dispara instrução controlada de trap para o kernel.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 2,
              label: 'Verifica permissões e page cache',
              text: 'Kernel valida se o UID do processo pode ler o arquivo; se já estiver em RAM (page cache), nem toca o disco!',
              tone: 'ok',
            },
            {
              from: 2,
              to: 3,
              label: 'I/O assíncrono no SSD (se miss)',
              text: 'Se não estiver em cache, processo vai para estado BLOQUEADO enquanto o driver busca o bloco.',
              tone: 'ok',
            },
            {
              from: 2,
              to: 0,
              label: 'Retorna bytes lidos ao User Mode',
              text: 'Kernel copia os bytes ao buffer do processo e devolve a CPU ao modo usuário.',
              tone: 'ok',
            },
          ],
        },
      ],
    },
    {
      id: 'processos-threads-e-escalonamento',
      title: 'Processos, Threads, PCB e Escalonamento de CPU (FCFS, SJF, Round-Robin)',
      blocks: [
        {
          type: 'text',
          text: 'Um **processo** é um programa em execução isolado em seu próprio espaço de endereçamento, descrito no kernel por um **PCB (Process Control Block)** (PID, estado, registradores, tabela de páginas, arquivos abertos). **Threads** vivem dentro do mesmo processo: compartilham memória heap e arquivos, mas cada uma tem sua própria pilha (stack) e contador de programa — criando paralelismo barato, porém abrindo a porta para condições de corrida.',
        },
        {
          type: 'terms',
          items: [
            {
              term: 'Estados de um processo',
              text: '**Pronto (Ready)** aguarda CPU; **Executando (Running)** está na CPU agora; **Bloqueado (Blocked/Waiting)** aguarda I/O (disco, rede, mutex) e libera a CPU imediatamente para outro processo.',
            },
            {
              term: 'Troca de contexto (Context Switch)',
              text: 'Salvar os registradores do processo atual no PCB e carregar os do próximo. Não faz trabalho útil da aplicação — se o *quantum* do Round-Robin for pequeno demais, a CPU gasta mais tempo trocando do que computando!',
            },
            {
              term: 'FCFS × SJF × Round-Robin',
              text: '**FCFS** (ordem de chegada) sofre do *efeito comboio* (processo longo trava curtos). **SJF** minimiza tempo médio de espera, mas exige prever duração e pode causar *starvation*. **Round-Robin** dá fatias iguais (*quantum*) garantindo responsividade interativa.',
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'so-q1-round-robin-quantum',
          question:
            'No escalonamento **Round-Robin**, o que acontece se você configurar um *quantum* extremamente pequeno (ex.: 50 microssegundos) versus extremamente grande (ex.: 10 segundos)?',
          options: [
            {
              text: 'Quantum pequeno demais explode o overhead de trocas de contexto (CPU desperdiçada); quantum grande demais faz o Round-Robin degenerar em FCFS, deixando aplicativos interativos travados.',
              correct: true,
              feedback:
                'Perfeito! O ajuste do quantum é um trade-off clássico de SO: grande o bastante para diluir o custo da troca de contexto, curto o bastante para manter responsividade.',
            },
            {
              text: 'Quantum pequeno demais elimina totalmente as trocas de contexto.',
              feedback:
                'É exatamente o oposto: quanto menor o quantum, mais vezes o timer interrompe os processos e mais trocas de contexto ocorrem.',
            },
            {
              text: 'Quantum grande demais reduz o tempo de resposta interativo do mouse e teclado.',
              feedback:
                'Se um processo de cálculo pesado segura a CPU por 10 segundos sem preempção, a interface interativa congela esperando sua vez.',
            },
            {
              text: 'O tamanho do quantum não interfere no desempenho porque processos só saem da CPU ao terminar.',
              feedback:
                'Round-Robin é **preemptivo**: o kernel interrompe o processo assim que o quantum expira.',
            },
          ],
        },
      ],
    },
    {
      id: 'memoria-virtual-paginacao-e-concorrencia',
      title:
        'Memória Virtual (Paginação, TLB, Thrashing) e Concorrência (Mutex, Monitores e Deadlock)',
      blocks: [
        {
          type: 'text',
          text: 'A **Memória Virtual** permite que cada processo enxergue um espaço de endereços contínuo e isolado, mesmo que na RAM física suas páginas (blocos típicos de **4 KB**) estejam espalhadas ou temporariamente no *swap* em disco. A **MMU** (Unidade de Gerenciamento de Memória) traduz cada endereço virtual em endereço físico consultando a **Tabela de Páginas** (acelerada pela cache **TLB**).',
        },
        {
          type: 'anatomy',
          caption: 'Tradução de endereço virtual para físico com páginas de 4096 bytes (4 KB)',
          language: 'python',
          parts: [
            {
              text: 'pagina = endereco_virtual // 4096\n',
              label: 'Número da página virtual',
              note: 'Índice usado para consultar na Tabela de Páginas qual moldura (frame) física na RAM guarda esses dados.',
            },
            {
              text: 'deslocamento = endereco_virtual % 4096\n',
              label: 'Offset dentro da página',
              note: 'Permanece idêntico na tradução! Indica qual byte exato (0..4095) acessar dentro da moldura física.',
            },
            {
              text: 'endereco_fisico = tabela_paginas[pagina] * 4096 + deslocamento',
              label: 'Endereço físico final na RAM',
              note: 'A fórmula pressupõe uma página presente e um acesso permitido. Se a tradução ou a permissão impedir o acesso, a CPU gera um page fault para o kernel tratar.',
            },
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Um page fault pode ser resolvido sem acessar o disco',
          text: 'No primeiro acesso a uma região alocada sob demanda, o kernel pode mapear uma página zerada. Em copy-on-write, uma tentativa de escrita pode levar à cópia de uma página já em RAM. Uma página que está no swap pode exigir leitura do armazenamento. Se o acesso for inválido, o Linux pode enviar `SIGSEGV` ao processo.',
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Condição de Corrida, Monitores e as 4 Condições do Deadlock (Coffman)',
          text: 'Quando duas threads fazem `saldo = saldo - 10` simultaneamente sem sincronização (**mutex**, **semáforo** ou **monitor** como `synchronized` em Java), ambas leem o mesmo valor inicial e uma sobrescreve o trabalho da outra (*race condition*). Porém, travar recursos na ordem errada cria **Deadlock**, que só ocorre quando **todas as 4 condições de Coffman** valem juntas: (1) Exclusão Mútua, (2) Posse e Espera (*Hold and Wait*), (3) Não Preempção e (4) **Espera Circular**. Quebrar apenas uma delas (ex.: adquirir locks sempre na mesma ordem crescente de ID) elimina deadlocks por construção!',
        },
        {
          type: 'classify',
          activityId: 'so-c1-sintomas-kernel',
          prompt:
            'Diagnostique cada incidente real de produção segundo o mecanismo de SO envolvido:',
          buckets: [
            'Memória Virtual / Thrashing',
            'Escalonamento / CPU',
            'Concorrência / Deadlock',
          ],
          items: [
            {
              text: 'O servidor tem RAM esgotada, disco em 100% de I/O fazendo swap contínuo e a aplicação quase parou',
              bucket: 0,
            },
            {
              text: 'Thread A segura Lock 1 esperando Lock 2, enquanto Thread B segura Lock 2 esperando Lock 1 para sempre',
              bucket: 2,
            },
            {
              text: 'Dois saques simultâneos de R$ 100 numa conta com R$ 100 passam ambos porque não havia mutex/transação',
              bucket: 2,
            },
            {
              text: 'Um job em lote de 10 minutos bloqueou dezenas de requisições curtas de 5 ms num escalonador não preemptivo',
              bucket: 1,
            },
            {
              text: 'Um processo tentou gravar numa página de memória fora do seu espaço virtual e recebeu `SIGSEGV` (Segmentation Fault)',
              bucket: 0,
            },
            {
              text: 'Milhares de threads acordando ao mesmo tempo fazem o kernel gastar 40% da CPU em trocas de contexto',
              bucket: 1,
            },
          ],
          explanation:
            'Thrashing e SIGSEGV vêm da memória virtual; efeito comboio e excesso de context switch vêm do escalonamento; race conditions e espera circular vêm da concorrência.',
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: inspeção Linux + Round-Robin + Paginação Virtual',
      blocks: [
        {
          type: 'text',
          text: 'Aplique teoria de Sistemas Operacionais diretamente: inspecione processos, memória e logs do kernel no terminal Linux (**Nível 1**), implemente um tradutor de endereços virtuais com detecção de Page Fault (**Nível 2**) e programe um simulador de escalonador Round-Robin calculando turnaround e espera (**Nível 3**).',
        },
        {
          type: 'terminal',
          activityId: 'so-term-n1-inspecao-linux',
          title: 'Nível 1 — Diagnóstico rápido de processos, memória e kernel no Linux',
          task: 'Execute os comandos reais usados em investigação de incidentes de SO num servidor Linux.',
          prompt: 'ops@prod-01:~$',
          intro: 'Sessão de diagnóstico aberta em prod-01 (Ubuntu 24.04 · Linux 6.8).',
          steps: [
            {
              goal: 'Verifique a versão do kernel Linux e arquitetura da máquina com `uname -a`',
              command: ['uname -a'],
              output: 'Linux prod-01 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux',
              hint: 'Digite exatamente: uname -a',
            },
            {
              goal: 'Inspecione o uso de memória RAM, buffers/page cache e swap em formato legível com `free -h`',
              command: ['free -h'],
              output:
                '               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       5.9Gi       210Mi       140Mi       1.7Gi       1.5Gi\nSwap:          2.0Gi       1.4Gi       600Mi',
              hint: 'Use free -h para ver RAM, buff/cache e Swap.',
            },
            {
              goal: 'Liste os processos em execução ordenando pelos maiores consumidores de memória com `ps aux --sort=-%mem`',
              command: ['ps aux --sort=-%mem'],
              output:
                'USER       PID %CPU %MEM    VSZ   RSS STAT START   TIME COMMAND\napp       1842 18.2 52.4 4912000 4180200 Sl  10:12  14:03 java -Xmx4g -jar api.jar\npostgres   912  4.1 19.8 1820400 1580100 Ss  08:00   3:21 postgres: writer',
              hint: 'Digite: ps aux --sort=-%mem',
            },
            {
              goal: 'Verifique no ring buffer do kernel se algum processo foi encerrado pelo OOM Killer com `dmesg | grep -i oom`',
              command: ['dmesg | grep -i oom', 'dmesg | grep -i "oom"'],
              output:
                '[48219.104211] Out of memory: Killed process 1705 (python3) total-vm:2410988kB, anon-rss:1984212kB',
              hint: 'Combine dmesg com grep -i oom usando pipe.',
            },
          ],
        },
        {
          type: 'python',
          activityId: 'so-py-n2-mmu-paginacao',
          title: 'Nível 2 — Simulador da MMU: tradução de endereços virtuais e Page Faults',
          task: 'Implemente `traduzir_enderecos(enderecos_virtuais, tabela_paginas, tam_pagina=4096)`. A tabela mapeia `num_pagina -> frame_fisico`. Neste modelo, uma entrada ausente ou `None` representa uma página ainda sem moldura. O simulador apenas conta essa falha de página. Retorne `{"fisicos": list[int | None], "page_faults": int}` calculando `frame * tam_pagina + offset` quando houver moldura e incluindo `None` para cada falha.',
          code: `def traduzir_enderecos(enderecos_virtuais: list[int], tabela_paginas: dict[int, int | None], tam_pagina: int = 4096) -> dict:
    # TODO: calcular pagina = addr // tam_pagina, offset = addr % tam_pagina e consultar tabela_paginas
    return {"fisicos": [], "page_faults": 0}

tabela = {0: 5, 1: 2, 2: None, 3: 7}
print(traduzir_enderecos([0, 4097, 8200, 12288], tabela))
`,
          solution: `def traduzir_enderecos(enderecos_virtuais: list[int], tabela_paginas: dict[int, int | None], tam_pagina: int = 4096) -> dict:
    fisicos = []
    page_faults = 0
    for addr in enderecos_virtuais:
        pagina = addr // tam_pagina
        offset = addr % tam_pagina
        frame = tabela_paginas.get(pagina)
        if frame is None:
            page_faults += 1
            fisicos.append(None)
        else:
            fisicos.append(frame * tam_pagina + offset)
    return {"fisicos": fisicos, "page_faults": page_faults}

tabela = {0: 5, 1: 2, 2: None, 3: 7}
print(traduzir_enderecos([0, 4097, 8200, 12288], tabela))
`,
          checks: [
            {
              label: 'Traduz endereços presentes corretamente e conta Page Faults',
              test: `traduzir_enderecos([0, 4097, 8200, 12288], {0: 5, 1: 2, 2: None, 3: 7}) == {"fisicos": [20480, 8193, None, 28672], "page_faults": 1}`,
            },
            {
              label:
                'Trata página inexistente na tabela como Page Fault e aceita tamanho de página customizado',
              test: `traduzir_enderecos([250, 9999], {0: 3}, tam_pagina=1024) == {"fisicos": [3322, None], "page_faults": 1}`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'so-py-n3-escalonador-rr',
          title: 'Nível 3 — Escalonador Round-Robin (tempo de conclusão e espera média)',
          task: 'Implemente `simular_round_robin(processos, quantum)` onde `processos` é uma lista de tuplas `(pid, burst)` todos chegando em `t = 0`. A cada turno, o processo da frente da fila roda por `min(restante, quantum)` unidades de tempo; se ainda restar tempo, volta para o fim da fila. Retorne `{"conclusao": {pid: t_fim}, "espera_media": float}` (lembrando que `espera = t_fim - burst` quando chegada é 0).',
          code: `from collections import deque

def simular_round_robin(processos: list[tuple[str, int]], quantum: int) -> dict:
    # TODO: simular fila FIFO com deque e calcular tempo de conclusão e espera média
    return {"conclusao": {}, "espera_media": 0.0}

print(simular_round_robin([("P1", 5), ("P2", 3), ("P3", 1)], quantum=2))
`,
          solution: `from collections import deque

def simular_round_robin(processos: list[tuple[str, int]], quantum: int) -> dict:
    fila = deque([[pid, burst, burst] for pid, burst in processos])
    tempo = 0
    conclusao = {}
    soma_espera = 0

    while fila:
        pid, burst_orig, restante = fila.popleft()
        fatia = min(restante, quantum)
        tempo += fatia
        restante -= fatia
        if restante == 0:
            conclusao[pid] = tempo
            soma_espera += tempo - burst_orig
        else:
            fila.append([pid, burst_orig, restante])

    espera_media = soma_espera / len(processos) if processos else 0.0
    return {"conclusao": conclusao, "espera_media": espera_media}

print(simular_round_robin([("P1", 5), ("P2", 3), ("P3", 1)], quantum=2))
`,
          checks: [
            {
              label: 'Calcula tempos exatos de conclusão para P1(5), P2(3), P3(1) com quantum=2',
              test: `simular_round_robin([("P1", 5), ("P2", 3), ("P3", 1)], quantum=2)["conclusao"] == {"P3": 5, "P2": 8, "P1": 9}`,
            },
            {
              label: 'Calcula corretamente a espera média ((4 + 5 + 4) / 3 == 13/3)',
              test: `abs(simular_round_robin([("P1", 5), ("P2", 3), ("P3", 1)], quantum=2)["espera_media"] - (13 / 3)) < 1e-6`,
            },
            {
              label: 'Funciona quando quantum >= maior burst (equivale a FCFS)',
              test: `simular_round_robin([("A", 4), ("B", 2)], quantum=10) == {"conclusao": {"A": 4, "B": 6}, "espera_media": 2.0}`,
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'A separação User Mode / Kernel Mode protege o sistema; chamadas de sistema (syscalls) são a porta controlada para acessar hardware e arquivos.',
    'Processos isolam memória via PCB e tabela de páginas; threads compartilham heap e exigem sincronização (mutex/monitores) para evitar condições de corrida.',
    'Round-Robin equilibra responsividade e custo de troca de contexto pelo quantum; memória virtual traduz páginas via MMU/TLB e entra em thrashing quando falta RAM.',
    'Quebrar apenas uma das 4 condições de Coffman (como impor ordem global de aquisição de locks) previne deadlocks.',
  ],
  cards: [
    {
      id: 'so-user-vs-kernel',
      front: 'Por que programas comuns rodam em User Mode e precisam de syscalls para ler o disco?',
      back: 'Para isolar e proteger hardware e outros processos: somente o Kernel Mode executa instruções privilegiadas após validar permissões.',
    },
    {
      id: 'so-processo-vs-thread',
      front: 'O que threads do mesmo processo compartilham e o que cada uma tem de exclusivo?',
      back: 'Compartilham espaço de endereçamento (heap, código, arquivos abertos), mas cada thread tem sua própria pilha (stack) e registradores/PC.',
    },
    {
      id: 'so-thrashing',
      front: 'O que é Thrashing em memória virtual?',
      back: 'Quando falta RAM para o conjunto de trabalho ativo e o SO passa quase todo o tempo trocando páginas entre RAM e swap em disco (page faults contínuos), derrubando o throughput.',
    },
    {
      id: 'so-offset-pagina',
      front:
        'Na paginação de memória virtual, o deslocamento (offset) muda na tradução para endereço físico?',
      back: 'Não! Apenas o número da página virtual é substituído pela moldura (frame) física via tabela de páginas; o offset dentro da página permanece idêntico.',
    },
    {
      id: 'so-deadlock-4',
      front: 'Quais são as 4 condições de Coffman necessárias para ocorrer Deadlock?',
      back: 'Exclusão mútua, Posse e Espera (Hold and Wait), Não Preempção e Espera Circular. Impedir qualquer uma delas evita deadlock.',
    },
    {
      id: 'so-monolitico-vs-microkernel',
      front: 'Qual o principal trade-off entre kernel monolítico (Linux) e microkernel (QNX/seL4)?',
      back: 'Monolítico tem menor latência (sem IPC entre drivers e núcleo), enquanto microkernel isola falhas de drivers em user space aumentando tolerância a falhas.',
    },
  ],
  mission: {
    title: 'Observe o escalonador e a memória virtual acontecendo no seu próprio computador',
    text: 'Troque abstração por observação direta no Linux/WSL ou macOS.',
    steps: [
      'Rode `free -h` e explique a diferença entre `free` e `available` (papel do page cache do Linux).',
      'Compare `ps -eLf | wc -l` (total de threads) com `ps -e | wc -l` (total de processos) e identifique qual processo abre mais threads.',
      'Reproduza em Python uma condição de corrida com 2 threads incrementando um contador global sem `threading.Lock` e depois corrija com `Lock`.',
      'Explique em 4 linhas por que adquirir dois locks sempre na ordem `min(id1, id2)` → `max(id1, id2)` impede espera circular.',
    ],
  },
  sources: [
    {
      title: 'Operating Systems: Three Easy Pieces (OSTEP) — Livro gratuito completo',
      url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    },
    {
      title: 'Linux Kernel Docs — Memory Management & OOM Killer',
      url: 'https://www.kernel.org/doc/html/latest/admin-guide/mm/index.html',
    },
    {
      title: 'man7.org — syscalls(2) Linux Programmer’s Manual',
      url: 'https://man7.org/linux/man-pages/man2/syscalls.2.html',
    },
  ],
};
