import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Na tela do catálogo, a ordem de cadastro importa. Para encontrar uma aula pelo ID, o que importa é uma chave. Nesta aula você implementa as duas consultas e decide quando vale manter um índice.',
  sections: [
    {
      id: 'vetor-em-ordem',
      title: 'Guarde aulas na ordem de cadastro',
      blocks: [
        {
          type: 'text',
          text: '`Vec<Aula>` mantém uma sequência. `push` adiciona ao fim e `get` recebe uma posição a partir de zero, devolvendo `Option<&Aula>`. Um ID faz parte dos dados da aula. Um índice de posição descreve onde a aula está no vetor naquele momento.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Insira uma aula e confira a primeira posição',
          code: `fn main() {
    let mut aulas = vec![(7_u32, "Cargo")];
    aulas.push((42, "Empréstimos"));
    for (id, titulo) in &aulas {
        println!("{id}: {titulo}");
    }
    if let Some((_, titulo)) = aulas.get(0) {
        println!("Primeira: {titulo}");
    }
}`,
          output: '7: Cargo\n42: Empréstimos\nPrimeira: Cargo',
        },
        {
          type: 'quiz',
          activityId: 'id-e-posicao',
          question: 'No exemplo, que valor você passa a `get` para ler a aula de ID 42?',
          options: [
            {
              text: '1, a posição da segunda aula.',
              correct: true,
              feedback: 'O segundo item está na posição 1. O ID 42 está guardado no próprio item.',
            },
            {
              text: '42, o ID registrado na segunda aula.',
              feedback:
                '`Vec::get` interpreta o argumento como posição. Neste vetor só existem as posições 0 e 1.',
            },
          ],
        },
      ],
    },
    {
      id: 'busca-por-id',
      title: 'Procure por um campo com uma busca sequencial',
      blocks: [
        {
          type: 'text',
          text: 'Percorra o vetor comparando uma chave por vez. Ao encontrar o ID, devolva o título com `Some`. Se chegar ao fim do vetor, devolva `None`. Uma busca por ID ausente examina todos os registros. Esse pode ser um custo aceitável para uma lista curta consultada poucas vezes.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Encontre pelo campo ID, mesmo quando ele está fora de ordem',
          code: `fn buscar(aulas: &[(u32, &'static str)], procurado: u32) -> Option<&'static str> {
    for &(id, titulo) in aulas {
        if id == procurado {
            return Some(titulo);
        }
    }
    None
}

fn main() {
    let aulas = [(42, "Empréstimos"), (7, "Cargo")];
    println!("{:?}", buscar(&aulas, 7));
    println!("{:?}", buscar(&aulas, 99));
}`,
          output: 'Some("Cargo")\nNone',
        },
        {
          type: 'text',
          text: "No exemplo, `'static` indica que os títulos são literais disponíveis durante a execução inteira. O vetor pode guardar Strings do catálogo real e a busca pode devolver uma referência válida enquanto o catálogo estiver emprestado.",
        },
        {
          type: 'fill',
          activityId: 'retornar-quando-encontrar',
          language: 'rust',
          prompt: 'Complete o retorno para a primeira aula que tem o ID procurado.',
          template: 'if id == procurado {\n    return [[Some]](titulo);\n}',
          explanation:
            '`Some` representa o título encontrado. `return` encerra a busca nesse ponto.',
        },
        {
          type: 'quiz',
          activityId: 'busca-vazia',
          question: 'O que a função retorna ao procurar qualquer ID em uma lista vazia?',
          options: [
            {
              text: '`None`',
              correct: true,
              feedback: 'O corpo do laço roda zero vezes e a função chega ao caso de ausência.',
            },
            {
              text: '`Some("")`',
              feedback:
                'Uma string vazia contaria como um título presente. O algoritmo retorna None porque não encontrou item algum.',
            },
          ],
        },
      ],
    },
    {
      id: 'indice-por-chave',
      title: 'Use um HashMap quando a consulta é pela chave',
      blocks: [
        {
          type: 'text',
          text: '`HashMap<K, V>` associa uma chave a um valor. Aqui a chave é o ID. `get(&id)` consulta a chave e devolve `Option<&V>`. Cada chave tem um único valor. Inserir a mesma chave substitui o valor e devolve o anterior. Se seu contrato rejeita duplicatas, decida o que fazer antes de inserir.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Observe o efeito de inserir a mesma chave duas vezes',
          code: `use std::collections::HashMap;

fn main() {
    let mut por_id = HashMap::from([(7_u32, "Cargo"), (42, "Empréstimos")]);
    let titulo_anterior = por_id.insert(7, "Projetos com Cargo");
    println!("Antes: {titulo_anterior:?}");
    println!("Agora: {:?}", por_id.get(&7));
    println!("Quantidade: {}", por_id.len());
}`,
          output: 'Antes: Some("Cargo")\nAgora: Some("Projetos com Cargo")\nQuantidade: 2',
        },
        {
          type: 'classify',
          activityId: 'colecao-certa',
          prompt: 'Associe cada necessidade à maneira direta de atendê-la.',
          buckets: ['Sequência em Vec', 'Chaves em HashMap'],
          items: [
            { text: 'Exibir os itens na ordem em que chegaram', bucket: 0 },
            { text: 'Consultar repetidamente o título pela chave ID', bucket: 1 },
            { text: 'Acessar a segunda aula na ordem de cadastro', bucket: 0 },
          ],
          explanation:
            'O vetor conserva a ordem da lista. O mapa oferece buscas por chave sem definir uma ordem de iteração.',
        },
      ],
    },
  ],
  recap: [
    'Separo posição no vetor e ID de negócio.',
    'Faço uma busca que trata a ausência com Option.',
    'Escolho entre percorrer a sequência e manter uma estrutura para consultas por chave.',
  ],
  cards: [
    { id: 'posicao', front: 'Qual posição tem o primeiro item em Vec?', back: 'A posição zero.' },
    { id: 'nenhum', front: 'O que Vec::get devolve para um índice fora do vetor?', back: 'None.' },
    {
      id: 'chave',
      front: 'O que acontece ao repetir uma chave em HashMap::insert?',
      back: 'O valor anterior é substituído e devolvido em Some.',
    },
    {
      id: 'ordem',
      front: 'Qual coleção mantém ordem de chegada neste exemplo?',
      back: 'O Vec preenchido com push.',
    },
  ],
  mission: {
    title: 'Mostre o catálogo e encontre uma aula',
    text: 'Cadastre três IDs fora de ordem e preserve a ordem de chegada ao listar.',
    steps: [
      'Procure um ID presente e outro ausente com a função de busca.',
      'Tente inserir duas vezes o mesmo ID num HashMap e explique como detectaria uma duplicata antes de alterar os dados.',
    ],
  },
  sources: [
    { title: 'Rust Book — vetores', url: 'https://doc.rust-lang.org/book/ch08-01-vectors.html' },
    { title: 'Rust Book — mapas', url: 'https://doc.rust-lang.org/book/ch08-03-hash-maps.html' },
  ],
};
