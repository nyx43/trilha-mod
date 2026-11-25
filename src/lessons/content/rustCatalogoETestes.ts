import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Uma lista de durações já permite prever a saída. Agora cada aula precisa ter um título, duração e estado. Você vai organizar esses dados, filtrar o catálogo e escrever testes para duas entradas que costumam revelar erros.',
  sections: [
    {
      id: 'dados-do-catalogo',
      title: 'Modele uma aula com struct e enum',
      blocks: [
        {
          type: 'text',
          text: 'Uma `struct` reúne campos com nome e tipo. Cada valor de `Aula` guarda um texto em `String`, uma duração em `u32` e um estado. Um `enum` lista as variantes possíveis de um valor. Cada aula tem um único estado, `Pendente` ou `Estudada`. O `match` escolhe o texto associado a cada variante.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Um catálogo pequeno com dois estados',
          code: `enum Estado {
    Pendente,
    Estudada,
}

struct Aula {
    titulo: String,
    minutos: u32,
    estado: Estado,
}

fn main() {
    let aulas = vec![
        Aula { titulo: String::from("Cargo"), minutos: 15, estado: Estado::Pendente },
        Aula { titulo: String::from("Tipos"), minutos: 20, estado: Estado::Estudada },
    ];
    for aula in &aulas {
        let situacao = match aula.estado {
            Estado::Pendente => "a estudar",
            Estado::Estudada => "estudada",
        };
        println!("{} ({} min): {situacao}", aula.titulo, aula.minutos);
    }
}`,
          output: 'Cargo (15 min): a estudar\nTipos (20 min): estudada',
        },
        {
          type: 'classify',
          activityId: 'modelagem-do-catalogo',
          prompt: 'Associe cada tipo ao seu papel no catálogo.',
          buckets: ['Reúne campos', 'Define alternativas', 'Guarda vários valores do mesmo tipo'],
          items: [
            { text: '`struct Aula`', bucket: 0 },
            { text: '`enum Estado`', bucket: 1 },
            { text: '`Vec<Aula>`', bucket: 2 },
          ],
          explanation:
            'Uma aula reúne campos, o estado de cada aula vem das variantes do enum e o vetor guarda várias aulas.',
        },
      ],
    },
    {
      id: 'filtrar-catalogo',
      title: 'Filtre o vetor sem consumir o catálogo',
      blocks: [
        {
          type: 'text',
          text: '`Vec<Aula>` é uma coleção que pode crescer. A função recebe `&[Aula]`, uma visão emprestada de uma sequência de aulas. Passe `&aulas` para continuar usando o vetor no chamador. A função monta um vetor de referências às aulas que cabem. Essas referências só podem ser usadas enquanto os dados emprestados forem válidos.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'src/main.rs para praticar o filtro antes dos testes',
          code: `struct Aula {
    titulo: String,
    minutos: u32,
}

fn selecionar(aulas: &[Aula], limite: u32) -> Vec<&Aula> {
    let mut selecionadas = Vec::new();
    for aula in aulas {
        if aula.minutos <= limite {
            selecionadas.push(aula);
        }
    }
    selecionadas
}

fn main() {
    let aulas = vec![
        Aula { titulo: String::from("Cargo"), minutos: 15 },
        Aula { titulo: String::from("Tipos"), minutos: 20 },
        Aula { titulo: String::from("Testes"), minutos: 35 },
    ];
    for aula in selecionar(&aulas, 20) {
        println!("{}", aula.titulo);
    }
}`,
          output: 'Cargo\nTipos',
        },
        {
          type: 'text',
          text: '`Vec::new()` cria a saída vazia e `mut` permite alterá-la com `push`. Cada aula é examinada na ordem em que chegou. Uma entrada vazia mantém a saída vazia, pois o corpo do laço roda zero vezes.',
        },
        {
          type: 'fill',
          activityId: 'emprestar-a-lista',
          language: 'rust',
          prompt: 'Complete a chamada para emprestar o vetor ao filtro.',
          template: 'let curtas = selecionar([[&aulas]], 20);',
          explanation:
            '`&aulas` empresta o vetor. Rust permite usar essa referência como a fatia `&[Aula]` que a função espera.',
        },
      ],
    },
    {
      id: 'testar-contrato',
      title: 'Prove o comportamento no limite e com lista vazia',
      blocks: [
        {
          type: 'text',
          text: 'Um teste prepara dados, chama a função e verifica o resultado. Cole os testes abaixo depois de `main` no arquivo do filtro e execute `cargo test`. `#[test]` registra cada função como teste. `assert_eq!` compara o resultado observado com o valor esperado.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Acrescente estes testes ao fim de src/main.rs',
          code: `#[test]
fn inclui_o_limite() {
    let aulas = [
        Aula { titulo: String::from("Tipos"), minutos: 20 },
        Aula { titulo: String::from("Testes"), minutos: 21 },
    ];
    let resultado = selecionar(&aulas, 20);
    assert_eq!(resultado.len(), 1);
    assert_eq!(resultado[0].titulo.as_str(), "Tipos");
}

#[test]
fn aceita_catalogo_vazio() {
    assert!(selecionar(&[], 20).is_empty());
}`,
        },
        {
          type: 'text',
          text: 'Experimente trocar `<=` por `<` em `selecionar`. Rode `cargo test` e procure o nome do teste que falhou. O resultado esperado registra a regra “até 20 minutos”. Restaure o operador e rode os testes de novo. A passagem de falha para sucesso mostra o efeito da mudança.',
        },
        {
          type: 'quiz',
          activityId: 'teste-que-pega-o-erro',
          question: 'Qual teste falha se `selecionar` usar `<` com limite 20?',
          options: [
            {
              text: '`inclui_o_limite`',
              correct: true,
              feedback:
                'Com `<`, a aula de 20 minutos fica de fora e o tamanho será zero. O teste esperava uma aula.',
            },
            {
              text: '`aceita_catalogo_vazio`',
              feedback:
                'Sem itens na entrada, o filtro devolve um vetor vazio com ambos os operadores.',
            },
            {
              text: 'Os dois testes',
              feedback:
                'Verifique o efeito onde há um valor igual ao limite. A lista vazia continua vazia.',
            },
          ],
        },
        {
          type: 'order',
          activityId: 'ordem-do-teste',
          prompt: 'Ordene as etapas do teste que verifica o limite de tempo.',
          items: [
            'Preparar uma aula de 20 minutos e outra de 21',
            'Chamar selecionar com limite 20',
            'Conferir o tamanho da saída e o título retornado',
          ],
          explanation:
            'Dados controlados permitem prever a saída. Depois da chamada, confira se o valor retornado satisfaz a regra.',
        },
      ],
    },
  ],
  recap: [
    'Uma struct reúne os campos de uma aula e um enum lista seus estados possíveis.',
    'O filtro lê uma fatia emprestada e devolve as aulas encontradas na ordem da entrada.',
    'Testes para o limite exato e para a lista vazia demonstram partes diferentes do contrato.',
  ],
  cards: [
    {
      id: 'struct',
      front: 'Para que serve uma struct?',
      back: 'Para guardar campos nomeados e tipados em um único valor.',
    },
    {
      id: 'enum',
      front: 'Para que servem enum e match juntos?',
      back: 'O enum define as variantes e match escolhe o que fazer para cada uma.',
    },
    {
      id: 'fatia',
      front: 'O que significa &[Aula] na assinatura?',
      back: 'É uma fatia emprestada. A função consegue ler uma sequência de aulas sem tomar posse do vetor de origem.',
    },
    {
      id: 'contrato',
      front: 'Quais entradas demonstram o limite e a ausência de dados?',
      back: 'Uma aula de exatamente 20 minutos para o limite inclusivo e uma lista vazia.',
    },
  ],
  mission: {
    title: 'Amplie o catálogo e confira o filtro',
    text: 'Acrescente uma aula de exatamente 20 minutos. Confira que ela aparece na mesma posição relativa às outras selecionadas.',
    steps: [
      'Rode o projeto e registre a sequência de títulos antes e depois de acrescentar a nova aula.',
      'Execute `cargo test` e anote a comprovação para os casos de limite exato e de lista vazia.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — structs',
      url: 'https://doc.rust-lang.org/book/ch05-01-defining-structs.html',
    },
    {
      title: 'Rust Book — enums',
      url: 'https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html',
    },
    { title: 'Rust Book — vetores', url: 'https://doc.rust-lang.org/book/ch08-01-vectors.html' },
    {
      title: 'Rust Book — testes',
      url: 'https://doc.rust-lang.org/book/ch11-01-writing-tests.html',
    },
  ],
};
