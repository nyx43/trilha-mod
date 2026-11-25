import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Você já sabe selecionar aulas que cabem no tempo disponível. Agora outra pessoa precisa rodar o programa, mudar o limite e verificar se o resultado respeita o combinado. Entregue uma interface de terminal com mensagens e testes reproduzíveis.',
  sections: [
    {
      id: 'contrato-do-terminal',
      title: 'Escreva exemplos de entrada e saída antes de alterar o código',
      blocks: [
        {
          type: 'text',
          text: 'O contrato desta versão recebe um argumento inteiro sem sinal. Com `20`, mostre as aulas de até 20 minutos em ordem. Com `0`, mostre uma mensagem de resultado vazio nesta amostra. Use uma mensagem de uso e um status de falha quando o argumento estiver ausente ou inválido. Esses exemplos dizem o que a pessoa vai verificar na entrega.',
        },
        {
          type: 'table',
          caption: 'Casos para executar com a amostra da aula',
          head: ['Comando', 'Resultado esperado'],
          rows: [
            ['`cargo run -- 20`', 'Vetores, depois Modelagem, um título por linha'],
            ['`cargo run -- 0`', 'Nenhuma aula cabe nesse limite.'],
            ['`cargo run -- abc`', 'Mensagem de uso na saída de erro e status de falha'],
          ],
        },
        {
          type: 'quiz',
          activityId: 'resultado-em-ordem',
          question: 'Qual verificação confirma que a saída respeita a ordem original?',
          options: [
            {
              text: 'Conferir a sequência completa dos títulos na saída.',
              correct: true,
              feedback:
                'Uma comparação da sequência identifica tanto itens trocados de posição quanto itens faltando.',
            },
            {
              text: 'Conferir apenas a quantidade de linhas.',
              feedback: 'Duas saídas com posições trocadas podem ter a mesma quantidade de linhas.',
            },
          ],
        },
      ],
    },
    {
      id: 'adaptador-de-terminal',
      title: 'Leia argumentos e chame uma função de seleção',
      blocks: [
        {
          type: 'text',
          text: 'O `--` em `cargo run -- 20` separa as opções do Cargo dos argumentos do programa. `env::args()` inclui o nome do executável como primeiro item. `skip(1)` deixa os argumentos do usuário. `main` lê a entrada e apresenta o resultado. A função `selecionar` recebe dados e limite para que os testes possam chamá-la diretamente.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Programa completo em src/main.rs',
          code: `use std::{env, process::ExitCode};

struct Aula {
    titulo: &'static str,
    minutos: u32,
}

fn selecionar(aulas: &[Aula], limite: u32) -> Vec<&Aula> {
    aulas.iter().filter(|aula| aula.minutos <= limite).collect()
}

fn main() -> ExitCode {
    let mut argumentos = env::args().skip(1);
    let limite = argumentos.next().and_then(|texto| texto.parse::<u32>().ok());
    let (Some(limite), None) = (limite, argumentos.next()) else {
        eprintln!("Uso: catalogo <limite em minutos>");
        return ExitCode::FAILURE;
    };

    let aulas = [
        Aula { titulo: "Vetores", minutos: 12 },
        Aula { titulo: "Modelagem", minutos: 20 },
        Aula { titulo: "Testes", minutos: 30 },
    ];
    let resultado = selecionar(&aulas, limite);
    if resultado.is_empty() {
        println!("Nenhuma aula cabe nesse limite.");
    }
    for aula in resultado {
        println!("{}", aula.titulo);
    }
    ExitCode::SUCCESS
}`,
        },
        {
          type: 'text',
          text: 'O `and_then` só tenta converter quando um argumento existe. `ok()` mantém o número se a conversão der certo e usa `None` para texto inválido. Para esta interface, os dois casos mostram a mesma mensagem de uso. O padrão `(Some(limite), None)` aceita um limite válido e nenhum segundo argumento. Na seleção, `iter` percorre referências, `filter` escolhe as aulas e `collect` junta o resultado num vetor.',
        },
        {
          type: 'fill',
          activityId: 'argumento-numero',
          prompt: 'Complete a conversão para aceitar um inteiro sem sinal.',
          language: 'rust',
          template: 'let limite = texto.parse::<[[u32]]>();',
          explanation:
            '`u32` representa os números inteiros sem sinal aceitos pelo contrato deste programa.',
        },
      ],
    },
    {
      id: 'revisao-e-regressao',
      title: 'Prove os critérios e deixe um roteiro para outra pessoa',
      blocks: [
        {
          type: 'text',
          text: 'Os testes abaixo chamam a regra com dados controlados. Cole depois de `main`. Verifique o que o filtro devolve e confira separadamente os comandos da tabela para testar a interface. A anotação `#[test]` permite que Cargo descubra e rode essas funções.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Acrescente estes testes ao arquivo do terminal',
          code: `#[test]
fn preserva_a_ordem_e_inclui_o_limite() {
    let aulas = [
        Aula { titulo: "A", minutos: 20 },
        Aula { titulo: "B", minutos: 12 },
        Aula { titulo: "C", minutos: 21 },
    ];
    let titulos: Vec<&str> = selecionar(&aulas, 20).iter().map(|aula| aula.titulo).collect();
    assert_eq!(titulos, vec!["A", "B"]);
}

#[test]
fn lista_vazia_devolve_lista_vazia() {
    assert!(selecionar(&[], 20).is_empty());
}`,
        },
        {
          type: 'text',
          text: 'Rode `cargo fmt --check` para detectar diferenças de formatação. Rode `cargo test` para conferir a regra e use a tabela para verificar a interface. Num README curto, anote os comandos, a saída esperada e que a amostra está fixa no código. Peça a alguém para reproduzir usando só esse roteiro.',
        },
        {
          type: 'quiz',
          activityId: 'regressao-de-limite',
          question:
            'Qual mudança seria detectada pelo primeiro teste mesmo que o programa compilasse?',
          options: [
            {
              text: 'Trocar `<=` por `<` no filtro.',
              correct: true,
              feedback:
                'A aula A tem exatamente 20 minutos. Com <, a sequência observada perderia esse título.',
            },
            {
              text: 'Renomear a variável `limite` em toda a função.',
              feedback:
                'A renomeação consistente preserva a mesma comparação e a mesma sequência retornada.',
            },
          ],
        },
        {
          type: 'order',
          activityId: 'roteiro-da-entrega',
          prompt: 'Ordene o roteiro de verificação da entrega.',
          items: [
            'Escrever os exemplos que definem o aceite',
            'Rodar os testes da função e as chamadas do terminal',
            'Registrar comandos e saídas observadas para a revisão',
          ],
          explanation:
            'Os critérios guiam a verificação. Na revisão, outra pessoa consegue conferir a mesma evidência.',
        },
      ],
    },
  ],
  recap: [
    'Separo a interface de terminal da regra de filtro.',
    'Verifico resultados, mensagens e status com entradas controladas.',
    'Registro comandos e critérios para que outra pessoa reproduza a entrega.',
  ],
  cards: [
    {
      id: 'argumentos',
      front: 'O que o -- separa em cargo run -- 20?',
      back: 'Os argumentos de Cargo dos argumentos do programa.',
    },
    {
      id: 'falha',
      front: 'Como a CLI sinaliza argumento inválido?',
      back: 'Escreve a mensagem de uso em stderr com eprintln! e retorna ExitCode::FAILURE.',
    },
    {
      id: 'ordem',
      front: 'Por que comparar o vetor de títulos inteiro?',
      back: 'Para verificar conteúdo, quantidade e ordem em uma única expectativa.',
    },
    {
      id: 'roteiro',
      front: 'O que anotar para outra pessoa reproduzir a entrega?',
      back: 'Comandos de execução e teste, dados usados, saídas esperadas e limitações.',
    },
  ],
  mission: {
    title: 'Entregue o filtro para quem pediu a mudança',
    text: 'No módulo Fundamentos de Rust, abra a missão Sua primeira entrega no terminal. Use os títulos do pedido e verifique o limite exato e a lista vazia.',
    steps: [
      'Formate o código e rode os testes. Confirme a sequência de títulos solicitada pela estudante.',
      'Volte à trilha para registrar a prática. Na missão, anote comandos, resultados e onde o filtro aplica a regra.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — argumentos de linha de comando',
      url: 'https://doc.rust-lang.org/book/ch12-01-accepting-command-line-arguments.html',
    },
    {
      title: 'Rust Book — testes',
      url: 'https://doc.rust-lang.org/book/ch11-01-writing-tests.html',
    },
  ],
};
