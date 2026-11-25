import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Você quer testar a recomendação com dados em memória e reaproveitar a regra quando mudar a origem dos dados. Defina a capacidade que a regra precisa e acompanhe os tipos ao percorrer a coleção.',
  sections: [
    {
      id: 'capacidade-em-um-trait',
      title: 'Defina o que o chamador precisa saber',
      blocks: [
        {
          type: 'text',
          text: 'Um `trait` declara operações que um tipo pode oferecer. `FonteDeAulas` precisa disponibilizar as aulas como uma fatia. Uma implementação pode guardar um vetor e outra, um array. Uma função genérica com `F: FonteDeAulas` consegue chamar os métodos prometidos para qualquer tipo compatível.',
        },
        {
          type: 'fill',
          activityId: 'restringir-tipo-pelo-trait',
          language: 'rust',
          prompt: 'Complete a restrição para usar o método aulas no corpo da função.',
          template:
            'fn primeira<F: [[FonteDeAulas]]>(fonte: &F) -> Option<&Aula> {\n    fonte.aulas().first()\n}',
          explanation:
            'A restrição diz que qualquer F aceito implementa o método definido no trait.',
        },
        {
          type: 'quiz',
          activityId: 'interface-e-representacao',
          question:
            'A origem muda de Vec para um array. O que a regra genérica usa para continuar funcionando?',
          options: [
            {
              text: 'A implementação do mesmo trait pela nova origem.',
              correct: true,
              feedback:
                'A regra recebe a fatia prometida pela assinatura. A estrutura usada internamente pertence à fonte.',
            },
            {
              text: 'Uma conversão obrigatória para Vec antes de cada chamada.',
              feedback:
                'Um array também pode ser emprestado como fatia. O contrato exige uma fatia, e essa conversão seria trabalho a mais.',
            },
          ],
        },
      ],
    },
    {
      id: 'etapas-de-um-iterador',
      title: 'Siga os tipos em iter, filter, map e collect',
      blocks: [
        {
          type: 'text',
          text: '`iter` entrega referências aos itens. `filter` conserva os que passam pelo predicado. `map` transforma cada item que restou em seu título. `collect` consome o iterador para formar o vetor final. Aqui os títulos são referências aos dados da fonte, e a leitura evita copiar as Strings.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Filtre uma fonte em memória e reutilize-a depois',
          code: `struct Aula {
    titulo: String,
    minutos: u32,
}

trait FonteDeAulas {
    fn aulas(&self) -> &[Aula];
}

struct Memoria(Vec<Aula>);

impl FonteDeAulas for Memoria {
    fn aulas(&self) -> &[Aula] {
        &self.0
    }
}

fn recomendar<F: FonteDeAulas>(fonte: &F, limite: u32) -> Vec<&str> {
    fonte.aulas().iter()
        .filter(|aula| aula.minutos <= limite)
        .map(|aula| aula.titulo.as_str())
        .collect()
}

fn main() {
    let fonte = Memoria(vec![
        Aula { titulo: String::from("Filas"), minutos: 20 },
        Aula { titulo: String::from("Streams"), minutos: 31 },
    ]);
    println!("{:?}", recomendar(&fonte, 20));
    println!("Cadastradas: {}", fonte.aulas().len());
}`,
          output: '["Filas"]\nCadastradas: 2',
        },
        {
          type: 'order',
          activityId: 'ordem-do-iterador',
          prompt: 'Ordene o fluxo da recomendação.',
          items: [
            'Emprestar as aulas da fonte',
            'Selecionar pelo limite em minutos',
            'Transformar as aulas selecionadas em títulos',
            'Reunir as referências em Vec',
          ],
          explanation:
            'O filtro usa a duração, que ainda está na aula inteira. A transformação em título acontece depois.',
        },
      ],
    },
    {
      id: 'consumo-e-trabalho-necessario',
      title: 'Colete um resultado quando o chamador precisa dele',
      blocks: [
        {
          type: 'text',
          text: 'Uma sequência de adaptadores prepara o trabalho. O iterador avança quando algo pede o próximo item. Para saber se existe ao menos uma aula curta, `any` pode parar na primeira resposta verdadeira. Se o chamador quer todos os títulos, `collect` percorre o que precisa e monta o vetor.',
        },
        {
          type: 'classify',
          activityId: 'escolher-o-consumidor',
          prompt: 'Escolha a operação que entrega diretamente o resultado pedido.',
          buckets: ['`any`', '`collect`'],
          items: [
            { text: 'Responder se alguma aula tem até 20 minutos', bucket: 0 },
            { text: 'Devolver todos os títulos que cabem', bucket: 1 },
          ],
          explanation:
            'any devolve um booleano e pode encerrar cedo. collect reúne todos os itens restantes na coleção pedida.',
        },
      ],
    },
  ],
  recap: [
    'Uso um trait para expressar a capacidade pedida pela função.',
    'Sigo a transformação dos tipos ao longo de um iterador.',
    'Escolho o consumo do iterador de acordo com a saída que o chamador usa.',
  ],
  cards: [
    {
      id: 'trait',
      front: 'O que a restrição F: FonteDeAulas garante?',
      back: 'O tipo F implementa os métodos exigidos por FonteDeAulas.',
    },
    {
      id: 'referencia',
      front: 'O que iter entrega sobre uma fatia?',
      back: 'Referências aos itens.',
    },
    { id: 'map', front: 'Em qual operação cada aula vira um título?', back: 'Em map.' },
    {
      id: 'parar',
      front: 'Qual operação pode parar na primeira correspondência?',
      back: 'any, para responder se ao menos um item passa pela condição.',
    },
  ],
  mission: {
    title: 'Reaproveite a recomendação com outra fonte',
    text: 'Implemente o mesmo trait para uma fonte de teste com um array de três aulas.',
    steps: [
      'Verifique a ordem dos dois títulos que passam pelo filtro.',
      'Compare listar todos com responder se existe algum. Use a operação que atende a cada contrato.',
    ],
  },
  sources: [
    { title: 'Rust Book — traits', url: 'https://doc.rust-lang.org/book/ch10-02-traits.html' },
    {
      title: 'Rust Book — iteradores',
      url: 'https://doc.rust-lang.org/book/ch13-02-iterators.html',
    },
  ],
};
