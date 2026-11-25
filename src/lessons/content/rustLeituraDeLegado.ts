import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Você recebe um leitor antigo que funciona com os dados de teste e encerra quando chega uma linha incompleta. Comece reproduzindo a falha. Depois siga a entrada linha por linha e descubra por quanto tempo os dados devolvidos continuam válidos.',
  sections: [
    {
      id: 'reproduzir-o-problema',
      title: 'Reduza o problema a uma entrada reproduzível',
      blocks: [
        {
          type: 'text',
          text: 'O leitor usa linhas no formato `minutos:título`. Separe um caso que funciona e um que falha. Registre a entrada, o resultado esperado e o que você observou. Rode com `RUST_BACKTRACE=1 cargo run` em um shell como Bash para ver os quadros da pilha. Procure o quadro que aponta para seu código.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Erro proposital do leitor legado',
          code: `fn titulo(linha: &str) -> &str {
    linha.split_once(':').unwrap().1.trim()
}

fn main() {
    println!("{}", titulo("15:Cargo"));
    println!("{}", titulo("linha sem separador"));
}`,
        },
        {
          type: 'order',
          activityId: 'reproduzir-antes-de-editar',
          prompt: 'Ordene uma investigação que outra pessoa consiga repetir.',
          items: [
            'Separar uma entrada válida e a menor entrada que falha',
            'Rodar o leitor e localizar no código a linha do panic',
            'Escrever a expectativa e só então preparar a correção',
          ],
          explanation:
            'Com um caso controlado e uma expectativa, você consegue mostrar o efeito da mudança.',
        },
      ],
    },
    {
      id: 'rastrear-a-transformacao',
      title: 'Siga o valor, da linha ao resultado',
      blocks: [
        {
          type: 'text',
          text: '`split_once` devolve `Option<(&str, &str)>`. No caso válido, a tupla contém uma fatia antes e outra depois do primeiro separador. `.1` seleciona a segunda fatia e `trim` ajusta suas bordas. Quando falta o separador, o resultado é `None` e a falha começa em `unwrap`.',
        },
        {
          type: 'trace',
          caption: 'Acompanhe a linha válida',
          code: "let partes = linha.split_once(':');\nlet par = partes.unwrap();\nlet titulo = par.1.trim();",
          steps: [
            {
              line: 1,
              note: 'O separador foi encontrado.',
              memory: [['partes', 'Some(("15", " Cargo "))']],
            },
            {
              line: 2,
              note: 'A opção contém uma tupla de duas fatias.',
              memory: [['par', '("15", " Cargo ")']],
            },
            {
              line: 3,
              note: 'A fatia do título começa depois do primeiro espaço.',
              memory: [['titulo', '"Cargo"']],
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'origem-do-panic',
          question: 'Qual chamada causa o panic para a linha sem separador?',
          options: [
            {
              text: '`unwrap()`',
              correct: true,
              feedback: 'A operação exige Some, mas split_once devolveu None.',
            },
            {
              text: "`split_once(':')`",
              feedback: 'Essa operação informa a ausência do separador devolvendo None.',
            },
          ],
        },
      ],
    },
    {
      id: 'contrato-da-referencia',
      title: 'Leia a relação entre as referências na assinatura',
      blocks: [
        {
          type: 'text',
          text: "No leitor original, há uma única referência na entrada. Rust consegue inferir que a fatia retornada fica limitada ao empréstimo dessa entrada. Quando uma função pode devolver uma fatia de dois textos diferentes, indique uma duração comum com `'a`. O compilador verifica se ambos os empréstimos duram o bastante para cada uso do retorno.",
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Exemplo de prévia que aceita um rótulo padrão',
          code: `fn rotulo<'a>(linha: &'a str, padrao: &'a str) -> &'a str {
    linha.split_once(':')
        .map(|(_, titulo)| titulo.trim())
        .filter(|titulo| !titulo.is_empty())
        .unwrap_or(padrao)
}

fn main() {
    let registro = String::from("15: Cargo ");
    let padrao = String::from("Sem título");
    println!("{}", rotulo(&registro, &padrao));
    println!("{}", rotulo("incompleta", &padrao));
}`,
          output: 'Cargo\nSem título',
        },
        {
          type: 'fill',
          activityId: 'ligar-retorno-aos-emprestimos',
          language: 'rust',
          prompt: 'Associe o tipo de retorno à duração comum dos dois empréstimos.',
          template: "fn rotulo<'a>(linha: &'a str, padrao: &'a str) -> [[&'a str]]",
          explanation:
            'A anotação relaciona o uso do retorno à validade das entradas. Os dois textos continuam com seus donos originais.',
        },
        {
          type: 'quiz',
          activityId: 'escolher-o-contrato',
          question:
            'No importador, quem fez o pedido quer saber quais linhas são inválidas. Qual contrato atende ao pedido?',
          options: [
            {
              text: 'Devolver um Result que indica o motivo da falha.',
              correct: true,
              feedback:
                'O chamador distingue um título válido de uma linha que precisa de correção.',
            },
            {
              text: 'Preencher toda linha inválida com o rótulo padrão.',
              feedback:
                'O rótulo ajuda uma prévia. Para o importador, preservaria um registro inválido sem informar a causa.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Consigo reproduzir um panic a partir da entrada que o causa.',
    'Sigo Option, tupla e fatia para descobrir o que cada chamada produz.',
    'Explico de quais dados o retorno depende e escolho como informar a falha ao chamador.',
  ],
  cards: [
    {
      id: 'reproducao',
      front: 'O que anotar ao reproduzir um bug?',
      back: 'Entrada, comando, saída observada e expectativa para o mesmo caso.',
    },
    {
      id: 'split',
      front: 'O que split_once devolve quando o separador está ausente?',
      back: 'None.',
    },
    { id: 'panic', front: 'O que unwrap faz com None?', back: 'Dispara um panic.' },
    {
      id: 'lifetime',
      front: 'O que uma anotação de lifetime diz ao compilador?',
      back: 'Quais referências precisam continuar válidas para permitir cada uso do retorno.',
    },
  ],
  mission: {
    title: 'Registre a falha do leitor em três linhas',
    text: 'Use o exemplo legado e documente o arquivo e a operação que falhou.',
    steps: [
      'Rode com e sem separador e anote os resultados dos dois casos.',
      'Escreva quem possui o texto original e de onde vem a fatia retornada.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — lifetimes',
      url: 'https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html',
    },
    {
      title: 'Biblioteca padrão — split_once em str',
      url: 'https://doc.rust-lang.org/std/primitive.str.html#method.split_once',
    },
  ],
};
