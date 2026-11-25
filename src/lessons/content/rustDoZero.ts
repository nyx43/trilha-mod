import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Antes de mexer no catálogo de estudos da primeira missão, você vai criar um programa de terminal, rodá-lo e usar o compilador para corrigir um erro. Leve o comando e a saída observada para o seu registro de prática.',
  sections: [
    {
      id: 'projeto-cargo',
      title: 'Crie o projeto no terminal',
      blocks: [
        {
          type: 'text',
          text: 'O compilador `rustc` lê código Rust e produz um programa executável. **Cargo** organiza o projeto, chama o compilador e executa o programa ou os testes. Confira a instalação com `rustc --version` e `cargo --version`. Se faltar algum comando, abra o guia oficial de instalação ao fim da aula, instale com Rustup e abra um terminal novo.',
        },
        {
          type: 'code',
          language: 'bash',
          caption: 'Comandos para executar no seu computador',
          code: 'cargo new catalogo\ncd catalogo\ncargo run',
        },
        {
          type: 'text',
          text: 'Abra a pasta `catalogo` no editor. `Cargo.toml` é o manifesto que declara nome, edição e dependências. `src/main.rs` é o arquivo do programa. Rode os comandos Cargo na pasta que contém `Cargo.toml`. As linhas de compilação aparecem no terminal junto com a saída do programa.',
        },
        {
          type: 'order',
          activityId: 'ordem-cargo',
          prompt: 'Ordene os comandos para criar e executar o projeto pela primeira vez.',
          items: ['`cargo new catalogo`', '`cd catalogo`', '`cargo run`'],
          explanation:
            'Cargo cria a pasta e o manifesto. Você entra na pasta e executa o binário definido naquele projeto.',
        },
      ],
    },
    {
      id: 'programa-e-valores',
      title: 'Leia o programa da entrada à saída',
      blocks: [
        {
          type: 'code',
          language: 'rust',
          caption: 'Substitua o conteúdo de src/main.rs',
          code: `fn main() {
    let titulo = "Introdução ao Rust";
    let minutos: u32 = 15;
    println!("{titulo} dura {minutos} minutos.");
}`,
          output: 'Introdução ao Rust dura 15 minutos.',
        },
        {
          type: 'text',
          text: 'A execução começa em `fn main()`. As chaves delimitam o corpo da função. `let` cria um nome para um valor. O compilador infere `&str` para o texto entre aspas e confere se `15` cabe em `u32`, um inteiro sem sinal. `println!` é uma macro: ela insere os valores nas chaves do texto e imprime uma linha.',
        },
        {
          type: 'quiz',
          activityId: 'saida-do-programa',
          question:
            'Se trocar o valor de `minutos` para `20`, o que aparece depois de rodar `cargo run`?',
          options: [
            {
              text: 'Introdução ao Rust dura 20 minutos.',
              correct: true,
              feedback: 'A macro lê o valor atual de `minutos` e o insere no texto formatado.',
            },
            {
              text: 'Introdução ao Rust dura 15 minutos.',
              feedback:
                'Cargo recompila o arquivo salvo quando necessário. A saída reflete o valor escrito na versão atual.',
            },
            {
              text: 'Introdução ao Rust dura {minutos} minutos.',
              feedback:
                'Dentro do texto de `println!`, `{minutos}` é o campo que será preenchido com o valor.',
            },
          ],
        },
        {
          type: 'fill',
          activityId: 'formate-a-saida',
          language: 'rust',
          prompt: 'Complete o campo de formatação para imprimir a duração de uma aula.',
          template:
            'fn main() {\n    let duracao = 20;\n    println!("Aula de [[{duracao}]] minutos");\n}',
          explanation: 'As chaves dizem à macro onde inserir o valor da variável `duracao`.',
        },
      ],
    },
    {
      id: 'diagnostico',
      title: 'Use o compilador para corrigir o erro',
      blocks: [
        {
          type: 'code',
          language: 'rust',
          caption: 'Erro proposital para investigar com cargo check',
          code: `fn main() {
    let minutos: u32 = "15";
    println!("{minutos}");
}`,
        },
        {
          type: 'text',
          text: 'Rode `cargo check`. Procure o primeiro erro, o arquivo e a linha apontada. Neste caso, o diagnóstico indica que o valor esperado é `u32` e o encontrado é `&str`. Se o dado é uma duração escrita diretamente no programa, tire as aspas para produzir o número `15`. Rode `cargo check` de novo e depois `cargo run` para verificar a saída.',
        },
        {
          type: 'classify',
          activityId: 'comandos-e-sintaxe',
          prompt: 'Classifique os comandos conforme o resultado que você quer obter.',
          buckets: ['Verificar o código', 'Executar o programa', 'Rodar os testes'],
          items: [
            { text: '`cargo check`', bucket: 0 },
            { text: '`cargo run`', bucket: 1 },
            { text: '`cargo test`', bucket: 2 },
          ],
          explanation:
            'Use `check` para verificar se o código passa pelas checagens do compilador. `run` executa o programa e `test` executa as funções de teste.',
        },
      ],
    },
  ],
  recap: [
    'Leio o manifesto em Cargo.toml e encontro o ponto de entrada em src/main.rs.',
    'Consigo usar variáveis e formatar uma linha com println!.',
    'Leio os tipos esperado e encontrado no primeiro erro e verifico a correção com Cargo.',
  ],
  cards: [
    {
      id: 'manifesto',
      front: 'O que fica em Cargo.toml?',
      back: 'Os metadados do projeto e a lista de dependências.',
    },
    {
      id: 'inicio',
      front: 'Onde um programa binário Rust começa?',
      back: 'Na função main, criada por Cargo em src/main.rs.',
    },
    {
      id: 'check',
      front: 'Qual comando verifica o código sem executar o programa?',
      back: 'cargo check.',
    },
    {
      id: 'tipo',
      front: 'Qual o tipo do literal "15" no exemplo?',
      back: 'Uma fatia de texto, &str. O literal 15 pode ser inferido como um inteiro.',
    },
  ],
  mission: {
    title: 'Mostre a duração de uma aula',
    text: 'Escolha um título e uma duração. A saída deve usar os valores guardados nas variáveis.',
    steps: [
      'Crie o projeto, edite `src/main.rs` e rode `cargo run`. Copie a saída observada.',
      'Introduza o erro de tipo com aspas na duração. Anote a linha indicada e os dois tipos.',
      'Corrija o erro e rode novamente para conferir a saída.',
    ],
  },
  sources: [
    {
      title: 'Instalação oficial do Rust',
      url: 'https://doc.rust-lang.org/book/ch01-01-installation.html',
    },
    {
      title: 'Rust Book — primeiros passos com Cargo',
      url: 'https://doc.rust-lang.org/book/ch01-03-hello-cargo.html',
    },
  ],
};
