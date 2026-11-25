import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Um assistente sugeriu trocar todo o catálogo pelo lote recém-importado. A proposta compila e passa no caso de catálogo vazio. Examine o que ela altera quando já existem dados e prove a correção com uma entrada que a própria proposta deixou de testar.',
  sections: [
    {
      id: 'revisao-do-diff',
      title: 'Leia a mutação e escreva o contrato',
      blocks: [
        {
          type: 'text',
          text: '`*catalogo = novas` atribui um vetor inteiro pelo empréstimo mutável. Se o contrato manda atualizar títulos pelo ID, a revisão precisa verificar o progresso do registro atualizado e o que acontece com aulas ausentes do lote. Separe o que a proposta faz do comportamento solicitado.',
        },
        {
          type: 'quiz',
          activityId: 'efeito-da-atribuicao',
          question:
            'O catálogo tem IDs 7 e 8. O lote contém apenas o ID 7 com o progresso zerado. O que a atribuição do vetor inteiro causa?',
          options: [
            {
              text: 'O ID 8 desaparece e o ID 7 recebe o progresso do lote.',
              correct: true,
              feedback: 'A atribuição substitui todos os elementos do vetor original.',
            },
            {
              text: 'Somente o título do ID 7 muda.',
              feedback:
                'A linha atualiza o vetor inteiro. Para preservar campos, seria preciso encontrá-los e alterá-los separadamente.',
            },
          ],
        },
      ],
    },
    {
      id: 'provar-a-correcao',
      title: 'Escreva um teste que falhe na versão antiga',
      blocks: [
        {
          type: 'text',
          text: 'No teste abaixo, a aula registrada tem progresso e o lote tem um título novo. O segundo teste verifica um registro ausente e executa o mesmo lote duas vezes. Em um projeto criado com `cargo new catalogo --lib`, cole o código em `src/lib.rs`. Rode `cargo test`. Troque temporariamente o corpo da função por `*catalogo = novas` e veja as expectativas que falham.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Biblioteca com a alteração e dois testes independentes',
          code: `pub struct Aula {
    pub id: u32,
    pub titulo: String,
    pub estudada: bool,
}

pub fn importar(catalogo: &mut Vec<Aula>, novas: Vec<Aula>) {
    for aula in novas {
        if let Some(existente) = catalogo.iter_mut().find(|item| item.id == aula.id) {
            existente.titulo = aula.titulo;
        } else {
            catalogo.push(aula);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn aula(id: u32, titulo: &str, estudada: bool) -> Aula {
        Aula { id, titulo: titulo.to_owned(), estudada }
    }

    #[test]
    fn atualiza_titulo_e_preserva_progresso() {
        let mut catalogo = vec![aula(7, "Rust básico", true)];
        importar(&mut catalogo, vec![aula(7, "Fundamentos", false)]);
        assert_eq!(catalogo[0].titulo, "Fundamentos");
        assert!(catalogo[0].estudada);
    }

    #[test]
    fn guarda_ausentes_e_aceita_repeticao() {
        let mut catalogo = vec![aula(8, "Cargo", true)];
        for _ in 0..2 {
            importar(&mut catalogo, vec![aula(7, "Rust", false)]);
        }
        let ids: Vec<u32> = catalogo.iter().map(|aula| aula.id).collect();
        assert_eq!(ids, vec![8, 7]);
    }
}`,
        },
        {
          type: 'fill',
          activityId: 'encontrar-registro-editavel',
          language: 'rust',
          prompt: 'Escolha a iteração que permite editar o título do item encontrado.',
          template: 'catalogo.[[iter_mut]]().find(|item| item.id == aula.id)',
          explanation:
            'O iterador mutável devolve uma referência exclusiva ao registro encontrado.',
        },
        {
          type: 'order',
          activityId: 'sequencia-de-revisao',
          prompt: 'Ordene a verificação de uma correção de regressão.',
          items: [
            'Registrar o contrato e escrever um teste independente',
            'Rodar o teste contra a proposta original e observar a falha',
            'Aplicar a correção, rodar o teste e revisar o diff',
          ],
          explanation:
            'O teste fica ligado ao problema real quando demonstra a falha antes da mudança.',
        },
      ],
    },
    {
      id: 'custo-e-limites',
      title: 'Justifique o custo e compare alternativas com dados',
      blocks: [
        {
          type: 'text',
          text: 'O exemplo move os títulos fornecidos pelo lote e percorre o vetor para encontrar cada ID. Em lotes grandes, buscas repetidas podem dominar o custo. Um índice de ID para posição pode acelerar buscas se for mantido junto com as inserções. Antes de adotar um índice, meça com uma carga representativa e valide os mesmos testes de integridade e ordem.',
        },
        {
          type: 'quiz',
          activityId: 'evidencia-de-otimizacao',
          question: 'Como demonstrar que a versão com índice é adequada para a equipe?',
          options: [
            {
              text: 'Rodar os mesmos testes e comparar tempos com a mesma carga.',
              correct: true,
              feedback:
                'A decisão precisa de evidência de comportamento preservado e de desempenho no cenário desejado.',
            },
            {
              text: 'Aceitar a aceleração estimada pela IA sem executar o importador.',
              feedback:
                'O benefício depende das entradas, da implementação e do trabalho de manter o índice.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Identifico quais dados uma mutação substitui.',
    'Crio testes que revelam perda de dados e duplicação.',
    'Justifico o custo do diff com uma carga e expectativas reproduzíveis.',
  ],
  cards: [
    {
      id: 'mutacao',
      front: 'O que *catalogo = novas altera?',
      back: 'Substitui o vetor original inteiro.',
    },
    {
      id: 'regressao',
      front: 'Como sei se o teste reproduziu a regressão?',
      back: 'A versão antiga falha no caso controlado e a versão corrigida passa.',
    },
    {
      id: 'repeticao',
      front: 'O que comparar após importar o mesmo lote duas vezes?',
      back: 'Quantidade, IDs, ordem e campos que precisam ser preservados.',
    },
    {
      id: 'preco',
      front: 'Antes de adotar um índice, o que verificar?',
      back: 'O custo para a carga medida e a preservação do comportamento.',
    },
  ],
  mission: {
    title: 'Escreva um parecer de revisão verificável',
    text: 'Use a proposta da missão Revise uma sugestão de código da IA e registre um contraexemplo.',
    steps: [
      'Mostre qual teste falha na proposta e qual linha explica a falha.',
      'Proponha a menor mudança que atende ao pedido e deixe o comando para reproduzir os testes.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — como escrever testes',
      url: 'https://doc.rust-lang.org/book/ch11-01-writing-tests.html',
    },
    {
      title: 'Biblioteca padrão — Iterator::find',
      url: 'https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.find',
    },
  ],
};
