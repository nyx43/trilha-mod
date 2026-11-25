import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O suporte recebeu um ID de lote e a frase “algumas aulas sumiram”. Instrumente o importador para seguir o lote, ver onde houve rejeições e medir tempo sem descrever nos logs o conteúdo de cada registro.',
  sections: [
    {
      id: 'sinais-para-investigar',
      title: 'Escolha sinais que respondam à pergunta operacional',
      blocks: [
        {
          type: 'text',
          text: 'Um span associa eventos a um contexto de trabalho. Use um identificador de lote e contagens para distinguir duas execuções. Eventos estruturados registram campos consultáveis. Para acompanhar volume e latência ao longo do tempo, agregue métricas por categorias estáveis, como resultado. IDs de lote servem para buscas no log e geram muitos valores distintos quando usados como rótulos de métricas.',
        },
        {
          type: 'classify',
          activityId: 'onde-evidenciar',
          prompt: 'Associe cada dado ao lugar em que ele funciona melhor.',
          buckets: ['Campo para investigar uma execução', 'Rótulo de métrica com poucos valores'],
          items: [
            { text: 'Identificador individual do lote', bucket: 0 },
            { text: 'Resultado geral: sucesso, parcial ou falha', bucket: 1 },
            { text: 'Horário de um evento específico do lote', bucket: 0 },
          ],
          explanation:
            'Os campos tornam um caso localizável. Os rótulos permitem agrupar medições em conjuntos pequenos e comparáveis.',
        },
      ],
    },
    {
      id: 'instrumentar-um-lote',
      title: 'Registre contexto e contagens com tracing',
      blocks: [
        {
          type: 'text',
          text: 'Em um projeto Cargo, rode `cargo add tracing@0.1 --features attributes` e `cargo add tracing-subscriber@0.3 --no-default-features --features fmt`. `instrument` abre um span para a função. Use `skip(payload)` para deixar o conteúdo fora e registre o tamanho em bytes. Guarde o resultado do lote como uma contagem que o suporte possa comparar à quantidade enviada.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Instrumente dois lotes fictícios e observe os eventos',
          code: `use std::time::Instant;
use tracing::{info, instrument, warn};

#[instrument(skip(payload), fields(bytes = payload.len()))]
fn importar(lote_id: u64, payload: &str) {
    let inicio = Instant::now();
    let mut aceitas = 0;
    let mut rejeitadas = 0;
    for linha in payload.lines() {
        match linha.split_once('|') {
            Some((id, titulo)) if id.parse::<u32>().is_ok_and(|id| id > 0)
                && !titulo.trim().is_empty() => aceitas += 1,
            _ => rejeitadas += 1,
        }
    }
    if rejeitadas > 0 {
        warn!(rejeitadas, "lote contém rejeições");
    }
    info!(aceitas, rejeitadas, duracao_us = inicio.elapsed().as_micros() as u64, "lote encerrado");
}

fn main() {
    tracing_subscriber::fmt().without_time().with_target(false).init();
    importar(101, "7|Cargo\\n8|Testes");
    importar(102, "9|DADO-FICTICIO\\nlinha-invalida");
}`,
        },
        {
          type: 'fill',
          activityId: 'omitir-conteudo',
          prompt: 'Complete a opção que deixa o corpo da entrada fora dos campos automáticos.',
          language: 'rust',
          template: '#[instrument([[skip]](payload), fields(bytes = payload.len()))]',
          explanation:
            'A anotação registra apenas os campos desejados e deixa o conteúdo da entrada fora do span.',
        },
        {
          type: 'quiz',
          activityId: 'localizar-o-lote',
          question: 'Que campos permitem descobrir por que o lote 102 devolveu uma aula a menos?',
          options: [
            {
              text: 'O ID do lote e as quantidades de aceitas e rejeitadas.',
              correct: true,
              feedback: 'Os eventos do lote 102 mostram que houve uma aceitação e uma rejeição.',
            },
            {
              text: 'A duração em microssegundos, isoladamente.',
              feedback:
                'A duração mede tempo. Ela não demonstra o resultado de cada classificação.',
            },
          ],
        },
      ],
    },
    {
      id: 'diagnosticar-com-evidencias',
      title: 'Valide o diagnóstico com uma entrada conhecida',
      blocks: [
        {
          type: 'text',
          text: 'Filtre os eventos por `lote_id`. Para 101, espere duas aceitas e zero rejeitadas. Para 102, espere uma de cada e um aviso. A duração varia entre execuções. Se um caso chegar pelo suporte, associe o evento ao contrato e reproduza com dados sintéticos. Use logs, métricas e traces para formular uma hipótese que possa ser verificada.',
        },
        {
          type: 'order',
          activityId: 'investigacao-de-lote',
          prompt: 'Ordene uma investigação que possa ser repetida por outra pessoa.',
          items: [
            'Localizar eventos pelo identificador do lote',
            'Conferir contagens e status da execução',
            'Reproduzir o caso com dados sintéticos e validar a hipótese',
          ],
          explanation:
            'Correlacionar e conferir o resultado dá ao teste uma hipótese concreta para reproduzir.',
        },
      ],
    },
  ],
  recap: [
    'Atribuo contexto ao lote com spans e eventos.',
    'Registro apenas os campos necessários para o diagnóstico.',
    'Uso o que observei para construir uma reprodução verificável.',
  ],
  cards: [
    {
      id: 'span',
      front: 'Para que serve um span neste importador?',
      back: 'Agrupar os eventos da função sob o contexto de um lote.',
    },
    {
      id: 'skip',
      front: 'Como excluir o argumento payload da captura automática?',
      back: 'Use skip(payload) em instrument.',
    },
    {
      id: 'id',
      front: 'Onde usar o ID de lote para procurar uma execução?',
      back: 'Em campos de eventos ou spans, para correlação.',
    },
    {
      id: 'contagens',
      front: 'Que contagens confirmam o caso parcial do laboratório?',
      back: 'Uma aula aceita e uma rejeitada no lote 102.',
    },
  ],
  mission: {
    title: 'Faça o diagnóstico de um lote sem expor seu conteúdo',
    text: 'Rode o importador com dois lotes sintéticos, um deles com rejeições.',
    steps: [
      'Confirme que os eventos separam os IDs e registram as contagens esperadas.',
      'Procure o texto fictício nos logs e confirme que só os campos escolhidos aparecem.',
    ],
  },
  sources: [
    {
      title: 'Tracing — instrument e exclusão de campos',
      url: 'https://docs.rs/tracing/latest/tracing/attr.instrument.html',
    },
    {
      title: 'Tracing Subscriber — formatação de eventos',
      url: 'https://docs.rs/tracing-subscriber/latest/tracing_subscriber/fmt/index.html',
    },
  ],
};
