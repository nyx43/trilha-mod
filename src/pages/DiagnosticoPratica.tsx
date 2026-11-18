import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CodeBlock } from '../components/Guide/CodeBlock';
import { GuideBlockView } from '../components/Guide/GuideBlock';
import { diagnosticoWebDownload } from '../percurso/apiReactTailwind';
import '../components/Guide/guide.css';
import '../components/Lesson/lesson.css';

const desafios = [
  {
    numero: 1,
    titulo: 'Rota errada (404)',
    sintoma:
      'A tabela não carrega e a página informa que a API respondeu 404, embora o selo continue verde com “API ok”.',
    acao: 'Depois de ativar o desafio, recarregue a página com F5 e observe a lista.',
    rede: 'Em Rede, filtre Fetch/XHR, selecione o GET com status 404 e examine a URL completa e a aba Resposta.',
    dicas: [
      'Leia o JSON na aba Resposta da requisição 404.',
      'Compare a rota solicitada com as rotas em http://localhost:3101/api/saude.',
      'Compare singular e plural na URL; veja a função urls() em public/nucleo.js.',
    ],
    evidencia:
      'Registre um print do GET com URL, status 404 e corpo da resposta; anote também a rota correta apresentada em /api/saude.',
    solucao:
      'O frontend pediu /api/pedido, mas a API expõe /api/pedidos. A função urls() em public/nucleo.js monta a URL. Em um projeto real, alinhe a URL ao contrato da API; o selo verde mostra que a API estava acessível.',
  },
  {
    numero: 2,
    titulo: 'Cadastro rejeitado (400)',
    sintoma:
      'Mesmo com o formulário preenchido corretamente, aparece “Cadastro rejeitado (400)” e nenhum pedido é criado.',
    acao: 'Depois de ativar o desafio, recarregue com F5, preencha todos os campos com dados válidos e clique em Registrar pedido.',
    rede: 'Em Rede, filtre Fetch/XHR e selecione o POST /api/pedidos com status 400. Compare Carga de solicitação (Payload) com Resposta.',
    dicas: [
      'Leia os campos indicados em detalhes na resposta 400.',
      'Compare os nomes dos campos enviados na carga com os campos que a API espera.',
      'Confira nome, cliente e retiradaEm na função montarPayload() em public/nucleo.js.',
    ],
    evidencia:
      'Registre prints ou cópias da carga e da resposta do POST, incluindo o status e os campos indicados como inválidos.',
    solucao:
      'O corpo envia nome em vez de cliente e omite retiradaEm. A API valida o contrato e responde 400 com detalhes. Em um projeto real, ajuste montarPayload() para enviar cliente e retiradaEm, mantendo a validação na API.',
  },
];

export default function DiagnosticoPratica() {
  useEffect(() => {
    document.title = 'Prática de diagnóstico · Trilha Info';
  }, []);
  return (
    <article className="guide-page lesson-page" aria-labelledby="diagnostico-title">
      <header className="guide-hero lesson-hero">
        <nav className="guide-crumbs" aria-label="Você está em">
          <ol>
            <li>
              <Link to="/">Início</Link>
            </li>
            <li>
              <Link to="/percurso/api-react-tailwind">Percurso Web</Link>
            </li>
            <li>Diagnóstico</li>
          </ol>
        </nav>
        <p className="lesson-number">Prática opcional · Sem IA</p>
        <h1 id="diagnostico-title">Diagnóstico de frontend e API</h1>
        <p className="guide-summary">
          Investigue duas falhas reais no painel Rede, registre suas evidências e confira a solução
          depois de tentar.
        </p>
      </header>
      <div className="guide-body lesson-body" style={{ maxWidth: 820 }}>
        <div className="lessons-actions">
          <a href={diagnosticoWebDownload} download className="lesson-button">
            Baixar laboratório Web (.zip)
          </a>
        </div>
        <GuideBlockView
          guideId="diagnostico-preparo"
          block={{
            type: 'callout',
            tone: 'tip',
            title: 'Prepare o laboratório separado',
            text: 'Extraia o ZIP e abra um terminal na pasta laboratório-web-diagnostico. Use Node.js 18.17 ou superior para iniciar os servidores. Depois de baixar o ZIP, você pode praticar offline.',
          }}
        />
        <CodeBlock language="bash" caption="No terminal" code="npm run dev" />
        <p className="guide-text">
          Abra <a href="http://localhost:5180">http://localhost:5180</a>. Em outro terminal, na
          mesma pasta, execute os comandos de ativação e restauração abaixo. Abra F12 →{' '}
          <strong>Rede</strong> (Network) e filtre <strong>Fetch/XHR</strong>. Ative um desafio por
          vez; após mudar o estado, recarregue a página com F5. As portas indicadas são as padrão do
          laboratório.
        </p>
        {desafios.map((desafio) => (
          <section
            className="guide-section lesson-section"
            key={desafio.numero}
            aria-labelledby={`desafio-${desafio.numero}`}
          >
            <h2 id={`desafio-${desafio.numero}`}>
              <span aria-hidden="true">0{desafio.numero}</span>
              {desafio.titulo}
            </h2>
            <div className="lesson-mission">
              <h3>Sintoma</h3>
              <p className="guide-text">{desafio.sintoma}</p>
              <h3>Ative e reproduza</h3>
              <CodeBlock
                language="bash"
                caption={`Ativar desafio ${desafio.numero}`}
                code={`npm run desafio -- ativar ${desafio.numero}`}
              />
              <p className="guide-text">{desafio.acao}</p>
              <h3>O que procurar na Rede</h3>
              <p className="guide-text">{desafio.rede}</p>
              <h3>Dicas graduais</h3>
              <p className="guide-text">Abra uma dica por vez, apenas se precisar.</p>
              {desafio.dicas.map((dica, index) => (
                <details className="lesson-reveal" key={dica}>
                  <summary>Dica {index + 1}</summary>
                  <div>
                    <p>{dica}</p>
                  </div>
                </details>
              ))}
              <h3>Evidência para registrar</h3>
              <p className="guide-text">
                {desafio.evidencia} Use o modelo em <code>anotacoes/modelo-evidencia.md</code> e
                salve em <code>anotacoes/evidencias/</code>.
              </p>
              <h3>Voltar ao fluxo normal</h3>
              <CodeBlock
                language="bash"
                caption={`Desativar desafio ${desafio.numero}`}
                code={`npm run desafio -- desativar ${desafio.numero}`}
              />
              <p className="guide-text">
                Recarregue com F5 e confira que a lista e o cadastro voltaram a funcionar. Para
                desligar todos os cenários, use <code>npm run desafio -- restaurar</code>.
              </p>
              <details className="lesson-reveal">
                <summary>Solução — abra depois de tentar</summary>
                <div>
                  <p>{desafio.solucao}</p>
                </div>
              </details>
            </div>
          </section>
        ))}
        <div className="lessons-actions">
          <Link
            className="lesson-button-quiet"
            to="/percurso/api-react-tailwind/integracao-front-api"
          >
            Voltar à integração
          </Link>
          <Link className="lesson-button" to="/percurso/api-react-tailwind/tailwind-na-pratica">
            Continuar para Tailwind
          </Link>
        </div>
      </div>
    </article>
  );
}
