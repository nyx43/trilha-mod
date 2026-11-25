import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'A normalização do catálogo passou a copiar todos os títulos em uma importação. Escolha uma interface que empreste os dados que já servem e produza um valor próprio somente quando a transformação exigir.',
  sections: [
    {
      id: 'escolher-contrato',
      title: 'Use a assinatura para comunicar quem possui o resultado',
      blocks: [
        {
          type: 'text',
          text: 'Ao devolver `&str`, você devolve uma fatia emprestada de um texto que já existe. Ao devolver `String`, quem chama passa a possuir o resultado e pode guardá-lo depois que a entrada for descartada. `Cow<str>` representa os dois caminhos. O lifetime limita o uso da variante emprestada.',
        },
        {
          type: 'classify',
          activityId: 'tipos-de-retorno',
          prompt: 'Associe cada contrato ao tipo de retorno mais direto.',
          buckets: ['`&str`', '`String`', '`Cow<str>`'],
          items: [
            { text: 'Devolver apenas uma fatia da entrada, como em trim', bucket: 0 },
            { text: 'Guardar o texto após descartar o buffer original', bucket: 1 },
            {
              text: 'Emprestar se o texto já serve e devolver uma cópia transformada nos outros casos',
              bucket: 2,
            },
          ],
          explanation:
            'Os tipos descrevem a posse que o chamador recebe. Cow deixa os dois caminhos explícitos na mesma interface.',
        },
      ],
    },
    {
      id: 'normalizar-com-cow',
      title: 'Empreste no caminho que só recorta',
      blocks: [
        {
          type: 'text',
          text: 'A regra abaixo remove espaços das bordas e converte somente maiúsculas ASCII. Ela mantém os demais valores Unicode. `trim` devolve uma fatia, então entradas sem maiúsculas ASCII podem continuar emprestadas. Quando há conversão, `to_ascii_lowercase` produz uma String própria.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Observe as duas variantes e o texto produzido',
          code: `use std::borrow::Cow;

fn normalizar(entrada: &str) -> Cow<'_, str> {
    let texto = entrada.trim();
    if texto.bytes().any(|byte| byte.is_ascii_uppercase()) {
        Cow::Owned(texto.to_ascii_lowercase())
    } else {
        Cow::Borrowed(texto)
    }
}

fn main() {
    for entrada in ["  edição  ", "  RUST É útil  "] {
        let texto = normalizar(entrada);
        match texto {
            Cow::Borrowed(fatia) => println!("Emprestado: {fatia}"),
            Cow::Owned(proprio) => println!("Próprio: {proprio}"),
        }
    }
}`,
          output: 'Emprestado: edição\nPróprio: rust É útil',
        },
        {
          type: 'fill',
          activityId: 'retornar-fatia-existente',
          language: 'rust',
          prompt: 'Complete a variante que devolve a fatia produzida por trim.',
          template:
            "fn aparar(texto: &str) -> Cow<'_, str> {\n    Cow::[[Borrowed]](texto.trim())\n}",
          explanation: 'A fatia referencia os bytes válidos da entrada, que continua com seu dono.',
        },
        {
          type: 'quiz',
          activityId: 'regra-com-acentos',
          question: 'Qual texto o exemplo devolve para `"  RUST É útil  "`?',
          options: [
            {
              text: '`"rust É útil"`',
              correct: true,
              feedback:
                'O contrato aplica a regra de maiúsculas só a ASCII. O acento continua como recebido.',
            },
            {
              text: '`"rust é útil"`',
              feedback:
                'A conversão Unicode completa seria uma regra diferente e poderia mudar este resultado.',
            },
          ],
        },
      ],
    },
    {
      id: 'ownership-na-fronteira',
      title: 'Materialize a posse no ponto que precisa dela',
      blocks: [
        {
          type: 'text',
          text: 'Uma rotina que imprime o título na mesma chamada pode usar `&str`. Uma tarefa que vai armazená-lo depois que o buffer for descartado precisa do valor próprio. `into_owned` aproveita a String já produzida na variante própria e copia a fatia da variante emprestada. Meça a frequência dos dois caminhos antes de propor uma redução de alocações.',
        },
        {
          type: 'quiz',
          activityId: 'guardar-fora-do-buffer',
          question:
            'O chamador quer registrar o título em uma fila depois que liberar a linha original. Qual operação prepara o valor?',
          options: [
            {
              text: '`normalizar(&linha).into_owned()`',
              correct: true,
              feedback: 'O resultado é uma String independente da vida útil da linha.',
            },
            {
              text: 'Emprestar uma fatia da linha e liberar a linha imediatamente.',
              feedback: 'O empréstimo precisa continuar válido até o último uso da fatia.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Escolho retornos com posse conforme o uso do chamador.',
    'Uso Cow para expressar o caminho emprestado e o caminho próprio.',
    'Separo a regra de normalização do ponto em que os dados precisam ser copiados.',
  ],
  cards: [
    {
      id: 'lifetime',
      front: 'O que limita o uso de Cow::Borrowed?',
      back: 'O tempo de validade dos dados emprestados.',
    },
    { id: 'fatia', front: 'O que trim produz em &str?', back: 'Uma fatia da string original.' },
    { id: 'owned', front: 'Qual variante de Cow possui a String?', back: 'Owned.' },
    {
      id: 'fronteira',
      front: 'Quando vale chamar into_owned?',
      back: 'Quando o próximo consumidor precisa possuir os dados depois que a entrada deixar de existir.',
    },
  ],
  mission: {
    title: 'Revise o custo de uma normalização',
    text: 'Escolha um caminho que só leia o título e outro que o armazene para processar depois.',
    steps: [
      'Verifique o valor e a variante de Cow para um título já válido, um com espaços e um com maiúsculas ASCII.',
      'Indique onde ocorreria uma cópia e justifique por que o consumidor precisa dela.',
    ],
  },
  sources: [
    { title: 'Biblioteca padrão — Cow', url: 'https://doc.rust-lang.org/std/borrow/enum.Cow.html' },
    {
      title: 'Biblioteca padrão — to_ascii_lowercase',
      url: 'https://doc.rust-lang.org/std/primitive.str.html#method.to_ascii_lowercase',
    },
  ],
};
