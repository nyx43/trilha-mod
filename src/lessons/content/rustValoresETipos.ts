import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O catálogo guarda durações inteiras, mas pode mostrar quanto de uma sessão cada aula ocupa. Nesta aula você escolhe tipos, atualiza valores e faz uma divisão com casas decimais de propósito.',
  sections: [
    {
      id: 'variaveis-e-constantes',
      title: 'Dê nome ao que muda e ao que fica fixo',
      blocks: [
        {
          type: 'text',
          text: '`let` cria uma variável que fica imutável por padrão. Use `let mut` quando precisar atribuir um novo valor do mesmo tipo. `const` declara uma constante com tipo explícito e valor calculável antes da execução. Neste projeto, as durações são inteiros em minutos.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Some duas durações e compare com o limite',
          code: `const LIMITE: u32 = 20;

fn main() {
    let mut total = 7;
    total += 8;
    let cabe: bool = total <= LIMITE;
    println!("Total: {total} min. Cabe: {cabe}.");
}`,
          output: 'Total: 15 min. Cabe: true.',
        },
        {
          type: 'fill',
          activityId: 'alterar-o-total',
          language: 'rust',
          prompt: 'Complete a declaração para permitir que total seja atualizado.',
          template: 'let [[mut]] total = 7;\ntotal += 8;',
          explanation: '`mut` autoriza atribuir um novo valor à mesma variável.',
        },
      ],
    },
    {
      id: 'tipos-de-valores',
      title: 'Escolha tipos que representem a informação',
      blocks: [
        {
          type: 'text',
          text: 'Use `u32` para minutos inteiros a partir de zero, `i32` para ajustes que também podem ser negativos, `f64` para proporções aproximadas e `bool` para decisões. `char` representa um valor escalar Unicode e usa aspas simples. Um literal como `"Rust"` usa aspas duplas e tem tipo `&str`. O compilador pode inferir os tipos a partir do uso.',
        },
        {
          type: 'classify',
          activityId: 'tipos-no-catalogo',
          prompt: 'Associe cada valor ao tipo que representa a necessidade indicada.',
          buckets: ['`u32`', '`i32`', '`f64`', '`bool`', '`char`'],
          items: [
            { text: 'Duração inteira de 15 minutos', bucket: 0 },
            { text: 'Ajuste de menos 3 minutos', bucket: 1 },
            { text: 'Proporção aproximada de 0,75', bucket: 2 },
            { text: 'A aula cabe no tempo?', bucket: 3 },
            { text: "Um único símbolo como `'✓'`", bucket: 4 },
          ],
          explanation:
            'O tipo precisa comportar todo o conjunto de valores que a regra aceita, incluindo números negativos ou casas decimais quando fizerem parte dela.',
        },
        {
          type: 'quiz',
          activityId: 'inferencia-de-tipo',
          question: 'Que tipo o Rust infere para `cabe` em `let cabe = 15 <= 20;`?',
          options: [
            {
              text: '`bool`',
              correct: true,
              feedback: 'O resultado da comparação é verdadeiro ou falso.',
            },
            {
              text: '`u32`',
              feedback: 'Os operandos são inteiros. A expressão inteira produz um valor booleano.',
            },
          ],
        },
      ],
    },
    {
      id: 'converter-para-calcular',
      title: 'Converta antes de fazer a divisão',
      blocks: [
        {
          type: 'text',
          text: 'Uma divisão entre inteiros descarta a parte fracionária. Para calcular uma proporção, converta ambos os valores antes da divisão. `f64::from` aceita `u32` e preserva todos os seus valores inteiros. Formate a apresentação com duas casas usando `{proporcao:.2}`.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Compare as duas divisões com os mesmos dados',
          code: `fn main() {
    let minutos: u32 = 15;
    let limite: u32 = 20;
    let inteiro = minutos / limite;
    let proporcao = f64::from(minutos) / f64::from(limite);
    println!("{inteiro}");
    println!("{proporcao:.2}");
}`,
          output: '0\n0.75',
        },
        {
          type: 'order',
          activityId: 'ordem-da-proporcao',
          prompt: 'Ordene o cálculo de uma proporção com duas casas decimais.',
          items: [
            'Ler a duração e o limite em minutos',
            'Converter os dois inteiros em f64',
            'Dividir e formatar o resultado',
          ],
          explanation:
            'A conversão acontece antes da operação para que a parte fracionária chegue à impressão.',
        },
      ],
    },
  ],
  recap: [
    'Declaro valores imutáveis, mutáveis e constantes.',
    'Escolho o tipo a partir dos valores possíveis.',
    'Converto os operandos antes de uma divisão fracionária.',
  ],
  cards: [
    {
      id: 'mut',
      front: 'O que mut permite?',
      back: 'Atualizar o valor associado à variável, mantendo seu tipo.',
    },
    {
      id: 'u32',
      front: 'Que valores cabem em u32?',
      back: 'Inteiros sem sinal de zero a 4.294.967.295.',
    },
    {
      id: 'tipos',
      front: 'Que tipo uma comparação produz?',
      back: 'bool, que pode ser true ou false.',
    },
    {
      id: 'divisao',
      front: 'Quanto vale 15 / 20 entre inteiros?',
      back: 'Zero. A divisão inteira descarta a parte fracionária.',
    },
  ],
  mission: {
    title: 'Mostre quanto da sessão foi usado',
    text: 'Use o projeto das aulas e escolha duas durações para somar.',
    steps: [
      'Calcule o total e mostre se cabe no limite de 20 minutos.',
      'Mostre a proporção de tempo usado e confira com as entradas 15, 20 e 25.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — variáveis e tipos',
      url: 'https://doc.rust-lang.org/book/ch03-02-data-types.html',
    },
  ],
};
