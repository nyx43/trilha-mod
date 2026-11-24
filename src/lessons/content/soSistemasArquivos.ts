import { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Você já tentou copiar um backup de 5 GB para um pendrive de 64 GB e recebeu *"arquivo grande demais"* mesmo com 50 GB livres? Ou perdeu um banco inteiro após uma queda de energia — ou descobriu meses depois que uma foto antiga corrompeu silenciosamente no HD (*bit-rot*)? Tudo isso é decidido por uma camada invisível: o **Sistema de Arquivos**.',
  sections: [
    {
      id: 'inodes-diretorios-e-links',
      title: 'Como um arquivo existe no disco: Inodes, Diretórios e Hard vs. Symbolic Links',
      blocks: [
        {
          type: 'text',
          text: 'No Unix/Linux, um **diretório** NÃO guarda os dados dos arquivos dentro dele — ele é apenas uma tabela ligando **nome legível → número de inode**. Quem guarda os metadados reais (tamanho, dono, permissões, timestamps e ponteiros para os blocos de dados no SSD/HD) é o **inode**.',
        },
        {
          type: 'flow',
          caption: 'Como o kernel resolve o caminho `/home/ana/dados.csv` até os blocos no SSD',
          actors: [
            'Caminho "/home/ana/dados.csv"',
            'Diretórios (Nome -> Inode)',
            'Tabela de Inodes',
            'Blocos de Dados (SSD)',
          ],
          steps: [
            {
              from: 0,
              to: 1,
              label: 'Percorre `/` -> `home` -> `ana`',
              text: 'Cada diretório traduz o nome do próximo componente para o número de inode correspondente.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 2,
              label: '`dados.csv` -> inode #48210',
              text: 'O inode #48210 armazena permissões (`rw-r--r--`), tamanho, contagem de links e mapa de extents/blocos.',
              tone: 'ok',
            },
            {
              from: 2,
              to: 3,
              label: 'Lê blocos 9100..9104',
              text: 'O driver lê os blocos físicos reais (ou retorna instantaneamente do Page Cache em RAM).',
              tone: 'ok',
            },
          ],
        },
        {
          type: 'terms',
          items: [
            {
              term: 'Hard Link (`ln origem destino`)',
              text: 'Cria um **segundo nome apontando para o MESMO inode**. Apagar o nome original NÃO apaga os dados — o arquivo só some do disco quando o contador de links chega a 0 (e nenhum processo o mantém aberto). Não cruza partições.',
            },
            {
              term: 'Symbolic Link / Symlink (`ln -s origem destino`)',
              text: 'É um arquivo especial com **seu próprio inode** cujo conteúdo é apenas o caminho textual do destino. Pode cruzar partições e apontar para diretórios, mas vira um *link quebrado* se a origem for apagada.',
            },
            {
              term: 'Journaling vs. Copy-on-Write (CoW)',
              text: '**Journaling** (ext4, NTFS) registra a intenção de escrita num log sequencial antes de alterar os metadados, garantindo recuperação rápida após queda de energia. **Copy-on-Write** (APFS, Btrfs, ZFS) **nunca sobrescreve blocos no lugar**: grava novos blocos e atualiza o ponteiro raiz atomicamente — habilitando **snapshots instantâneos**!',
            },
          ],
        },
      ],
    },
    {
      id: 'comparacao-completa-6-sistemas',
      title: 'Análise Comparativa Técnica: NTFS × ext4 × FAT32/exFAT × APFS × Btrfs × ZFS',
      blocks: [
        {
          type: 'text',
          text: 'A tarefa central de Sistemas Operacionais 26.2 pede a comparação entre **NTFS, ext4, FAT32/exFAT, APFS, Btrfs e ZFS**. Em vez de decorar nomes soltos, compare os 6 pela arquitetura de confiabilidade, limites reais, recursos avançados e cenário ideal de produção:',
        },
        {
          type: 'table',
          caption: 'Matriz definitiva de engenharia dos 6 sistemas de arquivos',
          head: [
            'Sistema',
            'SO Principal',
            'Confiabilidade / Modelo',
            'Limite arquivo / recursos-chave',
            'Onde usar na prática',
          ],
          rows: [
            [
              '**FAT32 / exFAT**',
              'Universal (Windows, Linux, macOS, câmeras, TVs)',
              'Sem journaling nem permissões POSIX (vulnerável a corrupção em remoção abrupta)',
              'FAT32: teto de **4 GB** por arquivo! exFAT: até 16 EB, sem limite de 4 GB',
              'Pendrives, cartões SD e troca de arquivos entre sistemas diferentes (prefira **exFAT** a FAT32)',
            ],
            [
              '**NTFS**',
              'Windows (suporte nativo no Linux moderno)',
              'Journaling de metadados (USN Journal)',
              'ACLs granulares, compressão, criptografia (EFS/BitLocker), Shadow Copies (VSS)',
              'Desktops e servidores Windows, partições de jogos/dados compartilhadas com Windows',
            ],
            [
              '**ext4**',
              'Linux (padrão clássico de servidores e desktops)',
              'Journaling maduro e muito rápido (extents reduzem fragmentação)',
              'Arquivos até 16 TiB, extremamente estável e baixo overhead; **sem** snapshots nativos nem checksums de dados',
              'Servidores Linux gerais, bancos de dados (PostgreSQL), VPS e desktops Linux confiáveis',
            ],
            [
              '**APFS**',
              'macOS / iOS / iPadOS (otimizado para SSD/NVMe)',
              'Copy-on-Write (CoW) de metadados + crash protection',
              'Clones instantâneos (space sharing), snapshots rápidos (Time Machine), criptografia nativa por arquivo',
              'Todo ecossistema Apple em SSDs modernos',
            ],
            [
              '**Btrfs**',
              'Linux (padrão no Fedora/openSUSE)',
              'Copy-on-Write (CoW) completo + **checksums** de dados e metadados',
              'Subvolumes, snapshots instantâneos, compressão transparente (`zstd`), detecção de *bit-rot* (RAID5/6 ainda exige cautela)',
              'Desktops Linux com rollback de atualizações (Timeshift/Snapper) e servidores Linux precisando de snapshots + compressão',
            ],
            [
              '**ZFS**',
              'FreeBSD / TrueNAS / Linux (OpenZFS)',
              'CoW ponta a ponta + checksums + **auto-cura (self-healing)** com RAID-Z',
              'Snapshots/replicação incremental (`zfs send`), compressão, cache ARC em RAM, proteção máxima contra *bit-rot*; consome mais RAM',
              'Servidores de armazenamento (NAS), backups críticos, data centers e ambientes onde integridade de dados é inegociável',
            ],
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Por que ZFS e Btrfs detectam "bit-rot" e ext4/NTFS não?',
          text: '**Bit-rot** é a corrupção silenciosa de bits num HD ou SSD ao longo dos anos sem o disco reportar erro de hardware. `ext4` e `NTFS` fazem checksum apenas de metadados/journal, então entregam o arquivo corrompido sem perceber. **ZFS** e **Btrfs** guardam um checksum de cada bloco de dados na árvore pai — se 1 único bit mudar, o sistema detecta na leitura (e o ZFS com redundância RAID-Z/mirror **repara o bloco automaticamente** na hora!).',
        },
      ],
    },
    {
      id: 'decisoes-e-armadilhas-reais',
      title: 'Armadilhas reais: 4 GB do FAT32, fragmentação de CoW em bancos e perda de inodes',
      blocks: [
        {
          type: 'text',
          text: 'Nenhum sistema de arquivos é "o melhor em tudo". Veja três surpresas reais que pegam engenheiros desprevenidos em produção:',
        },
        {
          type: 'cards',
          columns: 3,
          items: [
            {
              label: 'Armadilha 1 · FAT32',
              title: 'O teto invisível de 4 GiB - 1 byte',
              text: 'O campo de tamanho de arquivo do FAT32 tem 32 bits (`2³² - 1` bytes ≈ 4 GB). Imagens ISO, backups e vídeos 4K falham ao copiar mesmo com 100 GB livres — troque para **exFAT**.',
            },
            {
              label: 'Armadilha 2 · Inodes esgotados',
              title: '"No space left on device" com 40% de disco livre!',
              text: 'No `ext4`, a quantidade de inodes é definida na formatação. Milhões de arquivos minúsculos de cache ou sessão podem esgotar 100% dos inodes (`df -i`) mesmo sobrando gigabytes de espaço (`df -h`)!',
            },
            {
              label: 'Armadilha 3 · CoW + Banco intenso',
              title: 'Write amplification em bancos sobre CoW sem ajuste',
              text: 'Bancos como PostgreSQL fazem muitas escritas aleatórias pequenas; em Btrfs/ZFS sem alinhamento de `recordsize` (ou `nodatacow`), o Copy-on-Write pode fragmentar arquivos e degradar IOPS.',
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'fs-q1-disco-cheio-inodes',
          question:
            'Um servidor Linux rodando `ext4` começou a falhar gravações com erro `ENOSPC: No space left on device`. Você roda `df -h` e vê que o disco está apenas **58% ocupado** (42 GB livres!). Qual comando revela imediatamente a segunda causa mais provável desse incidente?',
          options: [
            {
              text: '`df -i` — para verificar se 100% dos **inodes** da partição foram esgotados por milhões de arquivos pequenos (como sessões, logs ou cache sem limpeza).',
              correct: true,
              feedback:
                'Clássico de produção! No `ext4`, cada arquivo consome 1 inode de uma tabela finita. Esgotar inodes impede criar até um arquivo de 0 bytes mesmo com dezenas de GB livres.',
            },
            {
              text: '`chmod 777 /` — porque falta permissão de escrita na partição.',
              feedback:
                'Falta de permissão retorna `EACCES` (Permission denied), nunca `ENOSPC` (No space left on device) — e `chmod 777 /` destruiria a segurança do servidor.',
            },
            {
              text: 'Formatar o servidor em FAT32 porque FAT32 não tem limite de tamanho de arquivo.',
              feedback:
                'FAT32 tem limite rígido de 4 GB por arquivo, não tem journaling nem permissões Unix — seria um desastre num servidor Linux.',
            },
            {
              text: 'Reiniciar a CPU porque o erro `ENOSPC` indica falta de registradores.',
              feedback:
                '`ENOSPC` é erro do subsistema de sistema de arquivos (espaço ou inodes esgotados), não de registradores da CPU.',
            },
          ],
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title:
        'Prática progressiva: terminal Linux de FS + motor de decisão NTFS/ext4/exFAT/APFS/Btrfs/ZFS',
      blocks: [
        {
          type: 'text',
          text: 'Valide seu domínio nos três níveis: inspecione montagens, inodes e links no terminal Linux (**Nível 1**), classifique cenários técnicos entre os 6 sistemas de arquivos (**Nível 2**) e implemente um motor de recomendação técnica em Python com justificativas objetivas (**Nível 3**).',
        },
        {
          type: 'terminal',
          activityId: 'fs-term-n1-inodes-links',
          title: 'Nível 1 — Inspecionando sistemas de arquivos, inodes e links no Linux',
          task: 'Execute os comandos para inspecionar partições, esgotamento de inodes e comprovar na prática a diferença de inode entre hard link e symlink.',
          prompt: 'eng@storage-01:~/lab$',
          intro: 'Diretório ~/lab contém o arquivo relatorio.txt (inode 524290).',
          steps: [
            {
              goal: 'Veja o tipo de sistema de arquivos (`-T`) e espaço em formato legível (`-h`) das partições montadas com `df -Th`',
              command: ['df -Th', 'df -hT'],
              output:
                'Filesystem     Type   Size  Used Avail Use% Mounted on\n/dev/nvme0n1p2 ext4   100G   58G   37G  62% /\ntank/backups   zfs    4.0T  1.8T  2.2T  45% /mnt/backups',
              hint: 'Digite: df -Th',
            },
            {
              goal: 'Verifique a utilização de **inodes** de cada sistema de arquivos com `df -i`',
              command: ['df -i'],
              output:
                'Filesystem       Inodes   IUsed   IFree IUse% Mounted on\n/dev/nvme0n1p2  6553600 6553600       0  100% /\ntank/backups   46120000    9420 46110580    1% /mnt/backups',
              hint: 'Digite: df -i (note 100% de IUse% na raiz /!)',
            },
            {
              goal: 'Crie um **link simbólico** chamado `atalho.txt` apontando para `relatorio.txt` com `ln -s relatorio.txt atalho.txt`',
              command: ['ln -s relatorio.txt atalho.txt'],
              output: '',
              hint: 'Use: ln -s relatorio.txt atalho.txt',
            },
            {
              goal: 'Liste os arquivos mostrando o **número de inode** (`-i`) e detalhes (`-l`) com `ls -li`',
              command: ['ls -li', 'ls -il'],
              output:
                '524290 -rw-r--r-- 2 eng eng 4096 Nov 23 10:00 copia_hard.txt\n524290 -rw-r--r-- 2 eng eng 4096 Nov 23 10:00 relatorio.txt\n524299 lrwxrwxrwx 1 eng eng   13 Nov 23 10:05 atalho.txt -> relatorio.txt',
              hint: 'Digite: ls -li (observe que copia_hard.txt compartilha o inode 524290, enquanto atalho.txt tem inode próprio 524299!)',
            },
          ],
        },
        {
          type: 'classify',
          activityId: 'fs-c1-n2-escolha-sistema',
          prompt:
            'Nível 2 — Escolha o sistema de arquivos mais adequado para cada cenário real de engenharia:',
          buckets: ['exFAT', 'NTFS', 'ext4', 'APFS', 'Btrfs', 'ZFS'],
          items: [
            {
              text: 'HD externo usado para mover vídeos 4K de 18 GB entre Windows, Linux e macOS',
              bucket: 0,
            },
            {
              text: 'Servidor NAS corporativo com 48 TB de backups críticos exigindo auto-cura contra bit-rot e RAID-Z',
              bucket: 5,
            },
            {
              text: 'Partição principal de um servidor Ubuntu rodando PostgreSQL com foco em estabilidade e baixo overhead',
              bucket: 2,
            },
            {
              text: 'MacBook Pro com SSD NVMe precisando de clones instantâneos e criptografia nativa da Apple',
              bucket: 3,
            },
            {
              text: 'Desktop Linux Fedora precisando de snapshots automáticos antes de cada atualização de pacotes + compressão zstd',
              bucket: 4,
            },
            {
              text: 'Servidor Windows Server com permissões granulares via ACLs e integração Active Directory',
              bucket: 1,
            },
          ],
          explanation:
            'Cada sistema de arquivos nasceu para um conjunto de restrições: exFAT para portabilidade >4 GB, NTFS para ecossistema Windows/ACLs, ext4 para estabilidade Linux, APFS para Apple/SSD, Btrfs para snapshots/compressão nativos no Linux e ZFS para integridade máxima e self-healing em storage.',
        },
        {
          type: 'python',
          activityId: 'fs-py-n3-motor-decisao-fs',
          title: 'Nível 3 — Motor de decisão técnica de Sistemas de Arquivos',
          task: 'Implemente `recomendar_fs(req: dict) -> str` que recebe um dicionário com chaves booleanas/string (`multi_so`, `arquivo_maior_4gb`, `so`, `precisa_self_healing`, `precisa_snapshots_linux`, `ram_gb`) e retorna exatamente um dos nomes `"ZFS"`, `"Btrfs"`, `"APFS"`, `"NTFS"`, `"exFAT"`, `"FAT32"`, `"ext4"` segundo as regras de prioridade: (1) se `multi_so` for True → `"exFAT"` se `arquivo_maior_4gb` for True, senão `"FAT32"`; (2) se `precisa_self_healing` for True e `ram_gb >= 8` → `"ZFS"`; (3) se `so == "macos"` → `"APFS"`; (4) se `so == "windows"` → `"NTFS"`; (5) se `so == "linux"` e `precisa_snapshots_linux` for True → `"Btrfs"`; (6) caso contrário → `"ext4"`.',
          code: `def recomendar_fs(req: dict) -> str:
    # TODO: aplicar a árvore de decisão técnica na ordem de prioridade definida
    return "ext4"

print(recomendar_fs({"multi_so": True, "arquivo_maior_4gb": True, "so": "linux", "precisa_self_healing": False, "precisa_snapshots_linux": False, "ram_gb": 16}))
`,
          solution: `def recomendar_fs(req: dict) -> str:
    if req.get("multi_so"):
        return "exFAT" if req.get("arquivo_maior_4gb") else "FAT32"
    if req.get("precisa_self_healing") and req.get("ram_gb", 0) >= 8:
        return "ZFS"
    so = str(req.get("so", "")).lower()
    if so == "macos":
        return "APFS"
    if so == "windows":
        return "NTFS"
    if so == "linux" and req.get("precisa_snapshots_linux"):
        return "Btrfs"
    return "ext4"

print(recomendar_fs({"multi_so": True, "arquivo_maior_4gb": True, "so": "linux", "precisa_self_healing": False, "precisa_snapshots_linux": False, "ram_gb": 16}))
`,
          checks: [
            {
              label: 'Escolhe exFAT para mídia multi-SO com arquivos > 4 GB e FAT32 quando <= 4 GB',
              test: `recomendar_fs({"multi_so": True, "arquivo_maior_4gb": True}) == "exFAT" and recomendar_fs({"multi_so": True, "arquivo_maior_4gb": False}) == "FAT32"`,
            },
            {
              label:
                'Escolhe ZFS para self-healing com RAM >= 8 GB, mas faz fallback seguro se RAM < 8 GB',
              test: `recomendar_fs({"so": "linux", "precisa_self_healing": True, "ram_gb": 16}) == "ZFS" and recomendar_fs({"so": "linux", "precisa_self_healing": True, "precisa_snapshots_linux": True, "ram_gb": 4}) == "Btrfs"`,
            },
            {
              label: 'Mapeia corretamente APFS, NTFS, Btrfs e ext4 nos cenários específicos',
              test: `recomendar_fs({"so": "macos"}) == "APFS" and recomendar_fs({"so": "windows"}) == "NTFS" and recomendar_fs({"so": "linux", "precisa_snapshots_linux": False}) == "ext4"`,
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'fs-q2-n3-hardlink-delete',
          question:
            'Nível 3 (Inodes em Produção): Um serviço de logs em Linux mantém o arquivo `/var/log/app.log` (40 GB) aberto. Um operador roda `rm /var/log/app.log` para liberar disco, mas `df -h` continua mostrando o disco **100% cheio**. Por quê?',
          options: [
            {
              text: '`rm` apenas remove o nome do diretório (reduzindo a contagem de links do inode para 0), mas o kernel só libera os blocos físicos do disco quando o último processo que mantém o descritor de arquivo aberto fechar o arquivo (ou for recarregado/reiniciado).',
              correct: true,
              feedback:
                'Fenômeno clássico de Unix/Linux! Você confirma isso com `lsof +L1` (arquivos deletados ainda abertos). Em produção, para esvaziar sem derrubar o serviço, usa-se `truncate -s 0 /var/log/app.log` ou `logrotate` com `copytruncate`/sinal `SIGHUP`.',
            },
            {
              text: 'Porque `rm` move o arquivo para a Lixeira oculta do ext4 por 30 dias.',
              feedback:
                'No terminal Unix, `rm` chama `unlink()` diretamente e não usa Lixeira gráfica.',
            },
            {
              text: 'Porque `ext4` é Copy-on-Write e mantém snapshots permanentes de tudo que é apagado.',
              feedback: '`ext4` não é Copy-on-Write nem possui snapshots nativos.',
            },
            {
              text: 'Porque `df -h` só atualiza seus valores após reiniciar o servidor.',
              feedback:
                '`df -h` lê o estado real do sistema de arquivos em tempo real — os blocos realmente ainda estão alocados enquanto o processo segura o file descriptor!',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'No Unix/Linux, diretórios mapeiam nomes para números de inode; o inode guarda permissões, metadados, contagem de links e ponteiros para os blocos de dados.',
    'Journaling (ext4, NTFS) protege metadados contra quedas de energia; Copy-on-Write (APFS, Btrfs, ZFS) grava em blocos novos habilitando snapshots instantâneos.',
    'ZFS e Btrfs adicionam checksums de dados para detectar corrupção silenciosa (bit-rot); o ZFS vai além com auto-cura em arranjos redundantes.',
    'Escolher o sistema de arquivos certo depende do cenário: exFAT (portabilidade > 4 GB), NTFS (Windows), ext4 (Linux clássico/bancos), APFS (Apple/SSD), Btrfs (snapshots Linux) e ZFS (storage crítico).',
  ],
  cards: [
    {
      id: 'fs-inode',
      front: 'Qual a função do inode num sistema de arquivos Unix/Linux?',
      back: 'Guardar todos os metadados do arquivo (permissões, dono, tamanho, timestamps, contagem de links e localização dos blocos de dados) — tudo, exceto o nome, que fica no diretório.',
    },
    {
      id: 'fs-hard-vs-symlink',
      front:
        'Qual a diferença entre Hard Link e Symbolic Link quando você apaga o arquivo original?',
      back: 'O Hard Link compartilha o mesmo inode e continua intacto com os dados; o Symlink aponta apenas para o caminho textual e vira um link quebrado.',
    },
    {
      id: 'fs-fat32-vs-exfat',
      front:
        'Por que escolher exFAT em vez de FAT32 para um pendrive ou HD externo multiplataforma?',
      back: 'Porque FAT32 bloqueia arquivos maiores que 4 GB (2³² - 1 bytes), enquanto exFAT suporta arquivos gigantes mantendo compatibilidade entre Windows, Linux e macOS.',
    },
    {
      id: 'fs-journaling-vs-cow',
      front:
        'Qual a diferença fundamental entre Journaling (ext4/NTFS) e Copy-on-Write (APFS/Btrfs/ZFS)?',
      back: 'Journaling grava a intenção em um log antes de atualizar no lugar; Copy-on-Write grava novos blocos sem sobrescrever os antigos e troca o ponteiro raiz atomicamente, permitindo snapshots instantâneos.',
    },
    {
      id: 'fs-bitrot-zfs',
      front: 'O que é bit-rot e como o ZFS o combate?',
      back: 'É a corrupção silenciosa de dados no disco sem erro reportado pelo hardware. O ZFS armazena checksums ponta a ponta e, com redundância (mirror/RAID-Z), repara o bloco automaticamente na leitura.',
    },
    {
      id: 'fs-enospc-inodes',
      front:
        'Como um servidor Linux pode dar "No space left on device" com 40% de espaço livre em `df -h`?',
      back: 'Esgotamento de inodes (`df -i` em 100%) por excesso de arquivos pequenos, ou arquivos gigantes apagados ainda mantidos abertos por processos (`lsof +L1`).',
    },
  ],
  mission: {
    title:
      'Produza a Matriz Comparativa de Sistemas de Arquivos (tarefa 26.2 elevada ao nível sênior)',
    text: 'Construa uma análise comparativa completa cobrindo NTFS, ext4, FAT32/exFAT, APFS, Btrfs e ZFS pronta para consulta em prova e em entrevistas de infraestrutura.',
    steps: [
      'Compare os 6 sistemas em 6 eixos: modelo (Journaling/CoW/sem journal), limite de arquivo, snapshots, detecção de bit-rot, permissões/ACLs e sobrecarga de RAM.',
      'Inspecione no seu próprio sistema operacional qual sistema de arquivos está montado em cada partição (`df -Th` no Linux/macOS ou `fsutil fsinfo volumeinfo C:` no Windows).',
      'Escreva 3 estudos de caso justificados: (a) pendrive multiplataforma para ISOs de 8 GB; (b) servidor Linux com PostgreSQL; (c) NAS de backups de longo prazo.',
      'Explique como recuperar espaço de um log de 20 GB que foi apagado com `rm` mas continuava aberto pelo processo da aplicação.',
    ],
  },
  sources: [
    {
      title: 'Operating Systems: Three Easy Pieces — File Systems & Crash Consistency',
      url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    },
    {
      title: 'OpenZFS Documentation — Concepts, Checksums & Snapshots',
      url: 'https://openzfs.github.io/openzfs-docs/',
    },
    {
      title: 'Linux Kernel Docs — ext4 & Btrfs Filesystem Documentation',
      url: 'https://www.kernel.org/doc/html/latest/filesystems/index.html',
    },
  ],
};
