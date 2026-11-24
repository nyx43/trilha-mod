import type { LessonContent, LessonMeta } from '../types';

export const meta: Omit<LessonMeta, 'load'> = {
  id: 'onde-o-dado-mora',
  title: 'Onde o dado mora',
  summary:
    'Onde cada dado vive no navegador e no servidor: memória da página, localStorage, memória da API e arquivo SQLite — com previsão, passo a passo e teste de recarga e reinício.',
  minutes: 28,
  groupIds: ['curriculum.internet-e-http'],
  objectives: [
    'Distinguir memória da página, localStorage, memória do processo da API e armazenamento em arquivo',
    'Demonstrar no navegador a diferença entre dado temporário e persistente por origem',
    'Explicar o que são banco de dados, tabela, linha, coluna, chave primária e SQLite',
    'Prever e verificar o que sobrevive ao recarregar a página, fechar o navegador e reiniciar a API',
  ],
  updatedAt: '2026-11-16',
};

export const content: LessonContent = {
  hook: 'Você cadastra um livro no catálogo, ele aparece bonito na tela — aí você aperta `F5` para recarregar a página e ele desaparece. Ou pior: ele sobrevive ao `F5`, mas some assim que o servidor da API reinicia. **“Está na tela” não é o mesmo que “está salvo”.** Cada dado mora em um lugar diferente, e cada lugar tem um tempo de vida próprio. Nesta aula você vai aprender a prever, testar e provar onde o dado realmente mora sem depender de chute ou de IA.',
  sections: [
    {
      id: 'quatro-lugares',
      title: 'Quatro lugares, quatro tempos de vida',
      blocks: [
        {
          type: 'reveal',
          question:
            'Previsão antes de começar: você cadastrou o livro *Dom Casmurro* em uma aplicação web e ele apareceu na lista da tela. Isso garante que o livro continuará lá se você recarregar a página ou reiniciar a API?',
          answer:
            'Não garante. Ver um item na tela só prova que ele está visível **agora** no navegador. Ele pode estar apenas na memória da aba (some no `F5`), no `localStorage` do seu navegador (some se você trocar de computador ou perfil), na memória RAM do processo da API (some quando a API reinicia) ou gravado em um arquivo de banco no disco (sobrevive a tudo isso).',
        },
        {
          type: 'analogy',
          title: 'Quatro lugares na mesma livraria',
          text: 'Imagine um catálogo de livros em uma livraria. **Memória da página** é um rascunho no quadro branco da mesa: fechou ou recarregou a aba, o quadro é apagado. **`localStorage`** é um bloquinho pessoal na sua gaveta, etiquetado com o endereço do site: continua lá quando você volta, mas só existe naquele navegador e naquela origem. **Memória da API** é a cabeça do atendente no servidor: vários clientes consultam e o dado aguenta você recarregar sua aba, mas some se o atendente reiniciar o turno (reiniciar o processo). **Arquivo SQLite** (`biblioteca.sqlite`) é o livro de registros no disco: aguenta recarga da aba, fechamento do navegador e reinício da API.',
        },
        {
          type: 'terms',
          items: [
            {
              term: 'Memória da página',
              text: 'Dados que o JavaScript do navegador guarda enquanto aquela aba/página está aberta, como variáveis globais ou estado da interface. Toda recarga cria uma memória nova e vazia.',
            },
            {
              term: 'localStorage',
              text: 'Armazenamento em texto (pares chave-valor) mantido pelo navegador e isolado por **origem** (`scheme + host + porta`). Sobrevive a recarregar a página e fechar a aba ou o navegador no mesmo perfil.',
            },
            {
              term: 'Processo',
              text: 'Um programa em execução, como o servidor Node.js da API. Ele tem memória RAM própria que existe apenas enquanto o programa está rodando.',
            },
            {
              term: 'Persistência',
              text: 'Capacidade de o dado continuar existindo depois que a página recarrega ou o processo que o criou termina.',
            },
          ],
        },
        {
          type: 'table',
          caption: 'Quatro lugares, quatro tempos de vida no catálogo de livros',
          head: [
            'Lugar',
            'Exemplo',
            'Recarregar a página (F5)',
            'Fechar o navegador',
            'Reiniciar a API',
            'Outra pessoa vê?',
          ],
          rows: [
            [
              '**Memória da página**',
              '`window.cursoWebCorTemporaria` ou `let livros = []` no frontend',
              'Perde',
              'Perde',
              'Não se aplica',
              'Não',
            ],
            [
              '**`localStorage`**',
              'Chave `curso-web:cor` no navegador',
              'Mantém',
              'Mantém (no mesmo perfil e origem)',
              'Não se aplica',
              'Não (fica só naquele navegador/perfil)',
            ],
            [
              '**Memória do processo da API**',
              '`const livros = []` no `server.js`',
              'Mantém',
              'Mantém',
              'Perde',
              'Sim, se acessar a mesma API',
            ],
            [
              '**Armazenamento em arquivo (SQLite)**',
              'Arquivo `biblioteca.sqlite` no disco',
              'Mantém',
              'Mantém',
              'Mantém',
              'Sim, via API',
            ],
          ],
        },
        {
          type: 'callout',
          tone: 'note',
          title: 'HTTP não guarda memória sozinho',
          text: 'O protocolo HTTP é **sem estado** (*stateless*): cada requisição é um pedido novo, e o protocolo não lembra automaticamente o que aconteceu na requisição anterior. Quando uma aplicação lembra seus livros, seu carrinho ou seu login, isso acontece porque o código guardou o dado em um desses lugares — não porque o HTTP “lembrou”.',
        },
        {
          type: 'classify',
          activityId: 'quatro-lugares:5',
          prompt: 'Classifique cada situação de acordo com o lugar onde o dado está morando.',
          buckets: ['Memória da página', 'localStorage', 'Memória da API', 'Arquivo (SQLite)'],
          items: [
            {
              text: 'Uma variável `let filtroAtual = "romance"` criada pelo JavaScript da página; some ao apertar `F5`.',
              bucket: 0,
            },
            {
              text: 'Um tema escuro salvo no navegador com `setItem("tema", "escuro")` que continua ativo ao reabrir o site no dia seguinte.',
              bucket: 1,
            },
            {
              text: 'Um array `const livros = []` dentro do `server.js`: sobrevive quando o aluno recarrega o navegador, mas zera quando o servidor reinicia.',
              bucket: 2,
            },
            {
              text: 'Linhas gravadas em `biblioteca.sqlite`: continuam existindo depois de derrubar e subir o servidor novamente.',
              bucket: 3,
            },
            {
              text: 'Um valor guardado em `window.cursoWebCorTemporaria` no Console das DevTools.',
              bucket: 0,
            },
            {
              text: 'Preferência salva só para a origem `http://localhost:5173`, que volta `null` se você abrir `http://127.0.0.1:5173`.',
              bucket: 1,
            },
            {
              text: 'Dados mantidos em RAM por uma API Node que ainda não foi ligada a nenhum arquivo ou banco.',
              bucket: 2,
            },
            {
              text: 'Registros da tabela `livros` gravados no disco pelo Sequelize.',
              bucket: 3,
            },
          ],
          explanation:
            'A pergunta-chave é sempre **quem segura o dado** e **o que acontece quando cada programa reinicia**. Recarregar a aba reinicia a página; reiniciar o servidor reinicia o processo da API; gravar em arquivo no disco atravessa os dois.',
        },
      ],
    },
    {
      id: 'navegador-memoria-vs-localstorage',
      title: 'No navegador: memória da página versus localStorage',
      blocks: [
        {
          type: 'text',
          text: 'Vamos comparar os dois lugares que moram dentro do **navegador**: a memória da página e o `localStorage`. Antes de rodar qualquer comando, escreva sua previsão — uma previsão errada seguida de evidência ensina mais do que copiar uma resposta pronta.',
        },
        {
          type: 'reveal',
          question:
            'Previsão antes de executar: no Console de `https://example.com`, você grava `window.cursoWebCorTemporaria = "azul"` e `localStorage.setItem("curso-web:cor", "verde")`. Em seguida você recarrega a página (`Ctrl + R` / `F5`) e lê os dois valores. O que cada leitura vai devolver?',
          answer:
            '`window.cursoWebCorTemporaria` devolve `undefined`, porque recarregar a aba destrói o contexto JavaScript anterior e cria uma memória da página nova. Já `localStorage.getItem("curso-web:cor")` devolve `"verde"`, porque o `localStorage` pertence ao armazenamento do navegador para aquela origem (`https://example.com`), não à instância momentânea da aba.',
        },
        {
          type: 'trace',
          caption:
            'Acompanhe passo a passo o estado da memória da página e do localStorage antes e depois de recarregar a aba.',
          code: 'window.cursoWebCorTemporaria = "azul";\nlocalStorage.setItem("curso-web:cor", "verde");\nconsole.log(window.cursoWebCorTemporaria);\nconsole.log(localStorage.getItem("curso-web:cor"));\n// --- Usuário recarrega a página (F5) ---\nconsole.log(window.cursoWebCorTemporaria);\nconsole.log(localStorage.getItem("curso-web:cor"));\nlocalStorage.removeItem("curso-web:cor");\nconsole.log(localStorage.getItem("curso-web:cor"));',
          steps: [
            {
              line: 1,
              note: 'Cria uma propriedade na memória da página atual. Só existe enquanto esta aba não recarregar nem fechar.',
              memory: [
                ['window.cursoWebCorTemporaria', '"azul"'],
                ['localStorage["curso-web:cor"]', '(não existe)'],
              ],
            },
            {
              line: 2,
              note: 'Grava a string `"verde"` no `localStorage` da origem atual.',
              memory: [
                ['window.cursoWebCorTemporaria', '"azul"'],
                ['localStorage["curso-web:cor"]', '"verde"'],
              ],
            },
            {
              line: 3,
              note: 'Lê a memória da página antes da recarga.',
              output: '"azul"',
            },
            {
              line: 4,
              note: 'Lê o `localStorage` antes da recarga.',
              output: '"verde"',
            },
            {
              line: 5,
              note: 'A recarga (`F5`) descarta o objeto `window` anterior e inicia uma página limpa. O `localStorage` da origem permanece intacto.',
              memory: [
                ['window.cursoWebCorTemporaria', 'undefined'],
                ['localStorage["curso-web:cor"]', '"verde"'],
              ],
            },
            {
              line: 6,
              note: 'Após recarregar, a propriedade temporária na memória da página sumiu.',
              output: 'undefined',
            },
            {
              line: 7,
              note: 'Após recarregar, a chave gravada no `localStorage` continua lá.',
              output: '"verde"',
            },
            {
              line: 8,
              note: '`removeItem` apaga apenas a chave do experimento, sem limpar o resto do site.',
              memory: [
                ['window.cursoWebCorTemporaria', 'undefined'],
                ['localStorage["curso-web:cor"]', 'null (removida)'],
              ],
            },
            {
              line: 9,
              note: 'Ler uma chave inexistente ou removida no `localStorage` devolve `null`, não `undefined`.',
              output: 'null',
            },
          ],
        },
        {
          type: 'steps',
          items: [
            {
              title: '1. Anote sua previsão e abra o Console',
              text: 'Abra `https://example.com` (ou uma página local servida por HTTP) em um perfil normal do navegador. Anote a origem da barra de endereço e escreva no caderno o que espera ver após recarregar. Abra as DevTools (`F12` ou `Ctrl + Shift + I`; no macOS, `Cmd + Option + I`) e selecione a aba **Console**.',
            },
            {
              title: '2. Teste a memória da página (temporária)',
              text: 'Digite uma linha por vez e aperte Enter. Se o navegador bloquear colagem (aviso contra *self-XSS*), digite manualmente. Veja `"azul"` na leitura, depois recarregue a página (`Ctrl + R`) e rode **apenas a segunda linha**: o retorno vira `undefined`.',
              code: 'window.cursoWebCorTemporaria = "azul"\nwindow.cursoWebCorTemporaria',
            },
            {
              title: '3. Teste o localStorage (persistente no navegador)',
              text: 'Grave e leia a chave abaixo. Recarregue a página e rode apenas o `getItem`: continua `"verde"`. Agora **feche a aba**, abra a mesma URL no mesmo perfil e rode o `getItem` de novo: o valor `"verde"` continua lá.',
              code: 'localStorage.setItem("curso-web:cor", "verde")\nlocalStorage.getItem("curso-web:cor")',
            },
            {
              title: '4. Limpe somente a chave do experimento',
              text: 'Remova a chave criada e confirme que a leitura devolve `null`. Evite `localStorage.clear()` em sites reais para não apagar dados da própria página.',
              code: 'localStorage.removeItem("curso-web:cor")\nlocalStorage.getItem("curso-web:cor")',
            },
            {
              title: 'Plano B (se aparecer SecurityError ou sem computador)',
              text: 'Se o Console mostrar `SecurityError`, confirme que a página está aberta via `http://` ou `https://` (não em `file://` ou frame isolado com armazenamento bloqueado). Sem navegador disponível, faça no papel: um rascunho que você amassa ao recarregar (`window`) versus um caderno que continua na mesa (`localStorage`).',
            },
          ],
        },
        {
          type: 'anatomy',
          caption:
            'O localStorage só guarda texto (strings): para guardar uma lista de livros, convertemos antes e depois.',
          language: 'js',
          parts: [
            { text: 'localStorage.' },
            {
              text: 'setItem',
              label: 'Operação de escrita',
              note: 'Cria ou sobrescreve a chave no armazenamento da origem atual.',
            },
            { text: '(' },
            {
              text: '"curso-web:livros"',
              label: 'Chave (texto)',
              note: 'Nome que identifica o dado dentro desta origem. Usar prefixo como `curso-web:` evita colidir com outras chaves do mesmo site.',
            },
            { text: ', ' },
            {
              text: 'JSON.stringify(livros)',
              label: 'Conversão para texto',
              note: '`localStorage` não guarda arrays nem objetos vivos diretamente — ele converte para string. Sem `JSON.stringify`, um array viraria `"[object Object]"`. Na leitura, usamos `JSON.parse(texto)` para reconstruir o array.',
            },
            { text: ');' },
          ],
        },
        {
          type: 'quiz',
          activityId: 'navegador-memoria-vs-localstorage:5',
          question:
            'Você gravou `localStorage.setItem("curso-web:cor", "verde")` na aba `http://localhost:5173`. Depois abriu `http://127.0.0.1:5173` no mesmo navegador e executou `localStorage.getItem("curso-web:cor")`. O que aparece e por quê?',
          options: [
            {
              text: '`null`, porque `localhost` e `127.0.0.1` têm hosts diferentes e formam origens diferentes para o navegador',
              correct: true,
              feedback:
                'Isso. A **origem** é `scheme + host + porta`. Mesmo apontando para a mesma máquina, `http://localhost:5173` e `http://127.0.0.1:5173` (ou `http://localhost:3000`) são origens distintas e cada uma tem seu próprio espaço de `localStorage`.',
            },
            {
              text: '`"verde"`, porque `localhost` e `127.0.0.1` apontam para o mesmo computador',
              feedback:
                'O endereço físico de loopback é o mesmo, mas a regra de isolamento do navegador compara a **origem textual** (`scheme + host + porta`), não o IP resolvido.',
            },
            {
              text: '`undefined`, porque `localStorage` sempre apaga os dados ao abrir outra aba',
              feedback:
                '`localStorage` sobrevive entre abas e recargas na mesma origem, e quando uma chave não existe ele devolve `null`, nunca `undefined`.',
            },
          ],
        },
        {
          type: 'fill',
          activityId: 'navegador-memoria-vs-localstorage:6',
          prompt:
            'Complete os comandos para gravar `"verde"` em `"curso-web:cor"`, ler o valor após recarregar e remover apenas essa chave no final.',
          language: 'js',
          template:
            'localStorage.[[setItem]]("curso-web:cor", "verde");\nconst corSalva = localStorage.[[getItem]]("curso-web:cor");\nlocalStorage.[[removeItem]]("curso-web:cor");',
          explanation:
            '`setItem(chave, valor)` grava texto, `getItem(chave)` lê (ou retorna `null` se não existir) e `removeItem(chave)` apaga somente aquela chave sem afetar outras chaves da mesma origem.',
        },
        {
          type: 'playground',
          activityId: 'navegador-memoria-vs-localstorage:7',
          title: 'Pratique no sandbox: memória da página, JSON e proteção contra SecurityError',
          task: 'A prévia abaixo roda em um `iframe` isolado (`sandbox="allow-scripts allow-forms"`), por isso chamar `localStorage` direto lança `SecurityError`. Complete `adicionarNaPagina`, `salvarSeguro` e `lerSeguro` para: (1) guardar livros na memória da página (`window.livrosDaPagina`); (2) tentar gravar em `localStorage` com `JSON.stringify` e cair em `window.fallbackMemoria` se houver `SecurityError`; (3) ler com `JSON.parse` devolvendo `[]` quando a chave não existir.',
          html: '<div class="caixa">\n  <h3>Catálogo na página</h3>\n  <button id="btn-add" type="button">Adicionar Dom Casmurro</button>\n  <p id="status">Nenhum livro adicionado ainda.</p>\n  <ul id="lista"></ul>\n</div>',
          css: 'body { font-family: system-ui, sans-serif; padding: 12px; color: #0f172a; }\n.caixa { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }\nbutton { padding: 8px 12px; border-radius: 8px; border: 0; background: #2563eb; color: #fff; font-weight: 600; cursor: pointer; }\n#status { font-size: 14px; color: #475569; margin: 10px 0; }',
          js: 'window.livrosDaPagina = [];\nwindow.fallbackMemoria = {};\n\nfunction adicionarNaPagina(titulo, autor) {\n  // TODO: crie o objeto { titulo, autor } e adicione em window.livrosDaPagina\n  return window.livrosDaPagina;\n}\n\nfunction salvarSeguro(chave, lista) {\n  const texto = JSON.stringify(lista);\n  try {\n    // TODO: tente gravar em localStorage.setItem(chave, texto) e devolva { destino: "localStorage" }\n    return { destino: "pendente" };\n  } catch (erro) {\n    // TODO: no sandbox, guarde em window.fallbackMemoria[chave] = texto e devolva { destino: "fallback-sandbox", erro: erro.name }\n    return { destino: "pendente", erro: erro.name };\n  }\n}\n\nfunction lerSeguro(chave) {\n  // TODO: tente ler de localStorage ou window.fallbackMemoria e devolver JSON.parse(texto) ou []\n  return [];\n}\n\nfunction renderizar(info) {\n  const lista = document.getElementById("lista");\n  const status = document.getElementById("status");\n  lista.replaceChildren();\n  for (const item of window.livrosDaPagina) {\n    const li = document.createElement("li");\n    li.textContent = item.titulo + " — " + item.autor;\n    lista.appendChild(li);\n  }\n  if (info) status.textContent = "Destino usado: " + info.destino + (info.erro ? " (" + info.erro + ")" : "");\n}\n\ndocument.getElementById("btn-add").addEventListener("click", () => {\n  adicionarNaPagina("Dom Casmurro", "Machado de Assis");\n  const info = salvarSeguro("curso-web:livros", window.livrosDaPagina);\n  renderizar(info);\n  console.log("Livros lidos:", lerSeguro("curso-web:livros"));\n});',
          solution: {
            js: 'window.livrosDaPagina = [];\nwindow.fallbackMemoria = {};\n\nfunction adicionarNaPagina(titulo, autor) {\n  window.livrosDaPagina.push({ titulo, autor });\n  return window.livrosDaPagina;\n}\n\nfunction salvarSeguro(chave, lista) {\n  const texto = JSON.stringify(lista);\n  try {\n    localStorage.setItem(chave, texto);\n    return { destino: "localStorage" };\n  } catch (erro) {\n    window.fallbackMemoria[chave] = texto;\n    return { destino: "fallback-sandbox", erro: erro.name };\n  }\n}\n\nfunction lerSeguro(chave) {\n  let texto = null;\n  try {\n    texto = localStorage.getItem(chave);\n  } catch {\n    texto = window.fallbackMemoria[chave] ?? null;\n  }\n  if (texto === null) {\n    texto = window.fallbackMemoria[chave] ?? null;\n  }\n  return texto ? JSON.parse(texto) : [];\n}\n\nfunction renderizar(info) {\n  const lista = document.getElementById("lista");\n  const status = document.getElementById("status");\n  lista.replaceChildren();\n  for (const item of window.livrosDaPagina) {\n    const li = document.createElement("li");\n    li.textContent = item.titulo + " — " + item.autor;\n    lista.appendChild(li);\n  }\n  if (info) status.textContent = "Destino usado: " + info.destino + (info.erro ? " (" + info.erro + ")" : "");\n}\n\ndocument.getElementById("btn-add").addEventListener("click", () => {\n  adicionarNaPagina("Dom Casmurro", "Machado de Assis");\n  const info = salvarSeguro("curso-web:livros", window.livrosDaPagina);\n  renderizar(info);\n  console.log("Livros lidos:", lerSeguro("curso-web:livros"));\n});',
          },
          checks: [
            {
              label: '`adicionarNaPagina` guarda o livro em `window.livrosDaPagina`',
              test: 'const antes = window.livrosDaPagina.length; adicionarNaPagina("Quarto de Despejo", "Carolina Maria de Jesus"); return window.livrosDaPagina.length === antes + 1 && window.livrosDaPagina[antes].titulo === "Quarto de Despejo";',
            },
            {
              label:
                '`salvarSeguro` grava em texto JSON sem quebrar mesmo se `localStorage` for bloqueado',
              test: 'const dados = [{ titulo: "Teste", autor: "Autora" }]; const res = salvarSeguro("teste:livros", dados); const esperado = JSON.stringify(dados); let salvo = null; try { salvo = localStorage.getItem("teste:livros"); } catch { salvo = window.fallbackMemoria["teste:livros"]; } return !!res && (res.destino === "localStorage" || res.destino === "fallback-sandbox") && salvo === esperado;',
            },
            {
              label: '`lerSeguro` devolve a lista reconstruída ou `[]` para chave ausente',
              test: 'salvarSeguro("teste:livros2", [{ titulo: "Livro A", autor: "Autor B" }]); const lidos = lerSeguro("teste:livros2"); const vazio = lerSeguro("chave-inexistente-xyz"); return Array.isArray(lidos) && lidos.length === 1 && lidos[0].titulo === "Livro A" && Array.isArray(vazio) && vazio.length === 0;',
            },
          ],
          height: 240,
        },
        {
          type: 'quiz',
          activityId: 'navegador-memoria-vs-localstorage:8',
          question:
            'Se o `localStorage` sobrevive ao `F5` e a fechar a aba, por que ele **não** substitui o banco de dados do servidor em um catálogo usado por várias pessoas?',
          options: [
            {
              text: 'Porque fica preso ao navegador e à origem de cada pessoa, não é compartilhado com outros usuários e pode ser limpo ou lido por scripts na página',
              correct: true,
              feedback:
                'Exato. O `localStorage` é ótimo para preferências locais (como tema ou rascunho de formulário), mas não centraliza dados entre pessoas, não aplica regras de negócio no servidor e não deve guardar tokens ou informações sensíveis.',
            },
            {
              text: 'Porque o `localStorage` é apagado automaticamente toda vez que o usuário aperta `F5`',
              feedback:
                'Quem apaga ao apertar `F5` é a **memória da página** (`window` / variáveis JS). O `localStorage` sobrevive à recarga na mesma origem.',
            },
            {
              text: 'Porque o navegador envia todo o `localStorage` automaticamente em cada requisição `GET`',
              feedback:
                'O navegador **não** envia o `localStorage` automaticamente nas requisições HTTP (isso seria parecido com cookies, e mesmo assim com regras próprias). O servidor não enxerga o `localStorage` a menos que seu JavaScript leia e envie no corpo ou cabeçalho.',
            },
          ],
        },
      ],
    },
    {
      id: 'servidor-memoria-vs-arquivo',
      title: 'No servidor: memória da API versus arquivo SQLite',
      blocks: [
        {
          type: 'text',
          text: 'Agora saímos do navegador (`http://localhost:5173`) e vamos olhar para o outro lado da conversa: o processo da API (`http://localhost:3000`). A confusão mais comum aqui é achar que, como o dado sobreviveu ao `F5`, ele já está “salvo no banco”. Veja o que realmente acontece quando comparamos uma lista em memória com um arquivo SQLite.',
        },
        {
          type: 'flow',
          caption:
            'O que acontece na recarga da página e no reinício da API com lista em memória versus SQLite',
          actors: [
            'Navegador (5173)',
            'API Node (3000)',
            'Memória RAM da API',
            'biblioteca.sqlite (disco)',
          ],
          steps: [
            {
              from: 0,
              to: 1,
              label: 'POST /livros',
              text: 'O formulário envia um novo livro em JSON para a API. O navegador ainda não sabe onde a API vai guardar esse dado.',
            },
            {
              from: 1,
              to: 2,
              label: 'livros.push(...)',
              text: 'Se a API usar `const livros = []`, o dado entra apenas na memória RAM daquele processo em execução — e a API já responde `201 Created`.',
            },
            {
              from: 0,
              to: 1,
              label: 'F5 → GET /livros',
              text: 'O usuário recarrega a aba. O `GET` pede os livros à API; como o processo da API **não** reiniciou, a RAM dela ainda tem o livro e responde `200`.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 2,
              label: 'Reinício da API!',
              text: 'O processo da API é fechado e iniciado de novo (`Ctrl+C` e `node server.js`). Toda a RAM do processo anterior some; `const livros` volta a ser `[]`.',
              tone: 'error',
            },
            {
              from: 1,
              to: 3,
              label: 'INSERT → biblioteca.sqlite',
              text: 'Com SQLite, em vez de guardar só na RAM, o Sequelize gera `INSERT` e o SQLite grava a nova linha no arquivo `biblioteca.sqlite` no disco.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 3,
              label: 'Reinício + SELECT',
              text: 'Mesmo após reiniciar o processo da API, um novo `GET /livros` executa `SELECT` no arquivo `biblioteca.sqlite` e devolve os livros preservados.',
              tone: 'ok',
            },
          ],
        },
        {
          type: 'codeTabs',
          caption: 'Compare como o dado é guardado em cada um dos quatro lugares',
          tabs: [
            {
              label: '1. Memória da página',
              language: 'js',
              code: '// Roda no navegador. Some ao apertar F5 ou fechar a aba.\nwindow.livrosDaPagina = [\n  { id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis" }\n];',
            },
            {
              label: '2. localStorage',
              language: 'js',
              code: '// Roda no navegador, isolado por origem (ex.: http://localhost:5173).\n// Sobrevive ao F5 e a fechar a aba, mas só existe neste navegador.\nlocalStorage.setItem(\n  "curso-web:livros",\n  JSON.stringify([{ id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis" }])\n);',
            },
            {
              label: '3. Memória da API',
              language: 'js',
              code: '// Roda no servidor Node (http://localhost:3000).\n// Sobrevive ao F5 da página, mas SOME quando o processo da API reinicia.\nconst livros = [\n  { id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis" }\n];\napp.post("/livros", (req, res) => {\n  const novo = { id: livros.length + 1, ...req.body };\n  livros.push(novo);\n  res.status(201).json(novo);\n});',
            },
            {
              label: '4. Arquivo SQLite',
              language: 'js',
              code: '// Roda no servidor Node, gravando em disco (biblioteca.sqlite).\n// Sobrevive ao F5 da página e ao reinício do processo da API.\napp.post("/livros", async (req, res) => {\n  const novo = await Livro.create({\n    titulo: req.body.titulo,\n    autor: req.body.autor,\n  });\n  res.status(201).json(novo);\n});',
            },
          ],
        },
        {
          type: 'terms',
          items: [
            {
              term: 'Banco de dados',
              text: 'Coleção organizada de dados, com tabelas e regras de leitura, escrita e integridade.',
            },
            {
              term: 'Tabela, linha e coluna',
              text: 'Pense em uma planilha: a tabela `livros` tem colunas (`id`, `titulo`, `autor`) para cada atributo, e cada livro cadastrado é uma linha (ou registro). Diferente da planilha, um banco relacional impõe tipos, restrições e transações.',
            },
            {
              term: 'Chave primária',
              text: 'Coluna que identifica cada linha de forma única, como `id`. Em geral, o próprio banco gera esse número.',
            },
            {
              term: 'SQL',
              text: 'Linguagem para consultar e alterar bancos relacionais: `SELECT` lê, `INSERT` cria, `UPDATE` altera e `DELETE` apaga.',
            },
            {
              term: 'SQLite',
              text: 'Biblioteca embutida que roda **dentro do processo** da API (sem precisar de um servidor separado como PostgreSQL ou MySQL) e grava os dados em um arquivo comum no disco, como `biblioteca.sqlite`.',
            },
            {
              term: 'ORM e Sequelize',
              text: 'ORM (*Object-Relational Mapping*) é uma camada que traduz métodos JavaScript (`Livro.findAll()`, `Livro.create(...)`) em comandos SQL. Sequelize é o ORM usado no curso; mesmo com ORM, quem executa e guarda os dados continua sendo o banco.',
            },
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Três cuidados: sync(), backup e arquivos WAL',
          text: '**1) `sync()` não recupera dados:** no Sequelize, `sequelize.sync()` cria tabelas que ainda não existem ao iniciar, mas se você apagar o arquivo `biblioteca.sqlite`, os livros somem e a tabela volta vazia. Para evoluir a estrutura em produção sem perder dados, usam-se **migrações**. **2) Persistência não é backup:** sobreviver a um reinício não protege contra apagar o arquivo ou perder o disco; backup é ter outra cópia. **3) Arquivos auxiliares:** enquanto o SQLite está em uso, podem aparecer arquivos `-wal` e `-shm` ao lado de `biblioteca.sqlite` — o conceito continua o mesmo: banco local em arquivo.',
        },
        {
          type: 'sql',
          activityId: 'servidor-memoria-vs-arquivo:5',
          title: 'Veja por dentro do SQLite: tabela, linha, coluna e chave primária',
          task: "A tabela `livros` já começa com 2 registros (`id` 1 e 2). Insira um terceiro livro com `INSERT INTO livros (titulo, autor) VALUES ('Memórias Póstumas de Brás Cubas', 'Machado de Assis');` (sem passar `id` manualmente — o banco gera `id = 3`) e depois execute `SELECT id, titulo, autor FROM livros ORDER BY id;` para ver as 3 linhas.",
          setup:
            "CREATE TABLE livros (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  titulo TEXT NOT NULL,\n  autor TEXT NOT NULL\n);\nINSERT INTO livros (titulo, autor) VALUES\n  ('Dom Casmurro', 'Machado de Assis'),\n  ('Quarto de Despejo', 'Carolina Maria de Jesus');",
          query:
            '-- Previsão antes de editar: qual será o id gerado para o 3º livro?\nSELECT id, titulo, autor FROM livros ORDER BY id;',
          solution:
            "INSERT INTO livros (titulo, autor)\nVALUES ('Memórias Póstumas de Brás Cubas', 'Machado de Assis');\n\nSELECT id, titulo, autor FROM livros ORDER BY id;",
          checks: [
            {
              label: 'A tabela `livros` passou a ter 3 linhas',
              test: 'const total = run("SELECT COUNT(*) FROM livros"); return !!total && Number(total.rows[0][0]) === 3;',
            },
            {
              label: 'O novo livro recebeu automaticamente a chave primária `id = 3`',
              test: 'const row = run("SELECT id, autor FROM livros WHERE titulo = \'Memórias Póstumas de Brás Cubas\'"); return !!row && row.rows.length === 1 && Number(row.rows[0][0]) === 3 && row.rows[0][1] === "Machado de Assis";',
            },
            {
              label: 'A consulta final mostrou `id`, `titulo` e `autor` das 3 linhas',
              test: 'return !!result && result.columns.join(",") === "id,titulo,autor" && result.rows.length === 3;',
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'servidor-memoria-vs-arquivo:6',
          question:
            'Uma API recebeu `POST /livros`, respondeu `201 Created` com `{"id": 3, "titulo": "Vidas Secas"}`, e o usuário recarregou a página (`F5`) e continuou vendo o livro. Mas, depois que o servidor Node reiniciou, `GET /livros` respondeu `200 OK` com `[]`. O que explica esse comportamento?',
          options: [
            {
              text: 'Os livros estavam apenas em um array na memória do processo da API (`const livros = []`), que resistiu ao `F5` do navegador, mas zerou quando o servidor reiniciou',
              correct: true,
              feedback:
                'Exato. Recarregar a página não reinicia o processo da API, por isso o dado parecia salvo durante o `F5`. Quando a API reiniciou, a RAM dela foi recriada vazia — e `200 OK` com `[]` apenas mostra que a leitura funcionou sobre uma lista vazia.',
            },
            {
              text: 'O navegador apagou o arquivo `biblioteca.sqlite` quando o usuário apertou `F5`',
              feedback:
                'O navegador não tem acesso ao sistema de arquivos do servidor e não consegue apagar `biblioteca.sqlite`. Além disso, reiniciar a API sem apagar o arquivo mantém os registros no SQLite.',
            },
            {
              text: 'O status `201 Created` garante que o Sequelize gravou no disco; logo o `GET` falhou por cache',
              feedback:
                'Status HTTP (`200` ou `201`) é apenas a resposta que o código decidiu enviar, não uma prova física de gravação em disco. Uma API em memória também responde `201`.',
            },
          ],
        },
      ],
    },
    {
      id: 'provar-persistencia',
      title: 'Prática: como provar o que sobrevive à recarga e ao reinício',
      blocks: [
        {
          type: 'reveal',
          question:
            'Pare e pense: um colega disse “minha API já persiste dados porque o `POST /livros` devolveu `201` com `id: 3`”. O que você pediria para ele fazer para **provar** que o dado persistiu de verdade?',
          answer:
            'Pediria o teste em três passos: (1) conferir o `id` devolvido no `201` e confirmar no `GET /livros`; (2) **parar completamente o processo da API e iniciar de novo** com a mesma configuração; (3) repetir `GET /livros` e confirmar que o mesmo `id` continua na resposta — sem confiar em uma lista antiga que já estava na tela ou em cache.',
        },
        {
          type: 'order',
          activityId: 'provar-persistencia:1',
          prompt:
            'Coloque em ordem os passos do teste que prova persistência após o reinício da API.',
          items: [
            'Enviar `POST /livros`, confirmar o status `201` e anotar o `id` devolvido',
            'Fazer `GET /livros` antes de reiniciar para confirmar que o livro aparece na API',
            'Parar o processo da API e iniciá-lo novamente com o mesmo banco configurado',
            'Repetir `GET /livros` no mesmo endereço (evitando cache antigo na tela)',
            'Conferir se o mesmo `id` anotado continua presente na resposta `200`',
          ],
          explanation:
            'A prova de persistência nunca é o status `201` isolado (até uma API falsa como o JSONPlaceholder ou um array em memória devolvem `201`). O que prova persistência é **criar → reiniciar o processo → ler de novo e encontrar o mesmo registro**.',
        },
        {
          type: 'steps',
          items: [
            {
              title: 'Prática A (somente navegador e papel)',
              text: '1) No navegador, repita o teste `window.cursoWebCorTemporaria` vs `localStorage` anotando antes o que sobrevive ao `F5` e a fechar a aba. 2) No papel, simule **Servidor A (lápis = memória da API)** e **Servidor B (folha guardada = `biblioteca.sqlite`)**: comece com 2 livros, faça `POST` válido (`201`, 3 livros), faça `POST` sem autor (`400`, continua 3), simule apenas recarga da página (ambos seguem com 3) e simule reinício da API (Servidor A volta a 2; Servidor B mantém 3).',
            },
            {
              title: 'Prática B (laboratório local executável — se você já roda Node na máquina)',
              text: 'Prática opcional, sem dependências externas: instale Node.js 24 ou superior e confirme com `node --version`. No endereço deste site, substitua o caminho após o domínio por `/praticas/onde-o-dado-mora/servidor.mjs`; salve o arquivo como `servidor.mjs` em uma pasta de sua escolha. Abra um terminal nessa pasta e execute o comando abaixo. Abra `http://127.0.0.1:4174`, anote sua previsão e cadastre um livro nos quatro painéis. Aperte `F5` e observe; depois pare a API com `Ctrl+C`, execute o comando novamente e recarregue a página. O arquivo SQLite fica na mesma pasta: mantenha-o entre os reinícios.',
              code: 'node servidor.mjs',
            },
          ],
        },
        {
          type: 'cards',
          columns: 2,
          items: [
            {
              label: 'Confusão 1',
              title: '“201 Created prova que salvou no banco”',
              text: 'Falso. O servidor pode responder `201` salvando apenas em um array na RAM — ou até simulando uma resposta. Só o teste de reiniciar e ler de novo prova persistência.',
            },
            {
              label: 'Confusão 2',
              title: '“Recarregar a página é igual a reiniciar a API”',
              text: 'Falso. `F5` recarrega apenas o processo da página no navegador; o servidor Node da API continua ligado do outro lado até ser reiniciado.',
            },
            {
              label: 'Confusão 3',
              title: '“localStorage é o banco de dados do servidor”',
              text: 'Falso. `localStorage` mora no navegador de quem acessa, é isolado por origem e não é compartilhado com outras pessoas nem controlado pela API.',
            },
            {
              label: 'Confusão 4',
              title: '“SQLite é um servidor separado e sync() faz backup”',
              text: 'Falso. SQLite roda dentro do processo da API e grava em arquivo; apagar o arquivo destrói os dados mesmo que `sync()` recrie a tabela vazia depois.',
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'provar-persistencia:4',
          question:
            'Um catálogo roda com frontend em `http://localhost:5173`, API em `http://localhost:3000` e banco `biblioteca.sqlite`. Se você **apagar o arquivo `biblioteca.sqlite`** com a API parada e depois iniciar a API novamente (com `sequelize.sync()` na inicialização), o que acontece?',
          options: [
            {
              text: 'Os livros anteriores somem; o `sync()` pode recriar o arquivo e a tabela `livros` vazia, mas não recupera nenhuma linha',
              correct: true,
              feedback:
                'Correto. **Persistência** significa sobreviver ao reinício do processo; **backup** significa ter outra cópia caso o arquivo seja apagado. O `sync()` cria a estrutura da tabela, nunca os dados perdidos.',
            },
            {
              text: 'O `sync()` restaura os livros automaticamente a partir do `localStorage` do navegador',
              feedback:
                'O Sequelize roda no servidor e não lê o `localStorage` do navegador — e `sync()` conhece apenas a definição das colunas, não os registros gravados antes.',
            },
            {
              text: 'Nada muda, porque o Sequelize guarda uma segunda cópia oculta dos dados na memória da API',
              feedback:
                'Quando a API é parada, a memória RAM do processo desaparece junto. Sem o arquivo `.sqlite` (e sem um backup separado), os registros se foram.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    '**Memória da página** (`window`, variáveis JS da aba) morre ao recarregar ou fechar a aba; **`localStorage`** sobrevive no navegador, mas fica isolado por **origem** (`scheme + host + porta`) e só existe naquele navegador/perfil.',
    '**Memória do processo da API** (`const livros = []`) sobrevive quando o usuário recarrega a página, mas zera completamente quando o servidor da API reinicia.',
    '**Armazenamento em arquivo (SQLite)** grava linhas e colunas no disco (`biblioteca.sqlite`), rodando dentro do próprio processo da API e sobrevivendo tanto à recarga da página quanto ao reinício do servidor.',
    'Nem `200`/`201` na resposta nem `sync()` garantem dados salvos para sempre: **persistência** se prova criando um registro, reiniciando a API e lendo de novo; **backup** é manter outra cópia contra perda ou exclusão do arquivo.',
  ],
  cards: [
    {
      id: 'quatro-lugares',
      front:
        'Quais são os quatro lugares onde um dado pode morar e o que sobrevive ao `F5` e ao reinício da API?',
      back: 'Memória da página (perde no `F5`); `localStorage` (mantém no `F5` e ao fechar, por origem); Memória da API (mantém no `F5`, perde ao reiniciar a API); Arquivo SQLite (mantém no `F5` e ao reiniciar a API).',
    },
    {
      id: 'localstorage-origem',
      front:
        'Se você salvar uma chave no `localStorage` em `http://localhost:5173`, ela aparece em `http://127.0.0.1:5173`?',
      back: 'Não. O `localStorage` é isolado por origem (`scheme + host + porta`). Mudar o host (`localhost` vs `127.0.0.1`) ou a porta muda o espaço de armazenamento; a leitura devolve `null`.',
    },
    {
      id: 'localstorage-texto',
      front:
        'Por que precisamos de `JSON.stringify` e `JSON.parse` ao guardar arrays ou objetos no `localStorage`?',
      back: 'Porque o `localStorage` guarda apenas strings (texto). `JSON.stringify` transforma o objeto/array em texto para gravar; `JSON.parse` reconstrói o dado ao ler.',
    },
    {
      id: 'sqlite-em-processo',
      front: 'SQLite precisa de um servidor de banco separado rodando em outra porta?',
      back: 'Não. SQLite é uma biblioteca embutida que roda dentro do processo da API e grava em um arquivo no disco (como `biblioteca.sqlite`).',
    },
    {
      id: 'prova-de-persistencia',
      front: 'Como provar na prática que uma API realmente persistiu um registro?',
      back: 'Criar o item e anotar o `id` do `201`, confirmar no `GET`, parar e reiniciar o processo da API com o mesmo banco e repetir o `GET` para verificar se o mesmo `id` continua lá.',
    },
    {
      id: 'sync-vs-backup',
      front: 'Qual a diferença entre persistência, `sequelize.sync()` e backup?',
      back: 'Persistência é sobreviver ao reinício do processo; `sync()` cria tabelas ausentes na inicialização (se o arquivo for apagado, recria a tabela vazia); backup é manter outra cópia dos dados.',
    },
  ],
  mission: {
    title: 'Prove os quatro tempos de vida e registre suas evidências',
    text: 'Sem depender de IA, faça o experimento de previsão e coleta de evidências comparando dado temporário e dado persistente. Registre no seu caderno (ou no Diário de bordo da Unidade 1) o que previu antes de executar e o que observou depois.',
    steps: [
      'Antes de executar, escreva sua previsão para `window.cursoWebCorTemporaria` e `localStorage` após apertar `F5` e após fechar/reabrir a aba.',
      'Execute os comandos no Console das DevTools em `https://example.com` (ou siga as instruções da prática opcional acima para executar o minilaboratório) e anote os resultados reais.',
      'Se testar o minilaboratório ou duas origens (`localhost` vs `127.0.0.1`), registre o resultado do `localStorage` em cada origem e limpe a chave de teste com `removeItem`.',
      'Explique em voz alta ou por escrito, em até 4 frases: por que recarregar a página não apaga `const livros = []` na API, mas reiniciar a API apaga — e como o SQLite resolve isso.',
    ],
  },
  sources: [
    {
      title: 'MDN: Window.localStorage',
      url: 'https://developer.mozilla.org/pt-BR/docs/Web/API/Window/localStorage',
    },
    {
      title: 'WHATWG HTML Standard: Web Storage (localStorage)',
      url: 'https://html.spec.whatwg.org/multipage/webstorage.html#dom-localstorage',
    },
    {
      title: 'MDN: Origin (Origem)',
      url: 'https://developer.mozilla.org/en-US/docs/Glossary/Origin',
    },
    {
      title: 'SQLite: About SQLite',
      url: 'https://www.sqlite.org/about.html',
    },
    {
      title: 'Sequelize v6: Getting Started',
      url: 'https://sequelize.org/docs/v6/getting-started/',
    },
  ],
};
