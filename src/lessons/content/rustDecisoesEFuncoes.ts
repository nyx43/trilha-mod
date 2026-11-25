import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O catálogo precisa dizer quais aulas cabem no tempo disponível. Você vai transformar “até 20 minutos” em uma regra que pode ser chamada com outros valores e ver, linha por linha, como o resultado é produzido.',
  sections: [
    {
      id: 'expressoes-e-condicoes',
      title: 'Decida com um valor booleano',
      blocks: [
        {
          type: 'text',
          text: 'Uma **expressão** produz um valor. `minutos <= limite` produz `true` ou `false`. Rust exige um `bool` após `if`. Você também pode guardar o resultado de um `if` em uma variável quando os dois ramos produzem valores do mesmo tipo.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Compare no limite e use o resultado do if',
          code: `fn main() {
    let minutos = 20;
    let limite = 20;
    let mensagem = if minutos <= limite { "Cabe" } else { "Não cabe" };
    println!("{mensagem}");
}`,
          output: 'Cabe',
        },
        {
          type: 'quiz',
          activityId: 'limite-inclusivo',
          question:
            'Qual valor tornaria a diferença entre `<` e `<=` visível com limite igual a 20?',
          options: [
            {
              text: '20 minutos',
              correct: true,
              feedback: 'Exatamente no limite, `20 < 20` dá falso e `20 <= 20` dá verdadeiro.',
            },
            {
              text: '19 minutos',
              feedback:
                'Aos 19 minutos as duas comparações dão verdadeiro. Experimente usar um valor igual ao limite.',
            },
            {
              text: '21 minutos',
              feedback:
                'Aos 21 minutos as duas comparações dão falso. A diferença aparece quando os valores são iguais.',
            },
          ],
        },
      ],
    },
    {
      id: 'regra-em-funcao',
      title: 'Dê nome à regra e devolva seu resultado',
      blocks: [
        {
          type: 'text',
          text: 'Em `fn cabe(minutos: u32, limite: u32) -> bool`, os dois parâmetros são inteiros e o retorno é booleano. Rust usa o valor da última expressão como retorno se ela estiver sem ponto e vírgula. Manter a lógica em uma função permite conferir a regra chamando-a com dados diferentes.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'A função calcula e main mostra o resultado',
          code: `fn cabe(minutos: u32, limite: u32) -> bool {
    minutos <= limite
}

fn main() {
    println!("{}", cabe(20, 20));
    println!("{}", cabe(21, 20));
}`,
          output: 'true\nfalse',
        },
        {
          type: 'fill',
          activityId: 'retorno-da-regra',
          prompt: 'Complete com o tipo do resultado e o operador que inclui o limite de tempo.',
          language: 'rust',
          template:
            'fn cabe(minutos: u32, limite: u32) -> [[bool]] {\n    minutos [[<=]] limite\n}',
          explanation:
            'A expressão `minutos <= limite` devolve um `bool`. Ela é a última expressão da função.',
        },
      ],
    },
    {
      id: 'repeticao',
      title: 'Aplique a mesma regra em um laço',
      blocks: [
        {
          type: 'text',
          text: 'Um array como `[15, 20, 35]` guarda três números do mesmo tipo e tem tamanho fixo. `for minutos in duracoes` pega um valor de cada vez. Dentro do laço, o `if` decide se aquele valor gera uma linha de saída.',
        },
        {
          type: 'trace',
          caption: 'Siga as três passagens pelo mesmo trecho',
          code: 'let duracoes = [15, 20, 35];\nfor minutos in duracoes {\n    if minutos <= 20 {\n        println!("{minutos}");\n    }\n}',
          steps: [
            { line: 2, note: 'O laço pega o primeiro valor.', memory: [['minutos', '15']] },
            { line: 4, note: '15 cabe no limite.', output: '15' },
            { line: 2, note: 'O laço pega o segundo valor.', memory: [['minutos', '20']] },
            {
              line: 4,
              note: '20 também cabe. O operador inclui o caso de igualdade.',
              output: '20',
            },
            {
              line: 3,
              note: '35 ultrapassa o limite, então esta passagem pula a impressão.',
              memory: [['minutos', '35']],
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'saida-do-laco',
          question: 'Se o limite virar `19`, quais durações aparecem?',
          options: [
            {
              text: 'Apenas 15',
              correct: true,
              feedback: '15 é a única duração menor ou igual a 19.',
            },
            { text: '15 e 20', feedback: 'No novo limite, a comparação `20 <= 19` dá falso.' },
            {
              text: '35',
              feedback:
                '35 ultrapassa o limite. O comando de impressão está dentro do ramo verdadeiro.',
            },
          ],
        },
        {
          type: 'order',
          activityId: 'ordem-do-laco',
          prompt: 'Qual é a ordem das três ações em uma passagem que imprime a duração?',
          items: [
            'Ler o próximo valor do array',
            'Comparar o valor com o limite',
            'Imprimir o valor que cabe',
          ],
          explanation:
            'O valor vem do laço, a comparação decide se cabe e a impressão acontece dentro do ramo correspondente.',
        },
      ],
    },
  ],
  recap: [
    'Escrevo decisões usando expressões booleanas.',
    'Extraio uma regra para uma função com parâmetros e retorno.',
    'Consigo prever a saída de um laço e explicar o que ocorre no valor exatamente igual ao limite.',
  ],
  cards: [
    {
      id: 'limite',
      front: 'Qual operador inclui a igualdade em “até 20”?',
      back: 'Menor ou igual, <=.',
    },
    {
      id: 'retorno',
      front: 'O que indica -> bool em uma assinatura?',
      back: 'A função devolve um valor booleano.',
    },
    {
      id: 'expressao',
      front: 'Como devolver a última expressão de uma função?',
      back: 'Deixe a expressão no fim do corpo sem ponto e vírgula.',
    },
    {
      id: 'for',
      front: 'O que muda a cada passagem de for minutos in duracoes?',
      back: 'O nome minutos recebe o valor do próximo item da coleção.',
    },
  ],
  mission: {
    title: 'Verifique o filtro com três valores',
    text: 'Use o mesmo projeto e mostre as durações que cabem em 20 minutos.',
    steps: [
      'Use `cabe` dentro de `main` para filtrar `[15, 20, 35]`, preservando a ordem.',
      'Rode o programa e confirme as linhas `15` e `20`. Troque o limite para `19` e explique o que mudou.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — funções',
      url: 'https://doc.rust-lang.org/book/ch03-03-how-functions-work.html',
    },
    {
      title: 'Rust Book — controle de fluxo',
      url: 'https://doc.rust-lang.org/book/ch03-05-control-flow.html',
    },
  ],
};
