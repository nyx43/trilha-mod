import { LessonContent } from '../types';

export const content: LessonContent = {
  revision: 2,
  hook: 'Subir um tutorial que funciona no `localhost` é a parte fácil. O trabalho real em desenvolvimento web começa quando o React recebe **CORS bloqueado**, o endpoint Django retorna `500` num campo vazio, a página de catálogo dispara **41 consultas SQL (N+1)** para listar 40 jogos, ou o time precisa decidir se quebra o sistema em microsserviços cedo demais.',
  sections: [
    {
      id: 'arquitetura-mvt-e-fullstack-real',
      title: 'Django MVT + React: como o pedido atravessa do clique até o banco',
      blocks: [
        {
          type: 'text',
          text: 'Nos projetos reais da disciplina (`catalogo-games` e desafios Django), o Django deixa de renderizar HTML no servidor e passa a atuar como **API JSON** (com Django REST Framework ou `JsonResponse`), enquanto o React cuida da experiência interativa no navegador sem recarregar a página. Entender cada camada do padrão **MVT (Model-View-Template/Serializer)** é o mapa que permite isolar qualquer bug em segundos.',
        },
        {
          type: 'flow',
          caption: 'Ciclo real de uma busca no Catálogo de Jogos (React + Django)',
          actors: ['React (Navegador)', 'URLs & Middleware', 'View / Serializer', 'Model / ORM'],
          steps: [
            {
              from: 0,
              to: 1,
              label: 'GET /api/jogos/?genero=RPG&pagina=1',
              text: 'Frontend envia fetch; middleware de CORS valida o cabeçalho Origin antes da View.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 2,
              label: 'Roteamento -> listar_jogos(request)',
              text: 'View valida query params (`pagina >= 1`, limite máximo) e chama o QuerySet filtrado.',
              tone: 'ok',
            },
            {
              from: 2,
              to: 3,
              label: 'Jogo.objects.select_related("estudio")',
              text: 'ORM executa 1 único SQL com JOIN e LIMIT/OFFSET em vez de buscar o estúdio linha por linha.',
              tone: 'ok',
            },
            {
              from: 2,
              to: 0,
              label: '200 OK · JSON paginado',
              text: 'Serializer devolve contrato explícito (`items`, `total`, `pagina`) sem vazar campos sensíveis.',
              tone: 'ok',
            },
          ],
        },
        {
          type: 'terms',
          items: [
            {
              term: 'Model & ORM',
              text: 'Define as tabelas, restrições e relacionamentos em Python. O ORM traduz chamadas como `.filter()` em SQL parametrizado, protegendo contra SQL injection.',
            },
            {
              term: 'View & Serializer',
              text: 'A View controla autenticação, status HTTP e orquestração; o Serializer valida a entrada (nunca confie no frontend!) e formata a saída JSON.',
            },
            {
              term: 'CORS (Cross-Origin Resource Sharing)',
              text: 'Política do navegador que bloqueia respostas de outra origem (ex.: React na `:5173` chamando Django na `:8000`) a menos que o servidor envie `Access-Control-Allow-Origin` explicitamente.',
            },
          ],
        },
      ],
    },
    {
      id: 'capture-the-bug-depuracao-django',
      title: 'Capture the Bug: diagnóstico sistemático de falhas reais em APIs Web',
      blocks: [
        {
          type: 'text',
          text: 'A dinâmica *Capture the Bug* da disciplina reflete o cotidiano de engenharia: receber código existente com bugs sutis que só aparecem em rotas específicas, payloads inválidos ou listas grandes. Em vez de chutar alterações, siga o sintoma até a camada exata.',
        },
        {
          type: 'codeTabs',
          caption: 'Quatro bugs clássicos de Django/API lado a lado com suas correções',
          tabs: [
            {
              label: 'Código com bugs',
              language: 'python',
              code: `# Bug 1: N+1 consultas no banco (1 para jogos + N para cada estudio)
jogos = Jogo.objects.all()
dados = [{"titulo": j.titulo, "estudio": j.estudio.nome} for j in jogos]

# Bug 2: Confiar em int() sem tratar ValueError -> 500 Internal Server Error
pagina = int(request.GET.get("pagina", 1))

# Bug 3: Mutar lista/filtro sem paginação -> devolve 500.000 linhas de uma vez
# Bug 4: Retornar 200 OK com {"erro": "não encontrado"} em vez de 404`,
            },
            {
              label: 'Versão de produção',
              language: 'python',
              code: `# 1. select_related faz JOIN em 1 única consulta SQL
qs = Jogo.objects.select_related("estudio").order_by("id")

# 2. Validação explícita devolvendo 400 Bad Request em entrada inválida
try:
    pagina = max(1, int(request.GET.get("pagina", "1")))
except ValueError:
    return JsonResponse({"erro": "Parâmetro 'pagina' deve ser inteiro"}, status=400)

# 3. Paginação com teto rígido + 4. Status HTTP semântico (404 se recurso não existe)
limite = 20
inicio = (pagina - 1) * limite
itens = qs[inicio : inicio + limite]`,
            },
          ],
        },
        {
          type: 'classify',
          activityId: 'web-c1-diagnostico-bugs',
          prompt:
            'Associe cada sintoma observado no navegador ou nos logs do Django à sua causa raiz real:',
          buckets: [
            'CORS / Configuração HTTP',
            'Contrato e validação (View/Serializer)',
            'ORM / Performance de banco',
            'Estado e renderização no React',
          ],
          items: [
            {
              text: 'O `curl` na porta 8000 funciona com 200 OK, mas o `fetch` vindo de `localhost:5173` falha no console do navegador',
              bucket: 0,
            },
            {
              text: 'Enviar `nota: "dez"` num POST dispara traceback `ValueError` e devolve status 500 em vez de 400',
              bucket: 1,
            },
            {
              text: 'A listagem de 50 jogos abre bem localmente, mas nos logs SQL aparecem 51 `SELECT`s por requisição',
              bucket: 2,
            },
            {
              text: 'Ao clicar em "Adicionar jogo", a página inteira pisca e perde os filtros porque faltou `event.preventDefault()`',
              bucket: 3,
            },
            {
              text: 'A busca por título muta o array original com `jogos.push()` em vez de `setJogos([...jogos, novo])` e a tela não atualiza',
              bucket: 3,
            },
            {
              text: 'Deletar um ID inexistente devolve `200 OK` com lista vazia em vez de `404 Not Found`',
              bucket: 1,
            },
          ],
          explanation:
            'Separar o erro pela camada certa economiza horas: CORS só bloqueia navegadores (nunca `curl`), `ValueError` sem tratamento vira 500, N+1 nasce no ORM sem `select_related`/`prefetch_related`, e mutação direta ou submit sem `preventDefault` quebram o React.',
        },
      ],
    },
    {
      id: 'monolito-vs-microsservicos',
      title: 'Monólito Modular vs. Microsserviços: quando dividir ajuda — e quando destrói',
      blocks: [
        {
          type: 'text',
          text: 'Os slides de arquitetura da disciplina comparam Monólito e Microsserviços. A armadilha mais cara da indústria moderna é achar que microsserviços são automaticamente "melhores". Na vida real, times pequenos que adotam microsserviços cedo demais trocam chamadas de função em nanosegundos por falhas de rede, deploy coordenado e debug distribuído.',
        },
        {
          type: 'table',
          caption: 'Trade-offs reais: Monólito Modular × Microsserviços',
          head: ['Dimensão', 'Monólito Modular (bem estruturado)', 'Microsserviços'],
          rows: [
            [
              'Consistência de dados',
              'Transação ACID simples em 1 banco',
              'Consistência eventual, Sagas, Outbox e compensações',
            ],
            [
              'Latência interna',
              'Chamada de método em memória (~ns)',
              'Rede + serialização JSON/gRPC + retries (~ms)',
            ],
            [
              'Escala de times e deploy',
              'Simples até ~15–30 devs; deploy único rápido',
              'Brilha quando vários squads precisam escalar e publicar independentemente',
            ],
            [
              'Isolamento de carga',
              'Escala a aplicação inteira junto',
              'Permite escalar só o serviço pesado (ex.: processamento de vídeo/PDF)',
            ],
            [
              'Maior risco',
              'Virar "Big Ball of Mud" sem fronteiras de módulos',
              'Virar "Monólito Distribuído" (lento, caro e ainda acoplado)',
            ],
          ],
        },
        {
          type: 'quiz',
          activityId: 'web-q1-monolito-microsservicos',
          question:
            'Uma equipe de 4 desenvolvedores está construindo a v1 de um sistema web de gestão de academia (matrículas, planos, treinos e financeiro) com prazo de 3 meses. Qual decisão arquitetural tem menor risco técnico?',
          options: [
            {
              text: 'Começar com um **Monólito Modular** (módulos isolados por domínio como `matriculas`, `financeiro`, `treinos` com contratos claros) e só extrair um serviço separado se surgir gargalo real de escala ou autonomia de times.',
              correct: true,
              feedback:
                'Decisão madura de engenharia! Um monólito modular entrega velocidade, transações ACID simples e depuração direta, mantendo fronteiras limpas caso um módulo precise virar serviço no futuro.',
            },
            {
              text: 'Criar 8 microsserviços separados desde o dia 1 com 8 bancos diferentes para garantir "arquitetura profissional".',
              feedback:
                'Com 4 pessoas e domínio ainda mudando, 8 microsserviços consomem o prazo inteiro em infraestrutura, observabilidade distribuída e sincronização de contratos.',
            },
            {
              text: 'Criar 6 microsserviços, mas todos lendo e escrevendo diretamente nas mesmas tabelas do mesmo banco de dados.',
              feedback:
                'Esse é o antipadrão clássico de **monólito distribuído**: você paga todo o custo de rede e deploy separado sem ganhar independência de dados.',
            },
            {
              text: 'Colocar toda a lógica de regras de negócio no frontend React para eliminar o backend.',
              feedback:
                'O navegador é ambiente não confiável: regras de cobrança, permissões e integridade precisam estar protegidas no servidor.',
            },
          ],
        },
      ],
    },
    {
      id: 'continuidade-seguranca-e-observabilidade',
      title: 'Continuidade: o que falta para levar React + Django para produção real',
      blocks: [
        {
          type: 'text',
          text: 'Além de conectar CRUDs entre React e Django, quatro práticas fecham a ponte entre um trabalho de faculdade e um produto de produção:',
        },
        {
          type: 'cards',
          columns: 2,
          items: [
            {
              label: '1 · Validação dupla',
              title: 'UX no React, autoridade no servidor',
              text: 'Validar no formulário dá feedback instantâneo, mas qualquer pessoa pode chamar sua API via `curl`. O backend SEMPRE valida tipos, limites e permissões.',
            },
            {
              label: '2 · Logs estruturados e Correlation ID',
              title: 'Rastrear um erro do clique até o SQL',
              text: 'Gerar um `X-Request-Id` por requisição permite cruzar o erro que apareceu no navegador com a linha exata de log no Django e no banco.',
            },
            {
              label: '3 · Estados reais de tela',
              title: 'Carregando, sucesso, vazio e erro',
              text: 'Toda integração assíncrona tem quatro estados visíveis — nunca deixe o usuário olhando uma lista em branco sem saber se está carregando ou se a API caiu.',
            },
            {
              label: '4 · Fronteira de dados (DTO/Serializer)',
              title: 'Nunca serializar `SELECT *` cegamente',
              text: 'Whitelist explícita de campos impede vazamento acidental de `password_hash`, tokens internos ou flags administrativas (`is_staff`).',
            },
          ],
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: depuração de API, catálogo React sem reload e arquitetura',
      blocks: [
        {
          type: 'text',
          text: 'Pratique nos dois lados do full-stack: corrija validação, paginação e filtro de uma view estilo Django em Python (**Nível 1**), construa o filtro + cadastro sem reload no Catálogo de Jogos em React (**Nível 2**) e estruture a investigação de um bug de produção (**Nível 3**).',
        },
        {
          type: 'python',
          activityId: 'web-py-n1-view-catalogo',
          title: 'Nível 1 — Capture the Bug na View de API (filtro, paginação e status HTTP)',
          task: 'Implemente `listar_jogos_api(jogos, params)` simulando uma view Django/DRF segura. Regras: (1) se `pagina` ou `limite` não forem inteiros >= 1, retorne `(400, {"erro": ...})`; (2) trave `limite` em no máximo `20`; (3) se `genero` for informado (não vazio), filtre case-insensitive; (4) ordene por `titulo` crescente e retorne `(200, {"total": total_filtrado, "pagina": pagina, "limite": limite, "items": fatia})`.',
          code: `def listar_jogos_api(jogos: list[dict], params: dict) -> tuple[int, dict]:
    # Buggy starter: não valida params, não limita paginação e não filtra direito
    return 200, {"total": len(jogos), "pagina": 1, "limite": 50, "items": jogos}

catalogo = [
    {"id": 1, "titulo": "Zelda", "genero": "Aventura"},
    {"id": 2, "titulo": "Baldur's Gate", "genero": "RPG"},
    {"id": 3, "titulo": "Chrono Trigger", "genero": "RPG"},
]
print(listar_jogos_api(catalogo, {"genero": "rpg", "pagina": "1", "limite": "1"}))
`,
          solution: `def listar_jogos_api(jogos: list[dict], params: dict) -> tuple[int, dict]:
    try:
        pagina = int(params.get("pagina", 1))
        limite = int(params.get("limite", 10))
    except (ValueError, TypeError):
        return 400, {"erro": "pagina e limite devem ser inteiros"}
    if pagina < 1 or limite < 1:
        return 400, {"erro": "pagina e limite devem ser >= 1"}
    limite = min(limite, 20)
    genero = str(params.get("genero", "")).strip().lower()
    filtrados = [
        j for j in jogos
        if not genero or j["genero"].lower() == genero
    ]
    filtrados.sort(key=lambda j: j["titulo"].lower())
    inicio = (pagina - 1) * limite
    fatia = filtrados[inicio : inicio + limite]
    return 200, {
        "total": len(filtrados),
        "pagina": pagina,
        "limite": limite,
        "items": fatia,
    }

catalogo = [
    {"id": 1, "titulo": "Zelda", "genero": "Aventura"},
    {"id": 2, "titulo": "Baldur's Gate", "genero": "RPG"},
    {"id": 3, "titulo": "Chrono Trigger", "genero": "RPG"},
]
print(listar_jogos_api(catalogo, {"genero": "rpg", "pagina": "1", "limite": "1"}))
`,
          checks: [
            {
              label: 'Filtra gênero case-insensitive, ordena por título e pagina corretamente',
              test: `(lambda st, body: st == 200 and body["total"] == 2 and [x["titulo"] for x in body["items"]] == ["Baldur's Gate"])(*listar_jogos_api([{"id": 1, "titulo": "Zelda", "genero": "Aventura"}, {"id": 2, "titulo": "Chrono Trigger", "genero": "RPG"}, {"id": 3, "titulo": "Baldur's Gate", "genero": "RPG"}], {"genero": "rpg", "pagina": "1", "limite": "1"}))`,
            },
            {
              label: 'Devolve status 400 para página não numérica ou <= 0',
              test: `listar_jogos_api([], {"pagina": "abc"})[0] == 400 and listar_jogos_api([], {"pagina": "0"})[0] == 400`,
            },
            {
              label: 'Aplica teto máximo de 20 itens por página mesmo se pedirem 500',
              test: `listar_jogos_api([{"id": i, "titulo": f"G{i:02d}", "genero": "Indi"} for i in range(30)], {"limite": "500"})[1]["limite"] == 20 and len(listar_jogos_api([{"id": i, "titulo": f"G{i:02d}", "genero": "Indi"} for i in range(30)], {"limite": "500"})[1]["items"]) == 20`,
            },
          ],
        },
        {
          type: 'playground',
          activityId: 'web-pg-n2-catalogo-react-formulario',
          title: 'Nível 2 — Catálogo de Jogos em React (filtro + cadastro imutável sem reload)',
          task: 'Complete o componente `CatalogoJogos`: (1) o input de busca filtra os jogos por título (case-insensitive); (2) o formulário adiciona um novo jogo sem recarregar a página (`preventDefault`), ignorando título vazio; (3) mostre a contagem exata de jogos exibidos no elemento `#contador`.',
          framework: 'react',
          height: 280,
          html: `<div id="root"></div>`,
          css: `body { font-family: system-ui, sans-serif; padding: 14px; background: #0f172a; color: #e2e8f0; }
input, button { padding: 6px 10px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #f8fafc; margin-right: 6px; }
button { background: #2563eb; border-color: #2563eb; cursor: pointer; }
ul { padding-left: 18px; margin-top: 12px; }
li { margin: 4px 0; }`,
          js: `const iniciais = [
  { id: 1, titulo: "Hollow Knight" },
  { id: 2, titulo: "Hades" },
  { id: 3, titulo: "Celeste" },
];

function CatalogoJogos() {
  const [jogos, setJogos] = React.useState(iniciais);
  const [busca, setBusca] = React.useState("");
  const [novoTitulo, setNovoTitulo] = React.useState("");

  // TODO: derive a lista filtrada a partir de jogos e busca
  const visiveis = jogos;

  function adicionar(event) {
    // TODO: evite reload e adicione um novo jogo de forma imutável se houver texto
  }

  return (
    <main>
      <input
        id="busca"
        placeholder="Filtrar por título..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      <form onSubmit={adicionar} style={{ marginTop: 8 }}>
        <input
          id="novo"
          placeholder="Novo jogo..."
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
        />
        <button type="submit">Adicionar</button>
      </form>
      <p id="contador">{visiveis.length} jogos</p>
      <ul>
        {visiveis.map((j) => <li key={j.id}>{j.titulo}</li>)}
      </ul>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CatalogoJogos />);`,
          solution: {
            js: `const iniciais = [
  { id: 1, titulo: "Hollow Knight" },
  { id: 2, titulo: "Hades" },
  { id: 3, titulo: "Celeste" },
];

function CatalogoJogos() {
  const [jogos, setJogos] = React.useState(iniciais);
  const [busca, setBusca] = React.useState("");
  const [novoTitulo, setNovoTitulo] = React.useState("");

  const termo = busca.trim().toLowerCase();
  const visiveis = jogos.filter((j) => j.titulo.toLowerCase().includes(termo));

  function adicionar(event) {
    event.preventDefault();
    const titulo = novoTitulo.trim();
    if (!titulo) return;
    setJogos((prev) => [...prev, { id: Date.now(), titulo }]);
    setNovoTitulo("");
  }

  return (
    <main>
      <input
        id="busca"
        placeholder="Filtrar por título..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      <form onSubmit={adicionar} style={{ marginTop: 8 }}>
        <input
          id="novo"
          placeholder="Novo jogo..."
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
        />
        <button type="submit">Adicionar</button>
      </form>
      <p id="contador">{visiveis.length} jogos</p>
      <ul>
        {visiveis.map((j) => <li key={j.id}>{j.titulo}</li>)}
      </ul>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CatalogoJogos />);`,
          },
          checks: [
            {
              label: 'Mostra 3 jogos no início e 1 jogo ao filtrar por "HAD"',
              test: `await new Promise(resolve => setTimeout(resolve, 350));
                const input = document.getElementById('busca');
                const contador = document.getElementById('contador');
                if (!input || !contador) return false;
                const contagem = () => Number(contador.textContent.match(/\\d+/)?.[0]);
                if (document.querySelectorAll('li').length !== 3 || contagem() !== 3) return false;
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                ReactDOM.flushSync(() => {
                  setter.call(input, 'HAD');
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                });
                const itens = document.querySelectorAll('li');
                return itens.length === 1 && itens[0].textContent.trim() === 'Hades' && contagem() === 1;`,
            },
            {
              label: 'Ignora título em branco, cadastra um título válido e cancela o envio padrão',
              test: `await new Promise(resolve => setTimeout(resolve, 350));
                const root = document.getElementById('root');
                const busca = document.getElementById('busca');
                const novo = document.getElementById('novo');
                const form = novo?.form;
                const contador = document.getElementById('contador');
                if (!root || !busca || !novo || !form || !contador) return false;
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                function preencher(input, valor) {
                  ReactDOM.flushSync(() => {
                    setter.call(input, valor);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  });
                }
                function enviar(titulo) {
                  preencher(novo, titulo);
                  let cancelado = false;
                  // O React trata o envio na raiz antes do bloqueio da prévia no document.
                  root.addEventListener('submit', event => {
                    cancelado = event.defaultPrevented;
                  }, { once: true });
                  ReactDOM.flushSync(() => {
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                  });
                  return cancelado;
                }
                const titulos = () => Array.from(document.querySelectorAll('li'), el => el.textContent.trim());
                preencher(busca, '');
                if (!enviar('   ') || titulos().length !== 3) return false;
                if (!enviar('Chrono Trigger')) return false;
                const exibidos = titulos();
                return exibidos.length === 4 && exibidos.includes('Chrono Trigger') &&
                  Number(contador.textContent.match(/\\d+/)?.[0]) === 4;`,
            },
          ],
        },
        {
          type: 'order',
          activityId: 'web-ord-n3-investigacao-incidente',
          prompt:
            'Nível 3 (Protocolo de Depuração): Um usuário relata que o botão "Salvar jogo" não funciona em produção. Ordene a sequência mais disciplinada de investigação:',
          items: [
            'Reproduzir a ação com a aba Network aberta e anotar método, URL, payload enviado e status HTTP retornado',
            'Confirmar se o erro ocorre antes do servidor (CORS/JS) ou dentro do backend (4xx/5xx com X-Request-Id)',
            'Ler o traceback ou log SQL correspondente no servidor para isolar a causa raiz exata',
            'Escrever um teste automatizado que reproduz o bug (falhando antes da correção)',
            'Aplicar a correção mínima na camada correta e confirmar o teste e o fluxo ponta a ponta passando',
          ],
          explanation:
            'Depurar sem abrir o Network leva a chutar correções no lugar errado. Isolar fronteira cliente vs. servidor, ler evidência real e travar o bug com um teste de regressão evita que ele volte no próximo deploy.',
        },
      ],
    },
  ],
  recap: [
    'Em arquiteturas React + Django, o backend é a autoridade de validação, segurança, status HTTP e persistência; o frontend cuida de estado reativo e UX.',
    'Erros de produção se dividem por camadas claras: CORS no middleware/navegador, validação 400 na view/serializer, N+1 no ORM (`select_related`/`prefetch_related`) e imutabilidade no React.',
    'Monólito modular bem organizado costuma vencer microsserviços em times pequenos porque evita latência de rede, consistência distribuída e custo operacional prematuro.',
    'Depuração profissional sempre parte de evidência reproduzível (Network + logs) e termina com teste de regressão.',
  ],
  cards: [
    {
      id: 'web-cors-curl',
      front:
        'Por que um endpoint funciona no `curl` ou Postman, mas falha no navegador com erro de CORS?',
      back: 'Porque CORS é uma política de segurança aplicada pelo navegador para requisições cross-origin. O servidor precisa responder com os cabeçalhos `Access-Control-Allow-Origin` permitidos.',
    },
    {
      id: 'web-n-mais-1',
      front: 'O que é o problema N+1 no Django ORM e como resolvê-lo?',
      back: 'Ocorre quando 1 query busca N registros e um loop dispara mais N queries extras para cada relação. Resolve-se com `select_related()` (ForeignKey/OneToOne) ou `prefetch_related()` (ManyToMany/reverso).',
    },
    {
      id: 'web-validacao-dupla',
      front:
        'Se o formulário React já valida os campos, por que o Django precisa validar tudo de novo?',
      back: 'Porque qualquer pessoa pode enviar requisições HTTP diretamente para a API sem usar seu frontend. Só a validação no servidor protege integridade e segurança.',
    },
    {
      id: 'web-monolito-modular',
      front: 'Qual a vantagem de começar por um Monólito Modular em vez de microsserviços?',
      back: 'Entrega mais rápida, transações ACID simples em um banco, debug local direto e baixo custo operacional — preservando fronteiras limpas para extrair serviços só quando houver necessidade real.',
    },
    {
      id: 'web-monolito-distribuido',
      front: 'O que caracteriza o antipadrão "monólito distribuído"?',
      back: 'Dividir a aplicação em vários serviços que ainda compartilham o mesmo banco ou exigem deploys sincronizados — somando o custo da rede sem ganhar autonomia.',
    },
    {
      id: 'web-status-400-vs-500',
      front: 'Quando uma API deve retornar 400 vs. 500?',
      back: '400 (Bad Request) quando o cliente enviou dados inválidos ou malformados; 500 (Internal Server Error) apenas para falhas inesperadas do servidor.',
    },
  ],
  mission: {
    title: 'Audite um projeto full-stack React + Django (ou Node) em busca de 4 defeitos',
    text: 'Use o checklist de produção desta aula para inspecionar um projeto real de API + frontend (como o `catalogo-games` da disciplina).',
    steps: [
      'Envie parâmetros inválidos (`pagina=abc`, `limite=99999`, payload vazio) via `curl` e verifique se a API retorna 400 em vez de 500.',
      'Inspecione as consultas SQL executadas na rota de listagem e elimine qualquer padrão N+1.',
      'Teste a interface desligando o backend e confirme se a tela exibe mensagem clara de erro (e não fica travada em branco).',
      'Escreva um parágrafo de ADR (Architecture Decision Record) justificando por que esse projeto deve permanecer monólito modular agora e qual métrica justificaria extrair um serviço no futuro.',
    ],
  },
  sources: [
    {
      title: 'Django Docs — Making queries, select_related e prefetch_related',
      url: 'https://docs.djangoproject.com/en/stable/ref/models/querysets/#select-related',
    },
    {
      title: 'MDN — Cross-Origin Resource Sharing (CORS)',
      url: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS',
    },
    {
      title: 'Martin Fowler — MonolithFirst',
      url: 'https://martinfowler.com/bliki/MonolithFirst.html',
    },
  ],
};
