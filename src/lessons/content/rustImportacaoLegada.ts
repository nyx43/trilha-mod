import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O suporte precisa indicar a linha problemática de um arquivo sem perder o diagnóstico da causa. Você vai separar a leitura do arquivo, a interpretação de uma linha e a decisão de continuar a importação.',
  sections: [
    {
      id: 'contrato-do-parser',
      title: 'Defina o formato e as falhas da linha',
      blocks: [
        {
          type: 'text',
          text: 'A entrada deste exercício usa `minutos:título`. Defina três falhas esperadas: separador ausente, minutos inválidos e título vazio. O parser trabalha sobre uma linha emprestada e devolve um registro com o número interpretado e uma fatia de texto. Essa função também pode receber uma string em um teste.',
        },
        {
          type: 'classify',
          activityId: 'classificar-linhas',
          prompt: 'Escolha a primeira falha detectada em cada linha.',
          buckets: ['Sem separador', 'Minutos inválidos', 'Título vazio'],
          items: [
            { text: '`15 Cargo`', bucket: 0 },
            { text: '`quinze:Cargo`', bucket: 1 },
            { text: '`15:   `', bucket: 2 },
          ],
          explanation:
            'O parser separa, converte e valida, nessa ordem. Cada falha informa o passo que a entrada não conseguiu concluir.',
        },
        {
          type: 'quiz',
          activityId: 'quem-escolhe-continuar',
          question: 'Quem deve decidir se um erro de linha cancela o lote inteiro?',
          options: [
            {
              text: 'O chamador que conhece o contrato do lote.',
              correct: true,
              feedback:
                'O parser devolve a causa. A política de aceitar ou cancelar pertence ao fluxo de importação.',
            },
            {
              text: 'A conversão interna de minutos.',
              feedback: 'A conversão só conhece a validade do número, sem informação sobre o lote.',
            },
          ],
        },
      ],
    },
    {
      id: 'arquivo-e-falhas',
      title: 'Interpretar arquivos em partes permite informar o número da linha',
      blocks: [
        {
          type: 'text',
          text: '`BufRead::lines` entrega um `Result<String, io::Error>` por leitura. Um erro de I/O encerra este exemplo com `?`. Para erros de formato, o exemplo emite um diagnóstico e continua. Com `enumerate`, some um ao índice para usar a numeração de linhas que a pessoa vê no editor.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Leia um arquivo em memória com a mesma interface de um BufReader',
          code: `use std::io::{self, BufRead, Cursor};

#[derive(Debug, PartialEq)]
enum Falha {
    SemSeparador,
    MinutosInvalidos,
    TituloVazio,
}

fn interpretar(linha: &str) -> Result<(u32, &str), Falha> {
    let (minutos, titulo) = linha.split_once(':').ok_or(Falha::SemSeparador)?;
    let minutos = minutos.trim().parse().map_err(|_| Falha::MinutosInvalidos)?;
    let titulo = titulo.trim();
    if titulo.is_empty() {
        return Err(Falha::TituloVazio);
    }
    Ok((minutos, titulo))
}

fn ler(origem: impl BufRead) -> io::Result<()> {
    for (indice, linha) in origem.lines().enumerate() {
        let linha = linha?;
        match interpretar(&linha) {
            Ok((minutos, titulo)) => println!("{titulo}: {minutos} min"),
            Err(falha) => println!("Linha {}: {falha:?}", indice + 1),
        }
    }
    Ok(())
}

fn main() -> io::Result<()> {
    let dados = "15: Cargo\\nincompleta\\n20: Empréstimos\\n";
    ler(Cursor::new(dados.as_bytes()))
}`,
          output: 'Cargo: 15 min\nLinha 2: SemSeparador\nEmpréstimos: 20 min',
        },
        {
          type: 'fill',
          activityId: 'converter-a-opcao-em-erro',
          language: 'rust',
          prompt: 'Transforme a ausência de separador em uma falha específica.',
          template: "linha.split_once(':').[[ok_or]](Falha::SemSeparador)?",
          explanation:
            '`ok_or` converte None em Err. `?` devolve esse erro antes de tentar interpretar o número.',
        },
      ],
    },
    {
      id: 'regressao-do-parser',
      title: 'Teste cada falha e preserve a leitura já aceita',
      blocks: [
        {
          type: 'text',
          text: 'Acrescente os testes abaixo ao final do arquivo e rode `cargo test`. Cada teste declara uma entrada e o resultado prometido. Use um caso com acento para observar que o título continua válido em UTF-8. Para ler um arquivo de verdade, passe `BufReader::new(File::open(caminho)?)` a `ler`, com os imports de `std::io::BufReader` e `std::fs::File`.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Testes do contrato do parser',
          code: `#[test]
fn aceita_titulo_com_acento() {
    assert_eq!(interpretar("20: Empréstimos "), Ok((20, "Empréstimos")));
}

#[test]
fn distingue_falhas() {
    assert_eq!(interpretar("20 Cargo"), Err(Falha::SemSeparador));
    assert_eq!(interpretar("vinte:Cargo"), Err(Falha::MinutosInvalidos));
    assert_eq!(interpretar("20: "), Err(Falha::TituloVazio));
}`,
        },
        {
          type: 'quiz',
          activityId: 'resultado-apos-linha-invalida',
          question: 'O que acontece com a terceira linha do exemplo?',
          options: [
            {
              text: 'É processada após o aviso sobre a segunda linha.',
              correct: true,
              feedback: 'O match registra a falha de formato e termina aquela iteração.',
            },
            {
              text: 'É descartada automaticamente porque uma linha anterior falhou.',
              feedback:
                'Esse seria outro contrato. Neste leitor, o retorno antecipado com ? acontece para falha de I/O.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Separo falhas da leitura e falhas da interpretação.',
    'Retorno diagnósticos específicos e preservo os títulos válidos.',
    'Provo cada caminho do parser com um teste de entrada e saída.',
  ],
  cards: [
    {
      id: 'parser',
      front: 'Por que separar interpretar de ler?',
      back: 'O parser pode ser testado com uma string e lê o mesmo formato em qualquer origem.',
    },
    {
      id: 'erro-io',
      front: 'Que tipo aparece ao percorrer BufRead::lines?',
      back: 'Result<String, io::Error> por linha lida.',
    },
    {
      id: 'numero-linha',
      front: 'Como converter o índice de enumerate em número de linha para exibição?',
      back: 'Some um ao índice.',
    },
    {
      id: 'borda',
      front: 'Qual parte escolhe continuar após uma linha inválida?',
      back: 'O chamador que trata o Result da interpretação.',
    },
  ],
  mission: {
    title: 'Adapte o parser ao leitor da missão',
    text: 'Na missão de código legado, a entrada tem formato id|título. Use o mesmo raciocínio com esse contrato.',
    steps: [
      'Antes da alteração, execute um exemplo válido e outro sem separador.',
      'Após a alteração, prove o comportamento com um título acentuado, um separador ausente e um título vazio.',
    ],
  },
  sources: [
    {
      title: 'Biblioteca padrão — BufRead',
      url: 'https://doc.rust-lang.org/std/io/trait.BufRead.html',
    },
    {
      title: 'Rust Book — erros recuperáveis',
      url: 'https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html',
    },
  ],
};
