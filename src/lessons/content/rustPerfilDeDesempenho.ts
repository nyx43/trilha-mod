import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Uma sugestão de revisão promete acelerar a busca por aulas usando um índice. Meça a mudança em modo release, conte o custo para criar o índice e confira se a posição de uma resposta ausente continua no lugar certo.',
  sections: [
    {
      id: 'definir-o-que-medir',
      title: 'Separe o tempo de preparar do tempo de consultar',
      blocks: [
        {
          type: 'text',
          text: 'Mantenha iguais a sequência de buscas e a saída esperada. Meça a construção do índice em separado para comparar tanto um lote único quanto várias consultas sobre o mesmo catálogo. Monte casos com IDs presentes, ausentes e repetidos. O exemplo usa IDs únicos no catálogo. Se essa propriedade mudar, defina qual registro uma busca deve escolher antes de criar um HashMap.',
        },
        {
          type: 'classify',
          activityId: 'medir-custos-diferentes',
          prompt: 'Associe cada custo à etapa da comparação que o mede.',
          buckets: ['Construção', 'Consulta', 'Equivalência'],
          items: [
            { text: 'Alocar e preencher a estrutura de busca', bucket: 0 },
            { text: 'Percorrer a sequência de IDs solicitados', bucket: 1 },
            { text: 'Verificar os valores e a ordem de todos os resultados', bucket: 2 },
          ],
          explanation:
            'Medir a consulta separadamente ajuda a mostrar quando a preparação do índice se paga.',
        },
      ],
    },
    {
      id: 'medir-indice',
      title: 'Compare a busca linear e a busca indexada',
      blocks: [
        {
          type: 'text',
          text: 'Rode com `cargo run --release`. `Instant` mede durações. `black_box` pede ao compilador que trate os dados como opacos para reduzir a chance de uma otimização eliminar o trabalho medido. Ainda há ruído de execução. Compare repetições e use o mesmo formato de saída nas duas versões.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Execute as mesmas 4 mil buscas nas duas versões',
          code: `use std::{collections::HashMap, hint::black_box, time::Instant};

fn main() {
    let aulas: Vec<(u32, u32)> = (1..=10_000).map(|id| (id, id % 45)).collect();
    let pedidos: Vec<u32> = (1..=4_000).map(|id| id * 3).collect();

    let inicio = Instant::now();
    let linear: Vec<Option<u32>> = black_box(&pedidos).iter().map(|id| {
        black_box(&aulas).iter().find(|aula| aula.0 == *id).map(|aula| aula.1)
    }).collect();
    let tempo_linear = inicio.elapsed();

    let inicio = Instant::now();
    let indice: HashMap<u32, u32> = aulas.iter().copied().collect();
    let tempo_indice = inicio.elapsed();
    let inicio = Instant::now();
    let indexada: Vec<Option<u32>> = black_box(&pedidos).iter()
        .map(|id| black_box(&indice).get(id).copied())
        .collect();
    let tempo_consulta = inicio.elapsed();

    assert_eq!(linear, indexada);
    println!("Resultados equivalentes: {}", linear.len());
    println!("Linear: {tempo_linear:?}");
    println!("Construção: {tempo_indice:?} | Consulta indexada: {tempo_consulta:?}");
}`,
        },
        {
          type: 'fill',
          activityId: 'observar-o-mesmo-resultado',
          language: 'rust',
          prompt: 'Complete a asserção que preserva inclusive a posição dos IDs ausentes.',
          template: '[[assert_eq!]](linear, indexada);',
          explanation:
            'O vetor mantém um resultado Option para cada pedido. Comparar o vetor inteiro verifica tanto ordem quanto ausências.',
        },
        {
          type: 'quiz',
          activityId: 'comparar-lote-unico',
          question:
            'Para um único lote que ainda precisa criar o índice, quais custos entram na versão indexada?',
          options: [
            {
              text: 'Construção do índice e consultas do lote.',
              correct: true,
              feedback:
                'Neste cenário o custo da construção acontece antes de entregar a primeira resposta.',
            },
            {
              text: 'Somente a consulta, pois o índice está pronto no código.',
              feedback: 'A estrutura é construída a partir do catálogo naquela execução.',
            },
          ],
        },
      ],
    },
    {
      id: 'documentar-tradeoff',
      title: 'Inclua memória e reuso na decisão',
      blocks: [
        {
          type: 'text',
          text: 'O índice retém uma estrutura adicional. Teste um catálogo pequeno com poucas consultas e um catálogo grande consultado várias vezes. Registre a versão, o tamanho da carga, repetições e tempos. Se memória for parte do critério, meça também o pico do processo com a ferramenta disponível na plataforma e declare o que ela inclui.',
        },
        {
          type: 'order',
          activityId: 'justificar-uma-otimizacao',
          prompt: 'Ordene a análise da proposta de otimização.',
          items: [
            'Definir a mesma carga e os resultados que devem ser preservados',
            'Executar as versões e conferir as saídas',
            'Comparar preparação, consulta e memória no cenário do cliente',
          ],
          explanation:
            'Os dados da medição precisam responder à pergunta sobre o cenário real, com a regra preservada.',
        },
      ],
    },
  ],
  recap: [
    'Separo a preparação do índice e as buscas.',
    'Verifico ordem, conteúdo e ausências antes de comparar os tempos.',
    'Decido com base em tamanho da carga, reuso e memória.',
  ],
  cards: [
    {
      id: 'base',
      front: 'Por que medir com os mesmos pedidos?',
      back: 'Para atribuir a diferença observada ao algoritmo e preservar o mesmo contrato.',
    },
    {
      id: 'amortizar',
      front: 'Quando o custo de construir o índice pode ser dividido?',
      back: 'Quando a estrutura é reutilizada por vários lotes antes de ser refeita.',
    },
    {
      id: 'ausentes',
      front: 'Por que manter Option em cada posição da saída?',
      back: 'A ausência é um resultado para um pedido específico e faz parte da equivalência.',
    },
    {
      id: 'ruido',
      front: 'O que registrar para que outra pessoa entenda os tempos?',
      back: 'Tamanhos, comandos, versões, repetições e o cenário em que a medição foi feita.',
    },
  ],
  mission: {
    title: 'Defenda ou descarte o índice',
    text: 'Compare um lote pequeno e um lote grande. Rode os dois caminhos várias vezes.',
    steps: [
      'Confirme que os resultados coincidem, inclusive quando a busca retorna None.',
      'Compare tempos e custo de manter o índice. Defenda a escolha para cada carga.',
    ],
  },
  sources: [
    {
      title: 'Biblioteca padrão — black_box',
      url: 'https://doc.rust-lang.org/std/hint/fn.black_box.html',
    },
    {
      title: 'Cargo Book — perfis de compilação',
      url: 'https://doc.rust-lang.org/cargo/reference/profiles.html',
    },
  ],
};
