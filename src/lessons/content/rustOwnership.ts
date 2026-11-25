import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Um título entra em uma função. Quando a função termina, quem ainda pode usar esse texto? A resposta depende de onde está a posse do valor. Nesta aula você acompanha uma transferência e reconhece o diagnóstico do compilador.',
  sections: [
    {
      id: 'escopo-e-posse',
      title: 'Acompanhe a vida de um valor',
      blocks: [
        {
          type: 'text',
          text: 'A posse, ou **ownership**, determina quem fica responsável por liberar os recursos de um valor. Cada valor tem um proprietário por vez. Quando o proprietário sai de escopo, Rust descarta o valor que ele ainda possui. Nas próximas aulas você verá como acessar o valor por referência.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'O bloco delimita onde a variável criada dentro dele existe',
          code: `fn main() {
    {
        let titulo = String::from("Fundamentos");
        println!("{titulo}");
    }
    println!("Sessão encerrada");
}`,
          output: 'Fundamentos\nSessão encerrada',
        },
        {
          type: 'quiz',
          activityId: 'fim-do-escopo',
          question: 'Quando o texto de titulo é descartado nesse exemplo?',
          options: [
            {
              text: 'Ao sair do bloco interno.',
              correct: true,
              feedback:
                'O proprietário está declarado dentro do bloco e ainda possui a String ao chegar à chave de fechamento.',
            },
            {
              text: 'Assim que a impressão começa.',
              feedback:
                'A impressão acessa o valor. O fim do escopo é que encerra a posse da variável.',
            },
          ],
        },
      ],
    },
    {
      id: 'move-e-copy',
      title: 'Separe transferência de posse de cópia',
      blocks: [
        {
          type: 'text',
          text: 'Em `let arquivado = titulo`, a posse da String vai para `arquivado`. A atribuição move o valor e o nome original fica indisponível para leitura. Tipos que implementam `Copy`, como `u32`, permitem que ambos os nomes tenham uma cópia do valor.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Erro proposital para investigar com cargo check',
          code: `fn main() {
    let titulo = String::from("Cargo");
    let arquivado = titulo;
    println!("{arquivado}");
    println!("{titulo}");
}`,
        },
        {
          type: 'classify',
          activityId: 'atribuir-valor',
          prompt: 'Indique o efeito de uma atribuição por valor nas expressões abaixo.',
          buckets: ['Move a posse', 'Copia o valor'],
          items: [
            { text: 'Uma variável que contém `String::from("Cargo")`', bucket: 0 },
            { text: 'Uma variável que contém `20_u32`', bucket: 1 },
            { text: 'Uma variável que contém `true`', bucket: 1 },
          ],
          explanation:
            'String gere um buffer próprio. u32 e bool implementam Copy, então podem ser copiados na atribuição.',
        },
        {
          type: 'quiz',
          activityId: 'nome-valido-depois-do-move',
          question: 'Qual nome ainda é válido para ler o conteúdo na primeira chamada de println!?',
          options: [
            {
              text: '`arquivado`',
              correct: true,
              feedback: '`arquivado` recebeu a posse do texto na linha anterior.',
            },
            {
              text: '`titulo`',
              feedback:
                'O valor já foi movido de `titulo`. O compilador indica a segunda impressão como uso após move.',
            },
          ],
        },
      ],
    },
    {
      id: 'transferir-e-duplicar',
      title: 'Transfira para uma função ou crie outro texto',
      blocks: [
        {
          type: 'text',
          text: 'Um parâmetro `String` recebe o valor por posse. Use `clone` quando fizer sentido manter dois textos próprios que podem mudar de forma independente. Clonar uma String copia o conteúdo. Se a função só precisa ler, na próxima aula você vai usar uma referência.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'O arquivo recebe a cópia e main segue com o original',
          code: `fn arquivar(titulo: String) {
    println!("Arquivo: {titulo}");
}

fn main() {
    let titulo = String::from("Cargo");
    arquivar(titulo.clone());
    println!("Catálogo: {titulo}");
}`,
          output: 'Arquivo: Cargo\nCatálogo: Cargo',
        },
        {
          type: 'fill',
          activityId: 'duplicar-string',
          language: 'rust',
          prompt: 'Faça a chamada passar uma cópia própria do título.',
          template: 'arquivar(titulo.[[clone]]());',
          explanation:
            '`clone` produz outra String com o mesmo conteúdo, e a chamada recebe esse novo valor.',
        },
      ],
    },
  ],
  recap: [
    'Identifico o dono de uma String em cada linha.',
    'Reconheço um uso após transferência de posse.',
    'Explico o custo de clonar uma String e quando duas cópias próprias fazem sentido.',
  ],
  cards: [
    {
      id: 'posse',
      front: 'O que acontece ao atribuir uma String a outro nome?',
      back: 'A posse do valor passa para o novo nome.',
    },
    {
      id: 'escopo',
      front: 'Quando Rust descarta uma String ainda possuída por uma variável?',
      back: 'Quando o proprietário sai de escopo.',
    },
    {
      id: 'copy',
      front: 'O que Copy permite na atribuição?',
      back: 'O valor é copiado e continua acessível pelos dois nomes.',
    },
    {
      id: 'clone',
      front: 'O que String::clone produz?',
      back: 'Outra String que possui uma cópia do conteúdo.',
    },
  ],
  mission: {
    title: 'Explique o primeiro erro de posse',
    text: 'Em um projeto de prática, execute o trecho com o move antes de usar clone.',
    steps: [
      'Anote a linha que criou o valor, a que transferiu a posse e a que fez o uso inválido.',
      'Corrija a execução removendo o uso inválido. Depois experimente o caso em que duas cópias fazem sentido e explique a diferença.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — ownership',
      url: 'https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html',
    },
  ],
};
