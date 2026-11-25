import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Uma função pode ler um título e outra pode editar o mesmo título. Você vai expressar as duas permissões nas assinaturas e acompanhar o momento em que o compilador libera cada empréstimo.',
  sections: [
    {
      id: 'emprestimo-para-leitura',
      title: 'Empreste o texto para uma função',
      blocks: [
        {
          type: 'text',
          text: 'A assinatura `fn mostrar(titulo: &str)` pede uma fatia compartilhada de texto. A função pode ler o valor enquanto o empréstimo for válido. O chamador conserva a posse da String. Você pode passar `&titulo` quando o chamador tem uma String ou passar um literal diretamente.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Use o título antes e depois de emprestá-lo',
          code: `fn mostrar(titulo: &str) {
    println!("Prévia: {titulo}");
}

fn main() {
    let titulo = String::from("Catálogo");
    mostrar(&titulo);
    println!("Original: {titulo}");
}`,
          output: 'Prévia: Catálogo\nOriginal: Catálogo',
        },
        {
          type: 'fill',
          activityId: 'pedir-uma-fatia',
          language: 'rust',
          prompt: 'A função aceita texto emprestado. Complete o tipo do parâmetro.',
          template: 'fn mostrar(titulo: [[&str]]) {\n    println!("{titulo}");\n}',
          explanation: '`&str` aceita um literal e também uma fatia emprestada de String.',
        },
      ],
    },
    {
      id: 'emprestimo-para-alteracao',
      title: 'Dê permissão de alterar com &mut',
      blocks: [
        {
          type: 'text',
          text: '`&mut String` permite editar a String do chamador. Enquanto o empréstimo exclusivo está em uso, Rust impede outros acessos concorrentes ao mesmo valor. Com uma referência compartilhada ativa, continue lendo ou termine de usá-la antes de pegar a referência mutável.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'A função altera o título existente',
          code: `fn arquivar(titulo: &mut String) {
    titulo.push_str(" [arquivado]");
}

fn main() {
    let mut titulo = String::from("Cargo");
    arquivar(&mut titulo);
    println!("{titulo}");
}`,
          output: 'Cargo [arquivado]',
        },
        {
          type: 'classify',
          activityId: 'permissoes-na-assinatura',
          prompt: 'Associe a assinatura à permissão que a função recebe.',
          buckets: ['Ler o texto emprestado', 'Editar a String emprestada', 'Receber a posse'],
          items: [
            { text: '`titulo: &str`', bucket: 0 },
            { text: '`titulo: &mut String`', bucket: 1 },
            { text: '`titulo: String`', bucket: 2 },
          ],
          explanation:
            'A assinatura revela o que a função pode fazer e ajuda a prever o que o chamador poderá usar depois.',
        },
        {
          type: 'quiz',
          activityId: 'acessos-simultaneos',
          question:
            'Você tem uma referência compartilhada que ainda será usada. Quando pode criar uma referência mutável ao mesmo valor?',
          options: [
            {
              text: 'Depois do último uso da referência compartilhada.',
              correct: true,
              feedback:
                'A partir daí o compilador pode encerrar o empréstimo de leitura e permitir a edição exclusiva.',
            },
            {
              text: 'Enquanto as duas referências ainda serão usadas.',
              feedback:
                'Compartilhar a leitura e permitir alterações ao mesmo tempo quebraria as garantias do empréstimo.',
            },
          ],
        },
      ],
    },
    {
      id: 'fatias-dos-dados',
      title: 'Leia a parte necessária de uma coleção',
      blocks: [
        {
          type: 'text',
          text: '`&[u32]` empresta uma sequência de números. O mesmo parâmetro aceita uma fatia de array e uma fatia de vetor. Em `&duracoes[0..2]`, o índice inicial está incluído e o final é exclusivo. Use o fatiamento por índices quando já sabe que o intervalo cabe.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Some apenas os dois primeiros valores',
          code: `fn somar(duracoes: &[u32]) -> u32 {
    let mut total = 0;
    for &minutos in duracoes {
        total += minutos;
    }
    total
}

fn main() {
    let duracoes = [15, 20, 35];
    println!("{}", somar(&duracoes[0..2]));
}`,
          output: '35',
        },
        {
          type: 'quiz',
          activityId: 'indices-da-fatia',
          question: 'Quais durações aparecem na fatia `&duracoes[0..2]`?',
          options: [
            {
              text: '15 e 20',
              correct: true,
              feedback: 'O intervalo inclui os índices 0 e 1. O índice 2 fica fora.',
            },
            {
              text: '15, 20 e 35',
              feedback:
                'Para incluir o último item, você pode usar o comprimento 3 como fim exclusivo ou passar o array inteiro por referência.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Empresto o texto com &str quando a função só precisa ler.',
    'Uso &mut String para dar permissão de alterar o texto existente.',
    'Uma fatia permite ler uma sequência sem consumir sua coleção.',
  ],
  cards: [
    { id: 'leitura', front: 'Qual tipo pede texto compartilhado?', back: '&str.' },
    {
      id: 'mutavel',
      front: 'Que tipo permite adicionar texto à String do chamador?',
      back: '&mut String.',
    },
    {
      id: 'intervalo',
      front: 'Quais índices o intervalo 0..2 contém?',
      back: '0 e 1. O fim é exclusivo.',
    },
    {
      id: 'fatia',
      front: 'O que &[u32] representa?',
      back: 'Um empréstimo compartilhado de uma sequência de inteiros u32.',
    },
  ],
  mission: {
    title: 'Leia e edite sem perder o título',
    text: 'Use um título criado em main e deixe as permissões visíveis nas assinaturas.',
    steps: [
      'Chame uma função que lê o título por `&str` e mostre que main ainda consegue usá-lo.',
      'Chame outra função com `&mut String` para acrescentar um rótulo. Confira a saída antes e depois.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — referências e empréstimos',
      url: 'https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html',
    },
    { title: 'Rust Book — fatias', url: 'https://doc.rust-lang.org/book/ch04-03-slices.html' },
  ],
};
