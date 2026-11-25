import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Um importador recebe trabalho mais depressa do que consegue processar. Modele o que acontece quando a fila enche e garanta que o processo consegue encerrar depois de consumir as tarefas aceitas.',
  sections: [
    {
      id: 'produtor-e-worker',
      title: 'Desenhe o caminho de cada tarefa',
      blocks: [
        {
          type: 'text',
          text: 'O produtor cria tarefas. Um worker recebe a tarefa e processa os dados. Em `sync_channel(2)`, até duas mensagens aguardam na fila. Uma terceira pode ficar em processamento no worker quando ele já retirou uma mensagem. Escolha limites para a fila e para o número de workers de acordo com o trabalho e a memória disponível.',
        },
        {
          type: 'classify',
          activityId: 'separar-fila-e-execucao',
          prompt: 'Classifique o que cada limite controla.',
          buckets: ['Capacidade da fila', 'Número de workers'],
          items: [
            { text: 'Mensagens que aguardam para começar', bucket: 0 },
            { text: 'Tarefas que podem estar em processamento simultaneamente', bucket: 1 },
            { text: 'Quantas mensagens cabem antes de aplicar pressão no produtor', bucket: 0 },
          ],
          explanation:
            'O worker libera um espaço assim que tira o item da fila. A quantidade de trabalho esperando e a quantidade em execução são distintas.',
        },
      ],
    },
    {
      id: 'fila-cheia-e-envio',
      title: 'Encha a fila de forma controlada e trate a pressão',
      blocks: [
        {
          type: 'text',
          text: '`try_send` volta imediatamente. Se estiver cheia, `Full(tarefa)` devolve o que ainda precisa ser enviado. `send` aguarda o consumidor abrir espaço e volta com erro se ele foi desconectado. Antes de escolher esperar, confirme que existe um consumidor independente capaz de liberar espaço.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Encha uma fila de dois lugares e depois inicie o worker',
          code: `use std::sync::mpsc::{sync_channel, TrySendError};
use std::thread;

fn main() {
    let (tx, rx) = sync_channel(2);
    tx.send((7, " Cargo ")).unwrap();
    tx.send((8, " Filas ")).unwrap();

    let pendente = match tx.try_send((9, " Testes ")) {
        Err(TrySendError::Full(tarefa)) => tarefa,
        outro => panic!("esperava fila cheia, recebido: {outro:?}"),
    };
    println!("Fila cheia; tarefa pendente: {}", pendente.0);

    let worker = thread::spawn(move || {
        rx.into_iter()
            .map(|(id, titulo)| (id, titulo.trim().to_owned()))
            .collect::<Vec<_>>()
    });
    tx.send(pendente).unwrap();
    drop(tx);
    println!("{:?}", worker.join().unwrap());
}`,
          output: 'Fila cheia; tarefa pendente: 9\n[(7, "Cargo"), (8, "Filas"), (9, "Testes")]',
        },
        {
          type: 'quiz',
          activityId: 'porque-fila-cheia',
          question: 'Por que o primeiro try_send da tarefa 9 devolve Full neste exemplo?',
          options: [
            {
              text: 'As duas posições estão ocupadas e o worker ainda não começou.',
              correct: true,
              feedback:
                'O exemplo controla a ordem da preparação e garante que nenhum consumidor retire um item antes da verificação.',
            },
            {
              text: 'O ID 9 é maior que a capacidade da fila.',
              feedback:
                'O limite mede quantas mensagens estão na fila. O valor do ID não participa dessa decisão.',
            },
          ],
        },
      ],
    },
    {
      id: 'encerrar-sem-deixar-worker-preso',
      title: 'Feche o canal e aguarde o worker',
      blocks: [
        {
          type: 'text',
          text: 'Quando todos os remetentes são descartados, o receptor ainda pode consumir as mensagens em espera. Em seguida, `into_iter` termina. `join` aguarda o worker e permite observar tanto seu resultado quanto um eventual panic. Neste laboratório, `unwrap` simplifica as condições do exemplo. Em código que recebe dados de fora, trate as falhas de envio e do worker.',
        },
        {
          type: 'text',
          text: 'Para experimentar dois workers com a biblioteca padrão, crie um canal por worker. Duas filas com duas posições cada limitam a espera total a quatro mensagens. Alterne o envio entre elas e conte as tarefas concluídas ao aguardar as duas threads. Observe se um envio bloqueado deixa a outra fila ociosa.',
        },
        {
          type: 'fill',
          activityId: 'sinalizar-fim-da-entrada',
          language: 'rust',
          prompt: 'Complete para fechar o único remetente antes de aguardar o worker.',
          template: '[[drop]](tx);\nlet resultado = worker.join();',
          explanation: 'O worker termina o laço quando drena a fila e já não existem remetentes.',
        },
        {
          type: 'order',
          activityId: 'encerrar-a-importacao',
          prompt: 'Ordene um encerramento que drene as tarefas aceitas.',
          items: [
            'Parar a produção de novas tarefas',
            'Descartar todos os remetentes',
            'Aguardar os workers e verificar o resultado',
          ],
          explanation:
            'A próxima leitura só consegue observar o fim do canal depois de consumir as mensagens e perder os remetentes.',
        },
      ],
    },
  ],
  recap: [
    'Distingo tarefas em espera de tarefas ativas.',
    'Trato a fila cheia e sei quando o envio pode aguardar.',
    'Encerro a produção, sinalizo o fim da fila e verifico o resultado do worker.',
  ],
  cards: [
    {
      id: 'capacidade',
      front: 'O que sync_channel(2) limita?',
      back: 'A quantidade de mensagens em espera na fila.',
    },
    {
      id: 'full',
      front: 'O que recebe o produtor ao usar try_send em uma fila cheia?',
      back: 'Full com o valor da tarefa que não foi enfileirada.',
    },
    {
      id: 'fechar',
      front: 'Quando o laço de recepção termina após o fechamento?',
      back: 'Após o último remetente ser descartado e as mensagens restantes serem consumidas.',
    },
    {
      id: 'join',
      front: 'O que join permite conferir?',
      back: 'O término e o resultado da thread, inclusive a ocorrência de panic.',
    },
  ],
  mission: {
    title: 'Demonstre fila cheia e encerramento',
    text: 'Rode o exemplo com duas posições e mude depois para uma única posição.',
    steps: [
      'Adapte a preparação para comprovar que o envio excedente devolve Full.',
      'Mostre que as tarefas aceitas são processadas e que a thread termina depois de fechar o canal.',
    ],
  },
  sources: [
    {
      title: 'Biblioteca padrão — canal limitado',
      url: 'https://doc.rust-lang.org/std/sync/mpsc/fn.sync_channel.html',
    },
    {
      title: 'Rust Book — canais e troca de mensagens',
      url: 'https://doc.rust-lang.org/book/ch16-02-message-passing.html',
    },
  ],
};
