import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O catálogo já importa dados. Agora outro desenvolvedor precisa revisar sua mudança e o cliente quer conferir os resultados antes de usar a versão nova. Nesta aula, você prepara uma entrega com evidências de aceitação, testes reproduzíveis e um roteiro de volta.',
  sections: [
    {
      id: 'definir-aceite-da-entrega',
      title: 'Converta o pedido em uma tabela de aceitação',
      blocks: [
        {
          type: 'text',
          text: 'Parta da versão do catálogo da missão de API e banco. O cliente quer atualizar o nome de uma aula, preservar o progresso e rejeitar um lote inteiro se o segundo item for inválido. Use dados fictícios. Combine o que o cliente verá na resposta e o que sua equipe verificará no estado persistido.',
        },
        {
          type: 'table',
          caption: 'Casos para demonstrar na entrega',
          head: ['Cenário', 'Ação', 'Evidência de aceite'],
          rows: [
            [
              'Atualização válida',
              'O ID 7 estudado recebe novo título e o ID 8 entra no catálogo',
              'Título atualizado, progresso do 7 preservado e exatamente um registro de cada ID',
            ],
            [
              'Repetição',
              'Reenvie a mesma operação com a mesma chave',
              'Resposta conforme o contrato e estado igual ao observado depois da primeira aplicação',
            ],
            [
              'Falha de validação',
              'O primeiro item do lote é válido e o segundo tem título vazio',
              'Resposta de erro conforme o contrato e estado igual ao que existia antes do envio',
            ],
          ],
        },
        {
          type: 'quiz',
          activityId: 'evidencia-da-entrega',
          question: 'Qual evidência demonstra a terceira linha da tabela?',
          options: [
            {
              text: 'A resposta de erro acompanhada da comparação do estado antes e depois.',
              correct: true,
              feedback:
                'A resposta explica a falha. O estado mostra se houve uma gravação parcial.',
            },
            {
              text: 'Apenas uma captura do status retornado.',
              feedback: 'O status pode estar certo e os dados ainda terem sido alterados.',
            },
          ],
        },
      ],
    },
    {
      id: 'preparar-verificacao-automatizada',
      title: 'Deixe uma sequência executável para o revisor',
      blocks: [
        {
          type: 'text',
          text: 'Registre a versão do Rust, os comandos para preparar o banco e os dados usados. Para um aplicativo Cargo, inclua `Cargo.lock` no repositório e use `--locked` nas verificações que resolvem dependências. Rode no computador e use a mesma sequência na integração contínua. Instale os componentes `rustfmt` e `clippy` da ferramenta Rust usada no projeto.',
        },
        {
          type: 'code',
          language: 'bash',
          caption: 'Comandos de verificação na raiz do projeto',
          code: 'set -eu\ncargo fmt --all -- --check\ncargo clippy --locked --all-targets -- -D warnings\ncargo test --locked\ncargo build --release --locked\ngit diff --check',
        },
        {
          type: 'classify',
          activityId: 'o-que-cada-comando-verifica',
          prompt: 'Associe cada evidência ao comando que a produz.',
          buckets: ['Formatação', 'Lints', 'Comportamento testado', 'Compilação para entrega'],
          items: [
            { text: 'cargo fmt --all -- --check', bucket: 0 },
            { text: 'cargo clippy --locked --all-targets -- -D warnings', bucket: 1 },
            { text: 'cargo test --locked', bucket: 2 },
            { text: 'cargo build --release --locked', bucket: 3 },
          ],
          explanation:
            'Formatação, análise, testes e compilação cobrem aspectos diferentes do mesmo conjunto de mudanças.',
        },
        {
          type: 'fill',
          activityId: 'resolver-com-lockfile',
          language: 'bash',
          prompt: 'Complete a opção que exige que Cargo use o lockfile existente.',
          template: 'cargo test [[--locked]]',
          explanation:
            'A verificação falha se precisar mudar o lockfile. Isso ajuda a reproduzir a resolução usada na entrega.',
        },
      ],
    },
    {
      id: 'revisao-publicacao-e-volta',
      title: 'Mostre como revisar a mudança e voltar se necessário',
      blocks: [
        {
          type: 'text',
          text: 'Apresente primeiro o teste que falha na versão anterior e a causa localizada no código. Mostre a mudança e execute a matriz de aceite. Se usou IA, registre a hipótese ou sugestão que você verificou de forma independente. Em um ambiente de teste, experimente voltar ao binário anterior com o esquema expandido. Declare quais dados precisam continuar compatíveis e como confirmar que voltar funcionou.',
        },
        {
          type: 'order',
          activityId: 'demonstracao-para-outro-desenvolvedor',
          prompt: 'Ordene a demonstração para o revisor.',
          items: [
            'Reproduzir a falha original com dados controlados',
            'Mostrar a regra e rodar os critérios na versão corrigida',
            'Registrar comandos, resultados e a forma de voltar',
          ],
          explanation:
            'O roteiro liga o problema, a mudança e a prova. A instrução de volta precisa ser exercitada em ambiente de teste.',
        },
      ],
    },
  ],
  recap: [
    'Transformo o pedido em casos verificáveis com exemplos.',
    'Reproduzo a falha antiga e automatizo os resultados da correção.',
    'Entrego evidências, instruções e uma volta demonstrável para quem mantém a aplicação.',
  ],
  cards: [
    {
      id: 'aceite',
      front: 'O que deve acompanhar a resposta da API em um teste de atomicidade?',
      back: 'A comparação do estado persistido antes e depois da operação.',
    },
    {
      id: 'locked',
      front: 'Quando cargo --locked deve falhar?',
      back: 'Quando falta o lockfile ou a resolução precisa modificá-lo.',
    },
    {
      id: 'regressao',
      front: 'Como demonstrar que um teste está ligado à falha corrigida?',
      back: 'Mostre que ele falha na versão anterior com a mesma entrada e passa após a mudança.',
    },
    {
      id: 'volta',
      front: 'Que evidência ajuda a comprovar uma volta da aplicação?',
      back: 'Rodar a versão anterior com o esquema disponível e verificar os casos essenciais e a integridade dos dados.',
    },
  ],
  mission: {
    title: 'Entregue uma mudança pronta para revisão',
    text: 'Volte à trilha, registre a prática e abra a missão final. Prepare um diff de tamanho revisável para o catálogo existente.',
    steps: [
      'Escreva o teste de regressão antes da correção e registre o resultado nas duas versões.',
      'Demonstre um sucesso, uma falha e a preservação dos dados para outra pessoa.',
      'Entregue um roteiro com comandos, critérios de aceite, evidências, limitações e a verificação de volta.',
    ],
  },
  sources: [
    {
      title: 'Cargo Book — cargo test e lockfile',
      url: 'https://doc.rust-lang.org/cargo/commands/cargo-test.html',
    },
    {
      title: 'Clippy Book — execução em projetos Cargo',
      url: 'https://doc.rust-lang.org/clippy/usage.html',
    },
  ],
};
