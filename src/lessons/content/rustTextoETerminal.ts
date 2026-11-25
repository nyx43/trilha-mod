import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O primeiro programa tinha o título da aula escrito no arquivo. Agora o programa recebe esse valor do terminal e decide o que fazer quando alguém aperta Enter sem preencher o título.',
  sections: [
    {
      id: 'texto-proprio-e-emprestado',
      title: 'Crie e mostre texto',
      blocks: [
        {
          type: 'text',
          text: '`String` guarda texto próprio e pode crescer. `&str` é uma fatia de texto que referencia bytes válidos em UTF-8. Literais entre aspas duplas já são fatias e podem servir de entrada para `String::from`. Use `push_str` para anexar texto a uma `String` mutável.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Monte uma linha a partir de duas partes',
          code: `fn main() {
    let mut titulo = String::from("Rust");
    titulo.push_str(" no terminal");
    println!("{titulo}");
}`,
          output: 'Rust no terminal',
        },
        {
          type: 'fill',
          activityId: 'acrescentar-texto',
          language: 'rust',
          prompt: 'Complete o método que acrescenta uma fatia à String.',
          template: 'titulo.[[push_str]](" no terminal");',
          explanation: '`push_str` anexa os bytes UTF-8 da fatia ao final da String.',
        },
      ],
    },
    {
      id: 'receber-titulo',
      title: 'Leia uma linha e valide a entrada',
      blocks: [
        {
          type: 'text',
          text: '`read_line` lê do terminal e anexa o texto ao buffer. O Enter costuma incluir uma quebra de linha. Use `trim` para obter uma fatia sem os espaços das bordas e `is_empty` para verificar se sobrou um título. Nesta aula `expect` encerra a execução com uma mensagem em caso de falha de leitura. Você vai aprender a tratar essa falha na aula de Result.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Rode com cargo run e digite um título',
          code: `use std::io;

fn main() {
    println!("Qual aula você quer estudar?");
    let mut entrada = String::new();
    io::stdin().read_line(&mut entrada).expect("falha ao ler o título");
    let titulo = entrada.trim();
    if titulo.is_empty() {
        println!("Digite um título.");
    } else {
        println!("Título registrado: {titulo}");
    }
}`,
        },
        {
          type: 'order',
          activityId: 'entrada-ate-saida',
          prompt: 'Ordene o fluxo que transforma a entrada em mensagem para o aluno.',
          items: [
            'Ler uma linha no buffer',
            'Remover os espaços das bordas com trim',
            'Verificar se sobrou um título',
            'Mostrar uma mensagem para o caso observado',
          ],
          explanation:
            'A validação usa o texto normalizado. Assim, uma linha com espaços e Enter recebe a mensagem de título vazio.',
        },
        {
          type: 'quiz',
          activityId: 'linha-de-espacos',
          question: 'Qual mensagem final aparece se a pessoa digitar três espaços e apertar Enter?',
          options: [
            {
              text: 'Digite um título.',
              correct: true,
              feedback:
                '`trim` remove os espaços e a quebra de linha das bordas. A fatia fica vazia.',
            },
            {
              text: 'Título registrado:',
              feedback:
                'O código chega a essa mensagem quando a fatia tem conteúdo depois do trim.',
            },
          ],
        },
      ],
    },
    {
      id: 'acentos-e-tamanho',
      title: 'Diferencie bytes de caracteres na hora de contar',
      blocks: [
        {
          type: 'text',
          text: '`len` conta bytes. `chars().count()` conta valores escalares Unicode. Um `é` pré-composto ocupa dois bytes em UTF-8 e conta como um valor escalar. Para limites que medem o que a pessoa enxerga como um caractere, considere que acentos combinados e alguns emojis podem reunir vários valores escalares.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'O título tem quatro valores escalares e cinco bytes',
          code: `fn main() {
    let titulo = "Café";
    println!("Bytes: {}", titulo.len());
    println!("Valores escalares: {}", titulo.chars().count());
}`,
          output: 'Bytes: 5\nValores escalares: 4',
        },
        {
          type: 'quiz',
          activityId: 'medida-em-bytes',
          question: 'Qual medição serve para conferir o tamanho em bytes de um texto UTF-8?',
          options: [
            {
              text: '`texto.len()`',
              correct: true,
              feedback: '`len` devolve o número de bytes na string.',
            },
            {
              text: '`texto.chars().count()`',
              feedback: 'Esta expressão conta valores escalares. Alguns ocupam vários bytes.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Crio texto em String e leio uma linha em um buffer mutável.',
    'Valido a entrada usando trim e is_empty.',
    'Escolho a contagem de acordo com a unidade do requisito.',
  ],
  cards: [
    {
      id: 'string',
      front: 'Para que serve String?',
      back: 'Guardar texto UTF-8 próprio, com tamanho que pode aumentar.',
    },
    {
      id: 'ler',
      front: 'O que read_line escreve no buffer?',
      back: 'A próxima linha disponível, incluindo a quebra de linha quando presente.',
    },
    {
      id: 'trim',
      front: 'O que trim remove?',
      back: 'Espaços em branco das bordas. Ele devolve uma fatia do original.',
    },
    { id: 'tamanho', front: 'Que unidade len devolve para uma string?', back: 'Número de bytes.' },
  ],
  mission: {
    title: 'Aceite títulos com acentos e valide entradas vazias',
    text: 'Use o terminal para conferir o comportamento com dados digitados.',
    steps: [
      'Digite `  Café  ` e confira que a mensagem usa `Café`.',
      'Repita com uma linha vazia e outra só com espaços. Registre o resultado dos três casos.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — texto em UTF-8',
      url: 'https://doc.rust-lang.org/book/ch08-02-strings.html',
    },
    {
      title: 'Biblioteca padrão — Stdin',
      url: 'https://doc.rust-lang.org/std/io/struct.Stdin.html',
    },
  ],
};
