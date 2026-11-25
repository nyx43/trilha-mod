import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'A versão com duas rotinas de trabalho parece mais rápida. Para defender a mudança, compare com uma referência sequencial, confirme que todos os itens continuam lá e registre onde a medição pode enganar.',
  sections: [
    {
      id: 'hipotese-e-referencia',
      title: 'Defina uma hipótese que possa falhar',
      blocks: [
        {
          type: 'text',
          text: 'A hipótese é reduzir o tempo total de um lote independente com espera por I/O. A versão sequencial fornece a referência. Use a mesma entrada, a mesma operação e a mesma configuração de compilação. Compare também a saída, a quantidade de workers e o uso da fila para que uma versão que pula trabalho apareça como incorreta.',
        },
        {
          type: 'classify',
          activityId: 'controlar-a-comparacao',
          prompt: 'Classifique os pontos de uma comparação justa.',
          buckets: ['Mantenha equivalente', 'Varie para medir a hipótese'],
          items: [
            { text: 'Lote inicial e operação por registro', bucket: 0 },
            { text: 'Compilação em modo release', bucket: 0 },
            { text: 'Execução sequencial ou com até dois workers', bucket: 1 },
            { text: 'Critério de equivalência da saída', bucket: 0 },
          ],
          explanation:
            'Mudanças na carga ou na compilação dificultam atribuir a diferença de tempo à execução concorrente.',
        },
      ],
    },
    {
      id: 'executar-a-mesma-carga',
      title: 'Execute duas versões com trabalho equivalente',
      blocks: [
        {
          type: 'text',
          text: '`thread::scope` permite emprestar a fatia a uma thread cujo término acontece dentro desse escopo. Um worker processa a primeira metade enquanto o chamador processa a segunda. Elas são reunidas na ordem original. A espera curta simula I/O. Os tempos do exemplo medem esse cenário, e os resultados de um sistema real precisam de uma carga própria.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Rode com cargo run --release e anote os tempos',
          code: `use std::{thread, time::{Duration, Instant}};

fn processar(ids: &[u32]) -> Vec<u32> {
    ids.iter().map(|id| {
        thread::sleep(Duration::from_millis(2));
        *id
    }).collect()
}

fn em_duas_partes(ids: &[u32]) -> Vec<u32> {
    let (inicio, fim) = ids.split_at(ids.len() / 2);
    thread::scope(|escopo| {
        let primeira = escopo.spawn(|| processar(inicio));
        let segunda = processar(fim);
        let mut resposta = primeira.join().unwrap();
        resposta.extend(segunda);
        resposta
    })
}

fn main() {
    let ids = (1..=12).collect::<Vec<u32>>();
    let agora = Instant::now();
    let sequencial = processar(&ids);
    let tempo_seq = agora.elapsed();
    let agora = Instant::now();
    let concorrente = em_duas_partes(&ids);
    let tempo_conc = agora.elapsed();
    assert_eq!(sequencial, concorrente);
    println!("Saída equivalente: {} registros", sequencial.len());
    println!("Sequencial: {tempo_seq:?} | Concorrente: {tempo_conc:?}");
}`,
        },
        {
          type: 'quiz',
          activityId: 'juntar-na-ordem-original',
          question: 'Como o exemplo preserva a ordem de entrada mesmo com duas rotinas?',
          options: [
            {
              text: 'Acrescenta a segunda metade ao vetor da primeira metade.',
              correct: true,
              feedback:
                'O processamento de cada fatia preserva a ordem local. A junção restaura a ordem do lote.',
            },
            {
              text: 'Presume que a thread da primeira metade termina antes.',
              feedback:
                'O tempo de conclusão varia. O código garante a ordem por meio da junção explícita.',
            },
          ],
        },
        {
          type: 'fill',
          activityId: 'provar-equivalencia',
          language: 'rust',
          prompt: 'Complete a asserção que compara os resultados completos.',
          template: '[[assert_eq!]](sequencial, concorrente);',
          explanation:
            'A igualdade dos vetores verifica quantidade, valores e ordem para a carga usada.',
        },
      ],
    },
    {
      id: 'interpretar-medicoes',
      title: 'Compare repetições e registre o custo',
      blocks: [
        {
          type: 'text',
          text: 'Rode várias vezes e alterne qual versão executa primeiro. Anote a carga, o modo de compilação, o número de workers e a mediana ou a variação observada. Experimente um lote pequeno ou retire a espera simulada. Criar threads e coordenar resultados tem custo, e uma melhoria em um lote pode perder na outra carga.',
        },
        {
          type: 'order',
          activityId: 'roteiro-de-medicao',
          prompt: 'Ordene o roteiro para decidir se mantém a mudança.',
          items: [
            'Definir a carga e o resultado esperado',
            'Comparar as saídas e coletar tempos repetidos',
            'Registrar os limites da medição e justificar a escolha',
          ],
          explanation:
            'Os tempos só fundamentam uma decisão depois de conferir o trabalho feito e documentar como foi medido.',
        },
      ],
    },
  ],
  recap: [
    'Comparo versões com a mesma carga e o mesmo critério de saída.',
    'Limito o número de rotinas e aguardo seus resultados.',
    'Uso repetições para justificar benefícios e custos nas entradas medidas.',
  ],
  cards: [
    {
      id: 'referencia',
      front: 'O que a versão sequencial fornece?',
      back: 'Um comportamento e um custo de referência para comparar outra implementação.',
    },
    {
      id: 'escopo',
      front: 'Por que a thread do exemplo pode tomar uma fatia emprestada?',
      back: 'Thread de escopo termina antes de sair da região em que o empréstimo precisa ser válido.',
    },
    {
      id: 'consistencia',
      front: 'O que a asserção de igualdade verifica?',
      back: 'Os registros e sua ordem para a carga executada.',
    },
    {
      id: 'custo',
      front: 'Por que medir também com uma carga pequena?',
      back: 'A coordenação e a criação de threads podem custar mais que o tempo economizado.',
    },
  ],
  mission: {
    title: 'Leve a medição para o seu importador',
    text: 'Use a mesma carga de arquivos da missão de concorrência para comparar uma versão sequencial e outra com fila limitada.',
    steps: [
      'Teste a equivalência das saídas, a quantidade de resultados e o encerramento dos workers.',
      'Registre tempos repetidos, os limites de fila e de workers e a decisão para o cenário medido.',
    ],
  },
  sources: [
    {
      title: 'Biblioteca padrão — threads de escopo',
      url: 'https://doc.rust-lang.org/std/thread/fn.scope.html',
    },
    {
      title: 'Biblioteca padrão — medição com Instant',
      url: 'https://doc.rust-lang.org/std/time/struct.Instant.html',
    },
  ],
};
