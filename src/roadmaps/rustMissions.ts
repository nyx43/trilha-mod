export interface RustMission {
  stageId: string;
  title: string;
  scenario: string;
  starter?: { title: string; code: string };
  steps: string[];
  criteria: { id: string; label: string }[];
}

export const rustMissions: RustMission[] = [
  {
    stageId: 'rust.fundamentos',
    title: 'Sua primeira entrega no terminal',
    scenario:
      'Uma estudante quer descobrir quais aulas cabem em 20 minutos. Ela recebe uma lista com títulos e durações e precisa de uma resposta mesmo quando a lista estiver vazia.',
    starter: {
      title: 'src/main.rs',
      code: `fn main() {
    let aulas = [("Rust e Cargo", 15), ("Empréstimos", 20), ("Concorrência", 35)];
    // Liste os títulos com duração de até 20 minutos.
}`,
    },
    steps: [
      'Crie um projeto com cargo new catalogo e rode o exemplo com cargo run.',
      'Extraia a seleção para uma função. Preserve a ordem da entrada no resultado.',
      'Execute cargo test e demonstre a saída para quem pediu a mudança.',
    ],
    criteria: [
      { id: 'titulos-em-ordem', label: 'A saída mostra “Rust e Cargo” seguido de “Empréstimos”.' },
      {
        id: 'casos-limite',
        label: 'Um teste cobre a duração de exatamente 20 minutos e outro cobre a lista vazia.',
      },
      {
        id: 'evidencia',
        label:
          'A evidência mostra o comando, a saída observada e onde a regra do limite é aplicada.',
      },
    ],
  },
  {
    stageId: 'rust.memoria',
    title: 'Rastreie e corrija um leitor legado',
    scenario:
      'O catálogo antigo lê linhas no formato id|título. Uma linha incompleta derruba a importação inteira. A equipe quer preservar a leitura de linhas válidas e receber um erro explícito nas inválidas.',
    starter: {
      title: 'src/main.rs — código legado',
      code: `fn titulo(linha: &str) -> &str {
    linha.split_once('|').unwrap().1.trim()
}

fn main() {
    for linha in ["7|Empréstimos", "linha incompleta"] {
        println!("{}", titulo(linha));
    }
}`,
    },
    steps: [
      'Rode o programa sem alterações. Siga a entrada até a chamada que falha e registre o primeiro diagnóstico.',
      'Escreva testes para uma linha válida, uma sem separador e outra com título vazio.',
      'Use Result para representar a falha e trate-a em main. Explique de onde vem o &str devolvido, sem copiar o título para corrigir o problema.',
    ],
    criteria: [
      { id: 'titulo-valido', label: 'Linhas válidas preservam o título, incluindo acentos.' },
      { id: 'linha-invalida', label: 'A ausência do separador ou do título é tratada sem panic.' },
      {
        id: 'evidencia',
        label:
          'A evidência mostra um teste que falhava antes, o resultado depois e uma explicação de quem possui o texto.',
      },
    ],
  },
  {
    stageId: 'rust.bibliotecas',
    title: 'Revise uma sugestão de código da IA',
    scenario:
      'A IA sugeriu substituir o catálogo inteiro ao importar uma lista. A equipe quer atualizar títulos pelo ID, manter o progresso já registrado e preservar aulas ausentes do lote.',
    starter: {
      title: 'src/lib.rs — proposta para revisar',
      code: `#[derive(Debug, PartialEq, Eq)]
struct Aula {
    id: u32,
    titulo: String,
    estudada: bool,
}

fn importar(catalogo: &mut Vec<Aula>, novas: Vec<Aula>) {
    *catalogo = novas;
}`,
    },
    steps: [
      'Crie um teste com os IDs 7 e 8 no catálogo. Marque a aula 7 como estudada e importe um novo título para o ID 7, com estudada igual a false.',
      'Explique quais valores a atribuição substitui. Rode o teste com a proposta original e confirme a perda de dados.',
      'Corrija a função em um diff pequeno. Rode o teste novamente e acrescente um caso de importação repetida.',
    ],
    criteria: [
      {
        id: 'dados-preservados',
        label: 'O ID 7 recebe o novo título e continua estudado. O ID 8 permanece no catálogo.',
      },
      { id: 'lote-repetido', label: 'Importar o mesmo lote duas vezes conserva uma aula por ID.' },
      {
        id: 'evidencia',
        label:
          'A evidência registra o comportamento da proposta, a correção e o resultado de cargo test.',
      },
    ],
  },
  {
    stageId: 'rust.concorrencia',
    title: 'Limite a fila e prove a melhoria',
    scenario:
      'O importador passa parte do tempo esperando I/O. Foi sugerido iniciar uma tarefa por arquivo; a equipe precisa manter o uso de recursos previsível e interromper o trabalho de forma limpa.',
    starter: {
      title: 'Carga de teste',
      code: `Lote: 12 arquivos fictícios, com IDs de 1 a 12
Fila: 4 posições
Workers: no máximo 2
Para simular I/O, adicione a mesma espera curta por arquivo nas duas versões.`,
    },
    steps: [
      'Use a versão sequencial como referência. Depois implemente a fila de capacidade fixa e defina como o produtor espera por espaço.',
      'Registre o maior número de workers ativos. Teste encerramento com a fila vazia e cancelamento após alguns arquivos, sem deixar o processo preso.',
      'Compare as versões em release com a mesma carga e várias execuções. Registre os tempos e o critério para manter a mudança.',
    ],
    criteria: [
      {
        id: 'resultados-equivalentes',
        label:
          'Sem cancelamento, as duas versões entregam os mesmos 12 resultados, mesmo que a ordem de execução mude.',
      },
      {
        id: 'limites-e-cancelamento',
        label:
          'A fila e o número de workers respeitam os limites e o processo encerra ao cancelar.',
      },
      {
        id: 'evidencia',
        label:
          'A evidência inclui os comandos, a carga usada, os tempos medidos e a decisão de manter ou descartar a mudança.',
      },
    ],
  },
  {
    stageId: 'rust.backend',
    title: 'Transforme o pedido em um contrato',
    scenario:
      'O cliente pediu importar aulas sem bagunçar o catálogo. Na conversa, esclareceu que duplicata significa mesmo ID, que o progresso existente deve ser mantido e que o lote deve ser cancelado inteiro se uma linha for inválida.',
    starter: {
      title: 'Exemplo para combinar o aceite',
      code: `Banco inicial: id=7, titulo="Rust básico", estudada=true
Lote válido: id=7, titulo="Fundamentos"; id=8, titulo="Cargo"
Lote inválido: id=9, titulo="Testes"; id=10, titulo=""
Novo título do ID 7: "Fundamentos". O progresso continua true.`,
    },
    steps: [
      'Escreva os critérios em linguagem de cliente e defina a resposta da API para lote válido e inválido.',
      'Implemente ou adapte POST /importacoes com validação e uma transação SQLite.',
      'Demonstre os dois cenários com chamadas HTTP e verifique o banco após cada uma.',
    ],
    criteria: [
      {
        id: 'lote-valido',
        label: 'Após o lote válido, o ID 7 continua estudado e aparece uma aula com ID 8.',
      },
      {
        id: 'lote-revertido',
        label: 'O lote inválido devolve um erro útil e os IDs 9 e 10 não aparecem no banco.',
      },
      {
        id: 'evidencia',
        label:
          'A evidência liga cada critério a uma requisição, sua resposta e o estado após a execução.',
      },
    ],
  },
  {
    stageId: 'rust.entrega',
    title: 'Entregue uma mudança pronta para revisão',
    scenario:
      'Outra pessoa vai manter o catálogo depois de você. Entregue a correção do importador como se fosse um pull request e demonstre ao cliente que a mudança cumpre o que foi combinado.',
    steps: [
      'Parta de uma versão anterior do catálogo. Escolha uma falha que ainda não esteja coberta e escreva um teste de regressão antes da mudança.',
      'Entregue um diff pequeno e um roteiro que começa com os comandos para reproduzir o problema. Inclua as decisões de dados, erros e concorrência que se aplicam à mudança.',
      'Simule a demonstração com os dados do cliente e peça a outra pessoa para reproduzir pelo roteiro. Use dados fictícios nas evidências.',
    ],
    criteria: [
      {
        id: 'rastreabilidade',
        label:
          'A revisão consegue seguir a entrada até o estado persistido ou a saída e identificar onde o comportamento mudou.',
      },
      {
        id: 'comportamento-e-dados',
        label:
          'A entrega demonstra pelo menos um caso de sucesso, uma falha e a preservação dos dados existentes.',
      },
      {
        id: 'roteiro',
        label:
          'O roteiro contém os comandos, critérios de aceite e resultados observados, com um limite conhecido da solução.',
      },
    ],
  },
];
