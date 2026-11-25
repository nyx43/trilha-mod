import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Uma leitura pode ficar esperando muito mais do que a pessoa aceita. Você vai colocar um prazo na operação, observar quais estados o código precisa preservar e distinguir cancelar uma espera de encerrar uma tarefa criada no runtime.',
  sections: [
    {
      id: 'futures-e-cooperacao',
      title: 'Identifique onde uma tarefa pode esperar',
      blocks: [
        {
          type: 'text',
          text: 'Uma função `async` devolve um future. O runtime consulta o progresso desse future. Um ponto de `await` pode devolver o controle quando o valor ainda não está pronto, permitindo avançar outras tarefas. I/O assíncrono se beneficia disso. Um laço longo de CPU ou uma chamada bloqueante dentro da tarefa ocupa a thread até devolver o controle.',
        },
        {
          type: 'classify',
          activityId: 'espera-ou-bloqueio',
          prompt: 'Classifique o que acontece na thread do runtime.',
          buckets: ['Pode ceder a thread enquanto espera', 'Ocupa a thread até terminar'],
          items: [
            { text: 'Aguardar um temporizador com tokio::time::sleep(...).await', bucket: 0 },
            { text: 'Dormir com std::thread::sleep dentro da tarefa', bucket: 1 },
            { text: 'Executar um laço de cálculo longo sem pontos de espera', bucket: 1 },
          ],
          explanation:
            'Uma espera assíncrona avisa o runtime que pode retomar depois. Trabalho bloqueante exige um pool apropriado e limites de concorrência.',
        },
      ],
    },
    {
      id: 'prazo-observavel',
      title: 'Use timeout e trate os dois resultados',
      blocks: [
        {
          type: 'text',
          text: 'Em um projeto novo, instale Tokio com `cargo add tokio@1 --features macros,rt,time`. O exemplo combina duas esperas com `join!` no mesmo runtime. `pending` representa uma operação que nunca fica pronta e deixa o teste de prazo previsível. `timeout` devolve `Err` ao expirar e descarta o future que estava aguardando.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Compare uma leitura pronta com uma espera sem resposta',
          code: `use std::{future::pending, time::Duration};
use tokio::time::timeout;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let prazo = Duration::from_millis(20);
    let (pronta, atrasada) = tokio::join!(
        timeout(prazo, async { "metadados lidos" }),
        timeout(prazo, pending::<&str>()),
    );

    println!("Leitura: {}", pronta.expect("leitura imediata"));
    println!("Prazo expirou: {}", atrasada.is_err());
}`,
          output: 'Leitura: metadados lidos\nPrazo expirou: true',
        },
        {
          type: 'fill',
          activityId: 'tratar-prazo-estourado',
          language: 'rust',
          prompt: 'Complete o caso que trata a expiração do prazo.',
          template:
            'match timeout(prazo, leitura()).await {\n    Ok(dados) => registrar(dados),\n    [[Err]](_) => registrar_atraso(),\n}',
          explanation:
            'O resultado externo informa se o prazo foi respeitado. Se a leitura também usa Result, trate o resultado interno ao receber Ok.',
        },
        {
          type: 'quiz',
          activityId: 'prazo-sem-cooperacao',
          question:
            'Qual caso pode passar do prazo antes que o runtime consiga observar a expiração?',
          options: [
            {
              text: 'Um laço de CPU longo que nunca devolve o controle.',
              correct: true,
              feedback:
                'O runtime precisa voltar a executar a lógica do temporizador para observar a expiração.',
            },
            {
              text: 'O future pending do exemplo.',
              feedback:
                'Pending devolve o controle quando é consultado. O runtime consegue verificar o relógio.',
            },
          ],
        },
      ],
    },
    {
      id: 'tarefas-e-estado',
      title: 'Defina o que o cancelamento preserva',
      blocks: [
        {
          type: 'text',
          text: 'Ao usar `tokio::spawn`, o runtime passa a gerenciar uma tarefa independente. Descartar seu `JoinHandle` deixa a tarefa rodar. Para solicitar o cancelamento de uma tarefa assíncrona, chame `handle.abort()` e aguarde o handle para observar o término. Escritas já efetivadas continuam visíveis. Combine quando gravar e como detectar o trabalho concluído antes de repetir uma operação.',
        },
        {
          type: 'quiz',
          activityId: 'prazo-e-efeito-colateral',
          question:
            'Uma tarefa gravou a primeira linha antes de expirar. O que você deve conferir ao tentar de novo?',
          options: [
            {
              text: 'O estado depois da expiração e se a nova tentativa é segura para os dados já gravados.',
              correct: true,
              feedback:
                'O prazo limita a espera. A regra da operação precisa cuidar do estado e da repetição.',
            },
            {
              text: 'Apenas o tempo limite, assumindo que o dado gravado sumiu.',
              feedback:
                'Uma gravação que já aconteceu permanece. Verifique seu efeito antes de repetir.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Reconheço esperas que cedem o controle e operações que bloqueiam.',
    'Observo o resultado do prazo e trato a falha do trabalho em separado.',
    'Defino a situação dos dados quando uma tarefa expira ou é cancelada.',
  ],
  cards: [
    {
      id: 'future',
      front: 'O que uma função async devolve?',
      back: 'Um future que o runtime conduz até a conclusão.',
    },
    {
      id: 'prazo',
      front: 'Qual variante externa de timeout indica expiração?',
      back: 'Err, com a indicação de que o tempo passou.',
    },
    {
      id: 'handle',
      front: 'O que acontece ao descartar o JoinHandle de uma tarefa?',
      back: 'A tarefa segue independente, sem o handle para aguardar sua resposta.',
    },
    {
      id: 'estado',
      front: 'O que verificar depois de cancelar?',
      back: 'O que já foi gravado e quais efeitos uma nova tentativa pode ter.',
    },
  ],
  mission: {
    title: 'Compare duas leituras com o mesmo prazo',
    text: 'Substitua a espera infinita por uma leitura simulada cuja demora você controla.',
    steps: [
      'Execute um caso que conclui e outro que expira. Registre a resposta de cada um.',
      'Explique em qual ponto é seguro registrar o resultado da leitura e que dados consultar numa nova tentativa.',
    ],
  },
  sources: [
    { title: 'Tokio — timeout', url: 'https://docs.rs/tokio/latest/tokio/time/fn.timeout.html' },
    {
      title: 'Tokio — JoinHandle',
      url: 'https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html',
    },
  ],
};
