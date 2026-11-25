import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Uma importação pode receber milhares de registros. Combine um canal limitado com uma quantidade máxima de tarefas e trate encerramento como parte do fluxo, para que a equipe consiga verificar o que terminou e o que ainda aguarda processamento.',
  sections: [
    {
      id: 'limites-em-camadas',
      title: 'Limite a fila e o trabalho em andamento',
      blocks: [
        {
          type: 'text',
          text: 'O canal controla quantos itens ficam esperando. O grupo de tarefas controla quantas operações podem estar em andamento ou aguardando coleta. Confira esse limite antes de receber mais um item. Assim, o despachante também evita acumular uma lista própria de tarefas já retiradas da fila.',
        },
        {
          type: 'classify',
          activityId: 'limites-da-operacao',
          prompt: 'Associe cada verificação ao limite que ela demonstra.',
          buckets: ['Capacidade em espera', 'Tarefas iniciadas sem coleta'],
          items: [
            { text: 'Um produtor precisa esperar ao tentar enviar com a fila cheia', bucket: 0 },
            { text: 'O JoinSet nunca ultrapassa dois trabalhos aguardando coleta', bucket: 1 },
          ],
          explanation:
            'Os dois limites se referem a pontos diferentes do fluxo. Uma fila pequena sozinha não limita quantos trabalhos podem ser iniciados.',
        },
      ],
    },
    {
      id: 'coletar-e-drenar',
      title: 'Colete um resultado antes de abrir mais espaço',
      blocks: [
        {
          type: 'text',
          text: 'Num projeto novo, rode `cargo add tokio@1 --features macros,rt-multi-thread,sync,time`. Quando o `JoinSet` atinge duas tarefas, `join_next` coleta uma delas. O canal sinaliza fim quando os produtores fecham e a fila termina. Depois disso, colete os resultados restantes. Ordenamos os IDs apenas na apresentação, pois as tarefas podem concluir em ordens diferentes.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Fila limitada, no máximo duas tarefas e coleta final',
          code: `use std::time::Duration;
use tokio::{sync::mpsc, task::{JoinError, JoinSet}};

async fn processar(mut rx: mpsc::Receiver<u32>) -> Result<(Vec<u32>, usize), JoinError> {
    let mut tarefas = JoinSet::new();
    let mut concluidas = Vec::new();
    let mut pico = 0;

    loop {
        if tarefas.len() == 2 {
            concluidas.push(tarefas.join_next().await.expect("há duas tarefas")?);
        }
        let Some(id) = rx.recv().await else { break };
        tarefas.spawn(async move {
            tokio::time::sleep(Duration::from_millis(1)).await;
            id
        });
        pico = pico.max(tarefas.len());
    }
    while let Some(resultado) = tarefas.join_next().await {
        concluidas.push(resultado?);
    }
    Ok((concluidas, pico))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let (tx, rx) = mpsc::channel(4);
    let produtor = tokio::spawn(async move {
        for id in 1..=6 {
            tx.send(id).await?;
        }
        Ok::<(), mpsc::error::SendError<u32>>(())
    });
    let (mut concluidas, pico) = processar(rx).await?;
    produtor.await??;
    concluidas.sort_unstable();
    println!("IDs: {concluidas:?}");
    println!("Pico aguardando coleta: {pico}");
    Ok(())
}`,
          output: 'IDs: [1, 2, 3, 4, 5, 6]\nPico aguardando coleta: 2',
        },
        {
          type: 'fill',
          activityId: 'coletar-para-liberar-vaga',
          language: 'rust',
          prompt: 'Complete o método que aguarda o próximo término do grupo de tarefas.',
          template: 'let terminado = tarefas.[[join_next]]().await;',
          explanation: 'O método devolve o resultado de uma tarefa e a remove do grupo.',
        },
        {
          type: 'quiz',
          activityId: 'encerrar-com-trabalho-em-andamento',
          question:
            'O receptor retornou None e ainda há uma tarefa no JoinSet. O que o código deve fazer no encerramento normal?',
          options: [
            {
              text: 'Aguardar a tarefa e registrar seu resultado.',
              correct: true,
              feedback:
                'O fim da fila informa que não haverá novos registros. A tarefa em andamento ainda precisa ser tratada.',
            },
            {
              text: 'Sair do escopo imediatamente.',
              feedback:
                'Descartar o grupo cancela as tarefas restantes. O encerramento normal do laboratório precisa coletá-las.',
            },
          ],
        },
      ],
    },
    {
      id: 'politica-de-encerramento',
      title: 'Separe drenagem, prazo e reprocessamento',
      blocks: [
        {
          type: 'text',
          text: 'Para drenar após um sinal de parada, feche a recepção com `Receiver::close` e consuma as mensagens que já foram aceitas. Aguarde as tarefas até o prazo combinado. Se precisar abortar, registre quais resultados já foram confirmados e o que deve ser reprocessado. Uma operação com efeitos externos exige confirmação antes de decidir a repetição.',
        },
        {
          type: 'order',
          activityId: 'encerramento-gracioso',
          prompt: 'Ordene o encerramento normal de um importador que aceita novas tarefas.',
          items: [
            'Parar de aceitar entradas novas',
            'Drenar a fila e aguardar tarefas dentro do prazo',
            'Registrar o que foi concluído e o que ficou pendente',
          ],
          explanation:
            'Separar aceitação e conclusão evita assumir que toda entrada recebida já foi processada.',
        },
      ],
    },
  ],
  recap: [
    'Controlo quanto pode esperar e quanto pode ser iniciado.',
    'Coleto os resultados inclusive após o fim da fila.',
    'Defino como verificar o que ficou pendente depois de uma interrupção.',
  ],
  cards: [
    {
      id: 'fila',
      front: 'O que limita mpsc::channel(4)?',
      back: 'O buffer do canal, antes do processamento.',
    },
    {
      id: 'pico',
      front: 'O que pico mede neste exemplo?',
      back: 'O número máximo de tarefas no JoinSet que ainda aguardavam coleta.',
    },
    {
      id: 'drenagem',
      front: 'O que fazer após Receiver::close em um encerramento gracioso?',
      back: 'Continuar recebendo as mensagens aceitas até drenar o canal.',
    },
    {
      id: 'auditoria',
      front: 'O que verificar depois de abortar uma tarefa com escrita?',
      back: 'Que dados ela já confirmou e se uma nova tentativa é segura.',
    },
  ],
  mission: {
    title: 'Comprove que o importador fecha sem perder o lote aceito',
    text: 'Faça o produtor enviar vários registros. Separe a verificação de IDs concluídos da ordem de término.',
    steps: [
      'Rode com a fila e o limite do exemplo, e depois com uma fila menor.',
      'Mostre todas as conclusões e anote o que acontece quando fecha a recepção enquanto ainda há itens na fila.',
    ],
  },
  sources: [
    {
      title: 'Tokio — JoinSet',
      url: 'https://docs.rs/tokio/latest/tokio/task/struct.JoinSet.html',
    },
    {
      title: 'Tokio — canal mpsc e encerramento',
      url: 'https://docs.rs/tokio/latest/tokio/sync/mpsc/index.html',
    },
  ],
};
