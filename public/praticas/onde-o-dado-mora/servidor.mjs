import http from 'node:http';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 4174;
const HOST = process.env.HOST || '127.0.0.1';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'biblioteca-pratica.sqlite');

const startedAt = new Date().toISOString();
const mode = process.argv[2];
if (mode && mode !== 'livros' && mode !== 'reservas') {
  console.error('Uso: node servidor.mjs [livros|reservas]');
  process.exit(1);
}

// 3) Memória do processo da API: começa sempre do estado inicial quando o processo sobe.
const livrosEmMemoria = [
  { id: 1, titulo: 'Dom Casmurro', autor: 'Machado de Assis' },
];
let proximoIdMemoria = 2;

// 4) Banco SQLite em arquivo: sobrevive entre reinícios do processo Node.
const db = mode ? undefined : new DatabaseSync(DB_PATH);
db?.exec(`
  CREATE TABLE IF NOT EXISTS livros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    autor TEXT NOT NULL
  );
`);

const contagemInicial = db?.prepare('SELECT COUNT(*) AS total FROM livros').get();
if (contagemInicial && Number(contagemInicial.total) === 0) {
  const inserirInicial = db.prepare('INSERT INTO livros (titulo, autor) VALUES (?, ?)');
  inserirInicial.run('Dom Casmurro', 'Machado de Assis');
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 64 * 1024) {
        reject(new Error('Corpo muito grande'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function validateLivro(payload) {
  const titulo = typeof payload?.titulo === 'string' ? payload.titulo.trim() : '';
  const autor = typeof payload?.autor === 'string' ? payload.autor.trim() : '';
  if (!titulo || !autor) {
    return { error: 'titulo e autor são obrigatórios' };
  }
  return { titulo, autor };
}

const styles = `
  <style>
    :root {
      color-scheme: light;
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #cbd5e1;
      --text: #0f172a;
      --muted: #475569;
      --accent: #1d4ed8;
      --accent-soft: #eff6ff;
      --warn: #b45309;
      --warn-soft: #fffbeb;
      --ok: #15803d;
      --ok-soft: #f0fdf4;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }
    h1, h2, h3 { margin-top: 0; }
    .sub { color: var(--muted); max-width: 72ch; }
    .box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 18px;
    }
    .grid-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      align-items: end;
    }
    label { display: block; font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    input[type="text"] {
      width: 100%;
      padding: 9px 11px;
      border: 1px solid #94a3b8;
      border-radius: 8px;
      font-size: 15px;
    }
    input[type="text"]:focus, button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    button {
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid transparent;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
    }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-secondary { background: #fff; color: var(--text); border-color: #94a3b8; }
    .panels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
    }
    .panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .tag {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      width: fit-content;
    }
    .tag-volatile { background: var(--warn-soft); color: var(--warn); }
    .tag-origin { background: var(--accent-soft); color: var(--accent); }
    .tag-disk { background: var(--ok-soft); color: var(--ok); }
    .meta { font-size: 13px; color: var(--muted); margin: 0; }
    ul { margin: 4px 0 0; padding-left: 18px; }
    li { margin-bottom: 4px; font-size: 14px; }
    code {
      background: #e2e8f0;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 13px;
    }
    .predict-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
      margin-top: 8px;
    }
    .predict-item {
      border: 1px dashed #94a3b8;
      border-radius: 8px;
      padding: 10px;
      font-size: 14px;
    }
    .status-line {
      font-size: 14px;
      padding: 8px 10px;
      border-radius: 8px;
      background: #f1f5f9;
      margin-top: 10px;
    }
  </style>`;

const htmlPage = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Prática: Onde o dado mora — Recarga e Reinício</title>
  ${styles}
</head>
<body>
  <main>
    <h1>Onde o dado mora — Prática de Recarga e Reinício</h1>
    <p class="sub">
      Cadastre um livro nos quatro lugares ao mesmo tempo, faça sua previsão antes e depois teste:
      (1) apertar <strong>F5 / Ctrl+R</strong> para recarregar a página e (2) parar este servidor com
      <code>Ctrl+C</code> e iniciá-lo novamente no terminal.
    </p>

    <section class="box" aria-labelledby="sec-previsao">
      <h2 id="sec-previsao">1. Previsão antes de executar</h2>
      <p class="meta">Marque o que você prevê que vai <strong>sobreviver</strong> antes de apertar F5 ou reiniciar a API:</p>
      <div class="predict-grid">
        <label class="predict-item"><input type="checkbox" id="prev-f5-pagina" /> Memória da página sobrevive ao F5?</label>
        <label class="predict-item"><input type="checkbox" id="prev-f5-ls" /> localStorage sobrevive ao F5?</label>
        <label class="predict-item"><input type="checkbox" id="prev-reinicio-api" /> Memória da API sobrevive ao reinício do servidor?</label>
        <label class="predict-item"><input type="checkbox" id="prev-reinicio-sqlite" /> Arquivo SQLite sobrevive ao reinício do servidor?</label>
      </div>
    </section>

    <section class="box" aria-labelledby="sec-cadastro">
      <h2 id="sec-cadastro">2. Cadastrar livro nos 4 lugares</h2>
      <form id="form-livro">
        <div class="grid-form">
          <div>
            <label for="titulo">Título do livro</label>
            <input id="titulo" type="text" value="Quarto de Despejo" required />
          </div>
          <div>
            <label for="autor">Autor(a)</label>
            <input id="autor" type="text" value="Carolina Maria de Jesus" required />
          </div>
        </div>
        <div class="actions">
          <button type="submit" class="btn-primary">Cadastrar nos 4 lugares</button>
          <button type="button" id="btn-recarregar" class="btn-secondary">Recarregar página (F5 simulado)</button>
          <button type="button" id="btn-atualizar-api" class="btn-secondary">Consultar APIs (GET) novamente</button>
          <button type="button" id="btn-limpar-ls" class="btn-secondary">Limpar só o localStorage desta prática</button>
        </div>
      </form>
      <p id="mensagem" class="status-line" role="status" aria-live="polite">
        Origem atual: <code id="origem-atual"></code> · PID atual da API: <code id="pid-atual">carregando...</code>
      </p>
    </section>

    <section aria-labelledby="sec-lugares">
      <h2 id="sec-lugares">3. Observe cada lugar</h2>
      <div class="panels">
        <article class="panel">
          <span class="tag tag-volatile">Some no F5</span>
          <h3>1. Memória da página</h3>
          <p class="meta"><code>window.livrosNaPagina</code></p>
          <ul id="lista-pagina"></ul>
        </article>

        <article class="panel">
          <span class="tag tag-origin">Por origem no navegador</span>
          <h3>2. localStorage</h3>
          <p class="meta">Chave <code>curso-web:pratica-livros</code></p>
          <ul id="lista-localstorage"></ul>
        </article>

        <article class="panel">
          <span class="tag tag-volatile">Some ao reiniciar API</span>
          <h3>3. Memória da API</h3>
          <p class="meta"><code>GET/POST /api/memoria</code></p>
          <ul id="lista-api-memoria"></ul>
        </article>

        <article class="panel">
          <span class="tag tag-disk">Sobrevive a tudo</span>
          <h3>4. Arquivo SQLite</h3>
          <p class="meta"><code>GET/POST /api/arquivo</code></p>
          <ul id="lista-api-arquivo"></ul>
        </article>
      </div>
    </section>
  </main>

  <script>
    const LS_KEY = 'curso-web:pratica-livros';

    // 1) Memória da página: recriada do zero a cada F5.
    window.livrosNaPagina = [
      { id: 1, titulo: 'Dom Casmurro', autor: 'Machado de Assis' }
    ];

    function lerLocalStorage() {
      try {
        const bruto = localStorage.getItem(LS_KEY);
        if (!bruto) {
          const inicial = [{ id: 1, titulo: 'Dom Casmurro', autor: 'Machado de Assis' }];
          localStorage.setItem(LS_KEY, JSON.stringify(inicial));
          return inicial;
        }
        return JSON.parse(bruto);
      } catch (erro) {
        return [{ id: 0, titulo: 'Erro: ' + erro.name, autor: 'Storage indisponível' }];
      }
    }

    function gravarLocalStorage(titulo, autor) {
      const lista = lerLocalStorage();
      lista.push({ id: lista.length + 1, titulo, autor });
      localStorage.setItem(LS_KEY, JSON.stringify(lista));
    }

    function renderLista(elId, livros) {
      const ul = document.getElementById(elId);
      ul.replaceChildren();
      for (const l of livros) {
        const li = document.createElement('li');
        li.textContent = '#' + l.id + ' — ' + l.titulo + ' (' + l.autor + ')';
        ul.appendChild(li);
      }
    }

    async function carregarApis() {
      const [resMem, resArq] = await Promise.all([
        fetch('/api/memoria', { cache: 'no-store' }),
        fetch('/api/arquivo', { cache: 'no-store' }),
      ]);
      const dadosMem = await resMem.json();
      const dadosArq = await resArq.json();
      document.getElementById('pid-atual').textContent = String(dadosArq.pid);
      renderLista('lista-api-memoria', dadosMem.livros);
      renderLista('lista-api-arquivo', dadosArq.livros);
    }

    function atualizarTela() {
      document.getElementById('origem-atual').textContent = window.location.origin;
      renderLista('lista-pagina', window.livrosNaPagina);
      renderLista('lista-localstorage', lerLocalStorage());
      return carregarApis();
    }

    document.getElementById('form-livro').addEventListener('submit', async (event) => {
      event.preventDefault();
      const titulo = document.getElementById('titulo').value.trim();
      const autor = document.getElementById('autor').value.trim();
      if (!titulo || !autor) return;

      // 1) Memória da página
      window.livrosNaPagina.push({ id: window.livrosNaPagina.length + 1, titulo, autor });

      // 2) localStorage
      gravarLocalStorage(titulo, autor);

      // 3) e 4) API em memória e API em arquivo SQLite
      const payload = JSON.stringify({ titulo, autor });
      const [r1, r2] = await Promise.all([
        fetch('/api/memoria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        }),
        fetch('/api/arquivo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        }),
      ]);

      await atualizarTela();
      document.getElementById('mensagem').innerHTML =
        'Gravado nos 4 lugares! Status API memória: <code>' + r1.status +
        '</code> · Status API SQLite: <code>' + r2.status +
        '</code> · Origem: <code>' + window.location.origin + '</code>';
    });

    document.getElementById('btn-recarregar').addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('btn-atualizar-api').addEventListener('click', () => {
      carregarApis();
    });

    document.getElementById('btn-limpar-ls').addEventListener('click', () => {
      localStorage.removeItem(LS_KEY);
      renderLista('lista-localstorage', lerLocalStorage());
    });

    atualizarTela();
  </script>
</body>
</html>
`;

const reservations = mode === 'reservas';
const records = [];
const reservationsDb = reservations
  ? new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'reservas-pratica.sqlite'))
  : undefined;
reservationsDb?.exec(`
  CREATE TABLE IF NOT EXISTS reservas (
    id TEXT PRIMARY KEY,
    referencia TEXT NOT NULL
  );
`);
const endpoint = reservations ? '/api/reservas' : '/api/livros';
const challengeTitle = reservations ? 'Serviço de reservas' : 'Catálogo de livros';
const challengePage = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${challengeTitle}</title>
  ${styles}
  <style>pre { overflow-wrap: anywhere; white-space: pre-wrap; }</style>
</head>
<body>
  <main>
    <h1>${challengeTitle}</h1>
    <section class="box">
      <form id="cadastro">
        <label for="referencia">${reservations ? 'Referência da reserva' : 'Título do livro'}</label>
        <input id="referencia" type="text" maxlength="160" required />
        <div class="actions">
          <button type="submit" class="btn-primary">Cadastrar (POST)</button>
          <button type="button" id="consultar" class="btn-secondary">Consultar registros (GET)</button>
        </div>
      </form>
      <p class="meta">Processo da API nesta abertura da página: PID ${process.pid} · ${startedAt}</p>
    </section>
    <section class="box" aria-labelledby="respostas">
      <h2 id="respostas">Respostas da API</h2>
      <div aria-live="polite" id="saida">Execute uma ação para ver a resposta.</div>
    </section>
  </main>
  <script>
    const saida = document.getElementById('saida');
    const botoes = document.querySelectorAll('button');

    async function executar(method, body) {
      for (const botao of botoes) botao.disabled = true;
      try {
        const response = await fetch('${endpoint}', {
          method,
          cache: 'no-store',
          ...(body && {
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
          }),
        });
        const data = await response.json();
        mostrar(method + ' ${endpoint} · ' + response.status + '\\n' +
          'PID ' + response.headers.get('X-Pratica-Pid') + ' · ' +
          response.headers.get('X-Pratica-Inicio') + '\\n' + JSON.stringify(data, null, 2));
      } catch {
        mostrar('A API não respondeu. Confira se o serviço está rodando e tente novamente.');
      } finally {
        for (const botao of botoes) botao.disabled = false;
      }
    }

    function mostrar(texto) {
      const resposta = document.createElement('pre');
      resposta.textContent = texto;
      if (!saida.querySelector('pre')) saida.replaceChildren();
      saida.prepend(resposta);
    }

    document.getElementById('cadastro').addEventListener('submit', (event) => {
      event.preventDefault();
      executar('POST', { referencia: document.getElementById('referencia').value });
    });
    document.getElementById('consultar').addEventListener('click', () => executar('GET'));
  </script>
</body>
</html>`;

async function serveChallenge(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(challengePage);
    return;
  }
  if (pathname !== endpoint) {
    sendJson(res, 404, { message: 'Rota não encontrada' });
    return;
  }
  res.setHeader('X-Pratica-Pid', process.pid);
  res.setHeader('X-Pratica-Inicio', startedAt);
  if (req.method === 'GET') {
    sendJson(res, 200, reservationsDb
      ? reservationsDb.prepare('SELECT id, referencia FROM reservas ORDER BY rowid').all()
      : records);
    return;
  }
  if (req.method === 'POST') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { message: 'Envie um corpo JSON válido.' });
      return;
    }
    const referencia = typeof body?.referencia === 'string' ? body.referencia.trim() : '';
    if (!referencia || referencia.length > 160) {
      sendJson(res, 400, { message: 'Informe uma referência de 1 a 160 caracteres.' });
      return;
    }
    const record = { id: randomUUID(), referencia };
    try {
      if (reservationsDb) {
        reservationsDb.prepare('INSERT INTO reservas (id, referencia) VALUES (?, ?)')
          .run(record.id, record.referencia);
      } else {
        records.push(record);
      }
    } catch {
      sendJson(res, 500, { message: 'O serviço não conseguiu guardar o registro.' });
      return;
    }
    sendJson(res, 201, record);
    return;
  }
  res.setHeader('Allow', 'GET, POST');
  sendJson(res, 405, { message: 'Método não permitido' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (mode) {
    await serveChallenge(req, res, url.pathname);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(htmlPage);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/memoria') {
    sendJson(res, 200, {
      lugar: 'memoria-processo-api',
      pid: process.pid,
      startedAt,
      livros: livrosEmMemoria,
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/memoria') {
    try {
      const body = await readJsonBody(req);
      const valid = validateLivro(body);
      if (valid.error) {
        sendJson(res, 400, { message: valid.error });
        return;
      }
      const novo = { id: proximoIdMemoria++, titulo: valid.titulo, autor: valid.autor };
      livrosEmMemoria.push(novo);
      sendJson(res, 201, novo);
    } catch (err) {
      sendJson(res, 400, { message: err.message });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/arquivo') {
    const livros = db.prepare('SELECT id, titulo, autor FROM livros ORDER BY id').all();
    sendJson(res, 200, {
      lugar: 'arquivo-sqlite',
      pid: process.pid,
      startedAt,
      dbFile: path.basename(DB_PATH),
      livros,
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/arquivo') {
    try {
      const body = await readJsonBody(req);
      const valid = validateLivro(body);
      if (valid.error) {
        sendJson(res, 400, { message: valid.error });
        return;
      }
      const info = db
        .prepare('INSERT INTO livros (titulo, autor) VALUES (?, ?)')
        .run(valid.titulo, valid.autor);
      const criado = db
        .prepare('SELECT id, titulo, autor FROM livros WHERE id = ?')
        .get(info.lastInsertRowid);
      sendJson(res, 201, criado);
    } catch (err) {
      sendJson(res, 400, { message: err.message });
    }
    return;
  }

  sendJson(res, 404, { message: 'Rota não encontrada' });
});

server.listen(PORT, HOST, () => {
  console.log(`${mode ? challengeTitle : 'Prática "Onde o dado mora"'} rodando em http://${HOST}:${PORT}`);
  console.log(`PID do processo Node: ${process.pid}`);
  if (!mode) console.log(`Banco SQLite em arquivo: ${DB_PATH}`);
});
