import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Uma busca pode voltar vazia e a duração digitada pode ser inválida. Essas duas situações pedem respostas diferentes. Você vai representá-las nos tipos e escolher onde apresentar cada mensagem.',
  sections: [
    {
      id: 'ausencia-com-option',
      title: 'Represente a ausência de um valor',
      blocks: [
        {
          type: 'text',
          text: '`Option<T>` tem dois casos: `Some(valor)` e `None`. Ao usar `first` numa fatia, você recebe uma referência ao primeiro valor, se existir. Use `match` para lidar com as duas possibilidades, inclusive a lista vazia.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'A mesma função aceita listas vazias e preenchidas',
          code: `fn mostrar_primeira(duracoes: &[u32]) {
    match duracoes.first() {
        Some(minutos) => println!("Primeira aula: {minutos} minutos"),
        None => println!("Catálogo vazio"),
    }
}

fn main() {
    mostrar_primeira(&[15, 20]);
    mostrar_primeira(&[]);
}`,
          output: 'Primeira aula: 15 minutos\nCatálogo vazio',
        },
        {
          type: 'fill',
          activityId: 'tratar-nenhum-valor',
          language: 'rust',
          prompt: 'Complete o braço de match para a lista vazia.',
          template:
            'match duracoes.first() {\n    Some(minutos) => println!("{minutos}"),\n    [[None]] => println!("Catálogo vazio"),\n}',
          explanation: '`None` é a variante de Option que representa ausência.',
        },
      ],
    },
    {
      id: 'falha-com-result',
      title: 'Devolva o motivo de uma falha',
      blocks: [
        {
          type: 'text',
          text: '`Result<T, E>` representa sucesso com `Ok(valor)` e falha com `Err(erro)`. Em `parse::<u32>()`, a conversão pode falhar se o texto não representar um valor aceito pelo tipo. Um `match` na borda do programa transforma o erro em mensagem para a pessoa.',
        },
        {
          type: 'classify',
          activityId: 'escolher-retorno',
          prompt: 'Escolha o tipo de retorno que representa o contrato de cada operação.',
          buckets: [
            '`Option` para presença ou ausência',
            '`Result` para sucesso ou falha descrita',
          ],
          items: [
            { text: 'Consultar a primeira aula sem exigir que a lista tenha itens', bucket: 0 },
            { text: 'Converter a duração e informar se o texto é inválido', bucket: 1 },
            { text: 'Procurar um ID e retornar a aula, se encontrada', bucket: 0 },
          ],
          explanation:
            'Use Option quando só importa se há valor. Use Result quando o chamador precisa saber por que a operação falhou.',
        },
        {
          type: 'quiz',
          activityId: 'conversao-falha',
          question: 'Qual variante devolve `"vinte".parse::<u32>()`?',
          options: [
            {
              text: '`Err(...)`',
              correct: true,
              feedback: 'A conversão espera texto numérico e devolve um erro de conversão.',
            },
            {
              text: '`None`',
              feedback: '`parse` devolve `Result`. Para representar a falha, ele usa `Err`.',
            },
          ],
        },
      ],
    },
    {
      id: 'propagar-com-interrogacao',
      title: 'Propague o erro e decida na borda do programa',
      blocks: [
        {
          type: 'text',
          text: '`map_err` traduz o erro de conversão para a mensagem deste programa. O operador `?` extrai o valor em caso de sucesso ou retorna a falha da função imediatamente. A função continua depois do `?` apenas quando há um número válido. Deixe `main` decidir como apresentar a mensagem.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Converta texto e valide a duração para este cadastro',
          code: `fn ler_duracao(entrada: &str) -> Result<u32, &'static str> {
    let minutos = entrada.trim().parse::<u32>()
        .map_err(|_| "use um número inteiro sem sinal")?;
    if minutos == 0 {
        return Err("a duração precisa ser maior que zero");
    }
    Ok(minutos)
}

fn main() {
    for entrada in [" 20 ", "vinte", "0"] {
        match ler_duracao(entrada) {
            Ok(minutos) => println!("{minutos} min"),
            Err(erro) => println!("Entrada inválida: {erro}"),
        }
    }
}`,
          output:
            '20 min\nEntrada inválida: use um número inteiro sem sinal\nEntrada inválida: a duração precisa ser maior que zero',
        },
        {
          type: 'order',
          activityId: 'processar-uma-duracao-valida',
          prompt: 'Ordene as ações realizadas para uma entrada válida de duração.',
          items: [
            'Remover espaços das bordas',
            'Converter a fatia em u32',
            'Aplicar a regra de duração maior que zero',
            'Entregar o número em Ok',
          ],
          explanation:
            'Primeiro o código resolve a sintaxe da entrada. Com o valor em mãos, ele aplica a regra do cadastro.',
        },
      ],
    },
  ],
  recap: [
    'Uso Option para representar presença ou ausência.',
    'Uso Result para devolver um valor ou um erro.',
    'Propago a falha com ? e deixo o chamador escolher a ação.',
  ],
  cards: [
    {
      id: 'option',
      front: 'Quais são as variantes de Option?',
      back: 'Some para um valor presente e None para ausência.',
    },
    {
      id: 'result',
      front: 'Quais são as variantes de Result?',
      back: 'Ok para sucesso e Err para uma falha com informação.',
    },
    {
      id: 'pergunta',
      front: 'O que ? faz diante de Err?',
      back: 'Encerra aquela função com Err, convertendo o tipo de erro quando necessário.',
    },
    {
      id: 'parse',
      front: 'Por que a função trata a conversão antes de verificar se a duração é maior que zero?',
      back: 'A regra do cadastro precisa de um número válido para fazer a comparação.',
    },
  ],
  mission: {
    title: 'Demonstre a diferença entre falhas',
    text: 'Use a leitura do terminal e a função ler_duracao para validar uma linha.',
    steps: [
      'Rode com `20`, com `0` e com `vinte`. Confirme qual fluxo cada entrada percorreu.',
      'Mostre ao usuário mensagens distintas para texto inválido e para uma duração que viola a regra.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — Option e enums',
      url: 'https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html',
    },
    {
      title: 'Rust Book — Result e propagação de erro',
      url: 'https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html',
    },
  ],
};
