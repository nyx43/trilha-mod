import { LessonContent } from '../types';

const verificar = (corpo: string) => `const anterior = window.__fila || Promise.resolve();
let liberar;
window.__fila = new Promise((r) => (liberar = r));
await anterior;
await new Promise((r) => setTimeout(r, 300));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
try {
${corpo}
} finally {
  liberar();
}`;

export const content: LessonContent = {
  hook: 'Num projeto React com Vite, ficar pulando entre o componente JSX e arquivos CSS cheios de nomes inventados atrasa cada ajuste de margem, botão ou coluna no celular. Com Tailwind CSS, você descreve espaçamento, layout responsivo e foco acessível direto no `className` usando classes utilitárias pequenas e previsíveis. Nesta aula você vai construir e revisar um **Painel de Oficinas da Semana** para dominar utilitários, foco por teclado e mobile-first.',
  sections: [
    {
      id: 'classes-utilitarias',
      title: 'Classes utilitárias no lugar de CSS espalhado',
      blocks: [
        {
          type: 'reveal',
          question:
            'Pergunta inicial: antes de ler o exemplo, se você escrever `className="rounded-xl border border-slate-200 bg-white p-4"` direto no JSX de um cartão, o que isso resolve em relação ao CSS tradicional e qual cuidado novo aparece?',
          answer:
            'Resolve dois atritos: você não precisa inventar nomes como `.card-oficina-wrapper` nem caçar em outro arquivo qual é o padding ou a cor daquela caixa, além de seguir uma escala fixa de medidas. O cuidado novo é não deixar listas gigantes repetidas por todo lugar: quando um padrão se repete, você extrai um **componente React** (como `<OficinaCard />`), em vez de duplicar 15 classes em cinco arquivos.',
        },
        {
          type: 'analogy',
          title: 'Etiquetas de caixa em vez de gavetas numeradas',
          text: 'No CSS tradicional, você cria uma gaveta chamada `.cartao-oficina` num arquivo separado e guarda ali dentro borda, fundo e espaço. Com classes utilitárias, cada classe é uma etiqueta curta e única (`p-4` = padding 16px, `rounded-xl` = cantos arredondados, `gap-3` = vão entre itens). Olhando para o JSX, você já enxerga a aparência e o comportamento da caixa.',
        },
        {
          type: 'text',
          text: 'A escala numérica do Tailwind é baseada em múltiplos de `0.25rem` (`4px` no padrão do navegador). Assim, `p-4` significa `padding: 1rem` (`16px`), `gap-3` significa `gap: 0.75rem` (`12px`) e `px-4 py-2.5` aplica `16px` nas laterais e `10px` em cima e embaixo.',
        },
        {
          type: 'anatomy',
          caption:
            'Um cartão do Painel de Oficinas da Semana escrito com classes utilitárias. Explore cada trecho.',
          language: 'jsx',
          parts: [
            { text: '<article className="' },
            {
              text: 'rounded-xl border border-slate-200 bg-white p-4',
              label: 'Superfície e respiro',
              note: '`rounded-xl` arredonda os cantos, `border border-slate-200` cria borda fina discreta, `bg-white` define o fundo e `p-4` garante `1rem` (`16px`) de padding interno.',
            },
            { text: ' ' },
            {
              text: 'flex flex-col justify-between gap-4',
              label: 'Layout interno',
              note: '`flex flex-col` empilha título, horário e botão em coluna; `justify-between` empurra o rodapé do card para baixo; `gap-4` cria vão uniforme sem precisar de `margin-bottom` em cada filho.',
            },
            {
              text: '">\n  <div>\n    <span className="',
            },
            {
              text: 'inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800',
              label: 'Selo de status',
              note: '`rounded-full` faz formato de pílula; `px-2.5 py-0.5` dá respiro horizontal e vertical; `text-xs font-semibold` deixa o rótulo legível e destacado.',
            },
            {
              text: '">Vagas abertas</span>\n    <h2 className="mt-2 text-lg font-bold text-slate-900">HTML Semântico na Prática</h2>\n    <p className="mt-1 text-sm text-slate-600">Quinta, 19h · Laboratório 2</p>\n  </div>\n</article>',
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'classes-utilitarias:4',
          question:
            'Você quer separar três botões de filtro numa barra que quebra linha no celular. Por que `flex flex-wrap gap-2` é melhor do que colocar `mr-2` em cada botão?',
          options: [
            {
              text: 'Porque `gap-2` cria espaço apenas entre os botões e funciona tanto na horizontal quanto quando quebram de linha, sem sobrar margem na ponta',
              correct: true,
              feedback:
                'Isso. `gap` espaça somente entre itens vizinhos e também separa as linhas quando o `flex-wrap` entra em ação no celular. Já `mr-2` deixa um espaço sobrando depois do último item e não separa as linhas.',
            },
            {
              text: 'Porque `mr-2` não existe no Tailwind CSS',
              feedback:
                '`mr-2` existe sim (`margin-right: 0.5rem`), mas ele empurra sempre para a direita — mesmo no último item ou quando os botões quebram para a linha de baixo.',
            },
            {
              text: 'Porque `gap-2` centraliza os botões automaticamente',
              feedback:
                'Quem alinha ou centraliza no Flexbox são `justify-center` e `items-center`. O `gap-2` cuida apenas do vão entre os elementos.',
            },
          ],
        },
        {
          type: 'classify',
          activityId: 'classes-utilitarias:5',
          prompt: 'Agrupe cada classe utilitária pelo que ela controla no elemento.',
          buckets: ['Espaçamento e tamanho', 'Layout (Flex / Grid)', 'Cor, borda e texto'],
          items: [
            { text: '`p-4` e `px-3 py-2`', bucket: 0 },
            { text: '`max-w-4xl` e `min-h-[44px]`', bucket: 0 },
            { text: '`flex flex-col gap-3`', bucket: 1 },
            { text: '`grid grid-cols-1 md:grid-cols-2`', bucket: 1 },
            { text: '`bg-indigo-600 text-white`', bucket: 2 },
            { text: '`rounded-xl border border-slate-200 font-semibold`', bucket: 2 },
          ],
          explanation:
            'Separar mentalmente as classes em layout, espaçamento e aparência ajuda você a ler qualquer JSX rápido: primeiro onde a caixa fica (`grid`, `flex`), depois o tamanho e respiro (`p-4`, `gap-3`), por fim cor e tipografia.',
        },
      ],
    },
    {
      id: 'foco-e-estados',
      title: 'Foco visível, estados e botões acessíveis',
      blocks: [
        {
          type: 'text',
          text: 'Prefixos de estado no Tailwind aplicam estilos só quando algo acontece: `hover:` quando o mouse passa por cima, `disabled:` quando o botão está bloqueado durante um envio e `focus-visible:` quando alguém navega com a tecla `Tab`.',
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Nunca use outline-none sozinho',
          text: 'Muita gente escreve `outline-none` para esconder o contorno padrão do navegador e esquece de colocar um indicador alternativo. Quem usa teclado (ou leitor de tela) deixa de enxergar em qual botão ou campo está. Sempre combine `focus-visible:outline-none` com um anel nítido, como `focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2`.',
        },
        {
          type: 'code',
          language: 'jsx',
          caption:
            'Botão de inscrição acessível com área de toque confortável, foco visível e estado desabilitado',
          code: `<button
  type="button"
  disabled={enviando}
  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
>
  {enviando ? 'Salvando inscrição…' : 'Inscrever-se na oficina'}
</button>`,
        },
        {
          type: 'quiz',
          activityId: 'foco-e-estados:3',
          question:
            'Num formulário de inscrição de oficinas, um colega colocou `className="border p-2 outline-none"` no `<input>` para ficar mais limpo. O que acontece para quem navega com a tecla `Tab`?',
          options: [
            {
              text: 'O campo recebe o foco, mas não mostra nenhum destaque visual — a pessoa não sabe onde está digitando',
              correct: true,
              feedback:
                'Exato. O navegador continua movendo o foco, mas `outline-none` apagou o único aviso visual. Troque por `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600`.',
            },
            {
              text: 'A tecla `Tab` para de entrar no campo',
              feedback:
                'CSS não impede o foco por teclado (quem faz isso é `disabled` ou `tabIndex={-1}`). O problema aqui é visual: o foco fica invisível.',
            },
            {
              text: 'O `hover:` passa a substituir o foco automaticamente',
              feedback:
                'Quem navega pelo teclado não passa o mouse por cima do campo. `hover:` não dispara com `Tab`.',
            },
          ],
        },
        {
          type: 'fill',
          activityId: 'foco-e-estados:4',
          prompt:
            'Complete as classes do botão para reagir ao mouse, mostrar anel de foco pelo teclado e ficar opaco quando `disabled`.',
          language: 'jsx',
          template: `<button
  type="submit"
  disabled={carregando}
  className="min-h-[44px] rounded-lg bg-indigo-600 px-4 py-2 text-white [[hover]]:bg-indigo-700 [[focus-visible]]:outline-none [[focus-visible]]:ring-2 focus-visible:ring-indigo-600 [[disabled]]:opacity-50"
>
  Enviar
</button>`,
          explanation:
            '`hover:` estiliza ao passar o mouse; `focus-visible:` destaca o foco quando vem do teclado sem poluir cliques simples; e `disabled:` aplica a aparência bloqueada automaticamente quando o atributo `disabled` é verdadeiro.',
        },
      ],
    },
    {
      id: 'layout-responsivo',
      title: 'Layout responsivo mobile-first',
      blocks: [
        {
          type: 'text',
          text: 'O Tailwind é **mobile-first**: classes sem prefixo valem para **qualquer largura**, começando da menor tela de celular (`320px` ou `360px`). Prefixos como `sm:` (`>= 640px`), `md:` (`>= 768px`) e `lg:` (`>= 1024px`) **acrescentam** mudanças só quando a tela fica maior.',
        },
        {
          type: 'codeTabs',
          caption: 'Como o mesmo JSX do Painel de Oficinas se adapta de 360px até telas largas',
          tabs: [
            {
              label: 'Container e cabeçalho',
              language: 'jsx',
              code: `<main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
  <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Oficinas da semana</h1>
      <p className="text-sm text-slate-600">Escolha uma turma e garanta sua vaga.</p>
    </div>
    <button className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white sm:w-auto">
      Nova oficina
    </button>
  </header>
</main>`,
            },
            {
              label: 'Grade de cartões',
              language: 'jsx',
              code: `<section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {oficinas.map((oficina) => (
    <article
      key={oficina.id}
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-4"
    >
      <h2 className="truncate text-base font-bold text-slate-900">{oficina.titulo}</h2>
      <p className="mt-1 text-sm text-slate-600">{oficina.horario}</p>
    </article>
  ))}
</section>`,
            },
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Três vilões da rolagem horizontal no celular',
          text: '1) Usar larguras fixas como `w-[600px]` em vez de `w-full max-w-xl`. 2) Esquecer `min-w-0` em itens dentro de `grid` ou `flex` quando há um texto ou URL comprida. 3) Escrever `grid-cols-3` sem começar por `grid-cols-1`: em `360px`, três colunas espremem cada card para menos de `100px`.',
        },
        {
          type: 'quiz',
          activityId: 'layout-responsivo:3',
          question:
            'Alguém escreveu `className="grid gap-4 grid-cols-3 md:grid-cols-1"` achando que `md:` significa celular. O que vai aparecer numa tela de `360px`?',
          options: [
            {
              text: 'Três colunas espremidas no celular e uma coluna só no computador — exatamente o contrário do desejado',
              correct: true,
              feedback:
                'Isso. Sem prefixo vale para o celular (`grid-cols-3`), e `md:` só passa a valer a partir de `768px`. O certo em mobile-first é `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.',
            },
            {
              text: 'Uma coluna só no celular, porque o navegador escolhe o menor número',
              feedback:
                'O navegador não escolhe o menor número: ele aplica `grid-cols-3` em qualquer largura e só troca para `grid-cols-1` quando passa de `768px`.',
            },
            {
              text: 'Um erro de compilação do Vite dizendo que a ordem está invertida',
              feedback:
                'O Tailwind aceita qualquer ordem de classes sem acusar erro; o bug aparece só na tela quando você testa em `360px`.',
            },
          ],
        },
        {
          type: 'order',
          activityId: 'layout-responsivo:4',
          prompt: 'Coloque em ordem um fluxo seguro para montar uma tela responsiva com Tailwind.',
          items: [
            'Escrever o HTML semântico (`main`, `header`, `h1`, `button`, `label`)',
            'Aplicar o layout base para celular sem prefixo (`flex-col`, `grid-cols-1`, `w-full`)',
            'Adicionar adaptações para telas maiores com `sm:`, `md:` e `lg:`',
            'Garantir foco visível (`focus-visible:ring-2`) e altura confortável de toque (`min-h-[44px]`)',
            'Abrir o DevTools em `360px` e percorrer com `Tab` para confirmar que nada quebrou',
          ],
          explanation:
            'Semântica primeiro, celular como base, breakpoints só quando o conteúdo pedir, foco acessível nos controles interativos e conferência real em largura estreita e teclado.',
        },
      ],
    },
    {
      id: 'pratica-no-playground-e-vite',
      title: 'Experimente aqui e leve para o React + Vite',
      blocks: [
        {
          type: 'callout',
          tone: 'note',
          title: 'Como funciona este playground',
          text: 'A prévia interativa do Trilha executa React 18 com CSS comum dentro de um iframe isolado — ela **não** roda o compilador do Tailwind CSS. Por isso, no exercício abaixo já deixamos pequenas classes utilitárias equivalentes no arquivo CSS (`.u-grid`, `.u-cols-1`, `.sm-cols-2`, `.u-alvo`, `.u-foco`) para você praticar a **composição no JSX** e testar a largura com o controle deslizante. Logo depois estão os passos exatos para rodar o Tailwind real no seu projeto React + Vite.',
        },
        {
          type: 'playground',
          activityId: 'pratica-no-playground-e-vite:1',
          title: 'Conserte o Painel de Oficinas para celular e teclado',
          framework: 'react',
          resizable: true,
          height: 310,
          task: 'O painel começa quebrado: usa `grade-fixa` (duas colunas fixas de `280px` que estouram no celular) e `btn-sem-foco` (botão pequeno que apagou o contorno de foco). No JSX, troque `grade-fixa` por `u-grid u-cols-1 sm-cols-2` e troque `btn-sem-foco` por `btn u-alvo u-foco`. Depois arraste a largura da prévia de `320px` até `800px` para conferir.',
          html: '<div id="root"></div>',
          css: `*, *::before, *::after { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #f8fafc; color: #0f172a; }
h1 { font-size: 1.25rem; margin: 0 0 4px; }
.sub { margin: 0 0 14px; font-size: 0.875rem; color: #475569; }
.card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.card h2 { margin: 0; font-size: 1rem; }
.card p { margin: 0; font-size: 0.875rem; color: #475569; }

/* Classes antigas com defeito (troque no JSX!) */
.grade-fixa { display: grid; grid-template-columns: 280px 280px; gap: 12px; }
.btn-sem-foco { background: #4338ca; color: #ffffff; border: 0; border-radius: 8px; padding: 4px 8px; font-size: 0.875rem; cursor: pointer; }
.btn-sem-foco:focus, .btn-sem-foco:focus-visible { outline: none; }

/* Utilitários equivalentes aos do Tailwind */
.u-grid { display: grid; gap: 12px; }
.u-cols-1 { grid-template-columns: minmax(0, 1fr); }
@media (min-width: 640px) {
  .sm-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.btn { background: #4338ca; color: #ffffff; border: 0; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
.btn[data-inscrito="true"] { background: #047857; }
.u-alvo { min-height: 44px; padding: 10px 14px; width: 100%; }
.u-foco:focus-visible { outline: 3px solid #4338ca; outline-offset: 2px; }`,
          js: `const { useState } = React;

const oficinasIniciais = [
  { id: 1, titulo: 'HTML Semântico', horario: 'Terça, 19h', inscrito: false },
  { id: 2, titulo: 'Consultas SQL', horario: 'Quinta, 19h', inscrito: false },
  { id: 3, titulo: 'Testes no Frontend', horario: 'Sexta, 18h', inscrito: false },
];

function PainelOficinas() {
  const [oficinas, setOficinas] = useState(oficinasIniciais);

  function alternarInscricao(id) {
    setOficinas((lista) =>
      lista.map((item) => (item.id === id ? { ...item, inscrito: !item.inscrito } : item)),
    );
  }

  return (
    <main>
      <h1>Oficinas da semana</h1>
      <p className="sub">Pratique composição mobile-first e foco visível.</p>
      {/* TODO 1: troque grade-fixa por u-grid u-cols-1 sm-cols-2 */}
      <section className="grade-fixa" aria-label="Lista de oficinas">
        {oficinas.map((item) => (
          <article key={item.id} className="card">
            <h2>{item.titulo}</h2>
            <p>{item.horario}</p>
            {/* TODO 2: troque btn-sem-foco por btn u-alvo u-foco */}
            <button
              type="button"
              className="btn-sem-foco"
              data-inscrito={item.inscrito ? 'true' : 'false'}
              onClick={() => alternarInscricao(item.id)}
            >
              {item.inscrito ? 'Inscrito' : 'Inscrever'}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PainelOficinas />);`,
          checks: [
            {
              label:
                'A lista usa layout mobile-first (`u-cols-1` + `sm-cols-2`) e os cards ficam em 2 colunas em telas >= 640px',
              test: verificar(`const grade = document.querySelector('section[aria-label="Lista de oficinas"]');
const cards = [...document.querySelectorAll('.card')];
if (!grade || cards.length < 2) return false;
const temClasses = grade.classList.contains('u-grid') && grade.classList.contains('u-cols-1') && grade.classList.contains('sm-cols-2');
const mesmaLinha = Math.abs(cards[0].getBoundingClientRect().top - cards[1].getBoundingClientRect().top) < 2;
return temClasses && mesmaLinha;`),
            },
            {
              label: 'Não há rolagem horizontal na página',
              test: verificar(`const root = document.documentElement;
return root.scrollWidth <= root.clientWidth + 1;`),
            },
            {
              label:
                'Os botões têm foco visível (`u-foco`), altura mínima de toque (44px) e alternam para **Inscrito** ao clicar',
              test: verificar(`const botoes = [...document.querySelectorAll('button')];
if (!botoes.length) return false;
const acessiveis = botoes.every((b) => b.classList.contains('u-foco') && b.classList.contains('u-alvo') && b.getBoundingClientRect().height >= 44);
if (!acessiveis) return false;
botoes[0].click();
await esperar(60);
return botoes[0].textContent.includes('Inscrito');`),
            },
          ],
          solution: {
            js: `const { useState } = React;

const oficinasIniciais = [
  { id: 1, titulo: 'HTML Semântico', horario: 'Terça, 19h', inscrito: false },
  { id: 2, titulo: 'Consultas SQL', horario: 'Quinta, 19h', inscrito: false },
  { id: 3, titulo: 'Testes no Frontend', horario: 'Sexta, 18h', inscrito: false },
];

function PainelOficinas() {
  const [oficinas, setOficinas] = useState(oficinasIniciais);

  function alternarInscricao(id) {
    setOficinas((lista) =>
      lista.map((item) => (item.id === id ? { ...item, inscrito: !item.inscrito } : item)),
    );
  }

  return (
    <main>
      <h1>Oficinas da semana</h1>
      <p className="sub">Pratique composição mobile-first e foco visível.</p>
      <section className="u-grid u-cols-1 sm-cols-2" aria-label="Lista de oficinas">
        {oficinas.map((item) => (
          <article key={item.id} className="card">
            <h2>{item.titulo}</h2>
            <p>{item.horario}</p>
            <button
              type="button"
              className="btn u-alvo u-foco"
              data-inscrito={item.inscrito ? 'true' : 'false'}
              onClick={() => alternarInscricao(item.id)}
            >
              {item.inscrito ? 'Inscrito' : 'Inscrever'}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PainelOficinas />);`,
          },
        },
        {
          type: 'terminal',
          activityId: 'pratica-no-playground-e-vite:2',
          title: 'Prática real: ligando o Tailwind CSS num projeto React + Vite',
          task: 'Execute estes comandos no computador para criar um projeto React com Vite e instalar o plugin oficial do Tailwind.',
          prompt: '~$',
          steps: [
            {
              goal: 'Crie o projeto React com Vite chamado `painel-oficinas`.',
              command: [
                'npm create vite@latest painel-oficinas -- --template react',
                'npm create vite@latest painel-oficinas --template react',
              ],
              output: `Scaffolding project in /home/voce/painel-oficinas...

Done. Now run:

  cd painel-oficinas
  npm install
  npm run dev`,
              hint: 'Use `npm create vite@latest painel-oficinas -- --template react`.',
            },
            {
              goal: 'Entre na pasta e instale as dependências iniciais.',
              command: ['cd painel-oficinas && npm install'],
              output: 'added 154 packages in 4s',
              hint: 'Escreva `cd painel-oficinas && npm install`.',
              prompt: '~/painel-oficinas$',
            },
            {
              goal: 'Instale o Tailwind CSS e o plugin do Vite.',
              command: [
                'npm install tailwindcss @tailwindcss/vite',
                'npm i tailwindcss @tailwindcss/vite',
              ],
              output: 'added 12 packages in 2s',
              hint: 'Use `npm install tailwindcss @tailwindcss/vite`.',
            },
            {
              goal: 'Depois de configurar `vite.config.js` e `src/index.css` (abaixo), suba o Vite.',
              command: ['npm run dev'],
              output: `  VITE v6.3.5  ready in 380 ms

  ➜  Local:   http://localhost:5173/`,
              hint: 'Rode `npm run dev`.',
            },
          ],
        },
        {
          type: 'codeTabs',
          caption: 'Os 3 arquivos para ter Tailwind rodando de verdade no seu React + Vite',
          tabs: [
            {
              label: 'vite.config.js',
              language: 'js',
              code: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});`,
            },
            {
              label: 'src/index.css',
              language: 'css',
              code: `@import "tailwindcss";`,
            },
            {
              label: 'src/App.jsx',
              language: 'jsx',
              code: `import { useState } from 'react';

const oficinasIniciais = [
  { id: 1, titulo: 'HTML Semântico', horario: 'Terça, 19h', inscrito: false },
  { id: 2, titulo: 'Consultas SQL', horario: 'Quinta, 19h', inscrito: false },
  { id: 3, titulo: 'Testes no Frontend', horario: 'Sexta, 18h', inscrito: false },
];

export default function App() {
  const [oficinas, setOficinas] = useState(oficinasIniciais);

  function alternar(id) {
    setOficinas((lista) =>
      lista.map((o) => (o.id === id ? { ...o, inscrito: !o.inscrito } : o)),
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Oficinas da semana</h1>
      <p className="mt-1 text-sm text-slate-600">
        Exemplo com utilitários, foco acessível e grade mobile-first.
      </p>
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {oficinas.map((item) => (
          <article
            key={item.id}
            className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">{item.titulo}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.horario}</p>
            </div>
            <button
              type="button"
              onClick={() => alternar(item.id)}
              className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              {item.inscrito ? 'Inscrito' : 'Inscrever'}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}`,
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Classes utilitárias colocam espaçamento (`p-4`, `gap-3`), cor e borda direto no JSX; padrões repetidos viram componentes React.',
    'Nunca use `outline-none` sem alternativa: combine com `focus-visible:ring-2 focus-visible:ring-offset-2` e mantenha área de toque mínima (`min-h-[44px]`).',
    'Tailwind é mobile-first: classes sem prefixo valem no celular, e `sm:`, `md:` e `lg:` ampliam o layout em telas maiores.',
    'Para evitar rolagem horizontal no celular, use `w-full`/`max-w-*`, `min-w-0` e comece grades com `grid-cols-1`.',
    'No React + Vite, o setup oficial usa `@tailwindcss/vite` no `vite.config.js` e `@import "tailwindcss";` em `src/index.css`.',
  ],
  cards: [
    {
      id: 'tailwind-utilitarias',
      front: 'Como evitar que o JSX vire uma lista repetida de 15 classes utilitárias do Tailwind?',
      back: 'Extraindo um componente React reutilizável (como `<Cartao />` ou `<Botao />`) em vez de copiar as classes manualmente em vários arquivos.',
    },
    {
      id: 'tailwind-mobile-first',
      front: 'O que significa dizer que o Tailwind é mobile-first?',
      back: 'Classes sem prefixo (ex.: `grid-cols-1`) valem a partir de 0px (celular). Prefixos como `sm:` (640px), `md:` (768px) e `lg:` (1024px) só aplicam em telas maiores.',
    },
    {
      id: 'tailwind-focus-visible',
      front: 'Qual o jeito acessível de customizar o foco de um botão no Tailwind?',
      back: 'Usar `focus-visible:outline-none` junto com `focus-visible:ring-2 focus-visible:ring-offset-2` e cor de bom contraste, nunca `outline-none` sozinho.',
    },
    {
      id: 'tailwind-gap-vs-margin',
      front: 'Por que preferir `gap-4` no pai Flex/Grid em vez de `mr-4` nos filhos?',
      back: '`gap` só cria espaço entre itens vizinhos e também separa linhas quando há quebra (`flex-wrap`), sem deixar margem sobrando no último item.',
    },
    {
      id: 'tailwind-largura-fluida',
      front: 'Quais classes ajudam a evitar rolagem horizontal no celular (`360px`)?',
      back: 'Usar `w-full` com `max-w-*` em vez de largura fixa em `px`, `grid-cols-1` como base e `min-w-0` em filhos de Flex/Grid com texto longo.',
    },
    {
      id: 'tailwind-vite-setup',
      front: 'Quais dois arquivos você edita para ligar o Tailwind v4 num projeto React + Vite?',
      back: '`vite.config.js` (adicionando o plugin `tailwindcss()`) e `src/index.css` (com `@import "tailwindcss";`).',
    },
  ],
  mission: {
    title: 'Monte o Painel de Oficinas real com React + Vite + Tailwind',
    text: 'Tire o exercício do playground e rode o Tailwind de verdade no seu computador antes de partir para a entrega da faculdade.',
    steps: [
      'Crie um projeto React com Vite (`npm create vite@latest painel-oficinas -- --template react`) e instale `tailwindcss` e `@tailwindcss/vite`',
      'Ative o plugin em `vite.config.js` e coloque `@import "tailwindcss";` em `src/index.css`',
      'Implemente o Painel de Oficinas com `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, botões com `min-h-[44px]` e foco com `focus-visible:ring-2`',
      'Teste no navegador com `Tab` (foco visível em todos os botões) e no modo dispositivo em `360px` (sem rolagem horizontal)',
    ],
  },
  sources: [
    {
      title: 'Tailwind CSS: Estilizando com classes utilitárias',
      url: 'https://tailwindcss.com/docs/styling-with-utility-classes',
    },
    {
      title: 'Tailwind CSS: Design responsivo',
      url: 'https://tailwindcss.com/docs/responsive-design',
    },
    {
      title: 'Tailwind CSS: Hover, foco e outros estados',
      url: 'https://tailwindcss.com/docs/hover-focus-and-other-states',
    },
    {
      title: 'Tailwind CSS: Instalação com Vite',
      url: 'https://tailwindcss.com/docs/installation/using-vite',
    },
  ],
};
