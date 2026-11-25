import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O cliente recebeu um timeout e enviou a mesma importação de novo. A primeira tentativa pode já ter confirmado. Modele uma chave de operação para reconhecer repetições e deixe o banco provar se o efeito e a confirmação aconteceram juntos.',
  sections: [
    {
      id: 'contrato-da-repeticao',
      title: 'Diferencie repetir uma operação de reutilizar sua chave',
      blocks: [
        {
          type: 'text',
          text: 'O exemplo guarda uma chave única e os dados normalizados da operação. Repetir a chave com os mesmos dados devolve o resultado de repetição. Reutilizar a chave com outros dados devolve conflito. A confirmação da chave e a alteração da aula pertencem à mesma transação. O laboratório usa um único catálogo. Em um serviço que atende clientes diferentes, inclua a identidade do catálogo na chave de unicidade.',
        },
        {
          type: 'classify',
          activityId: 'classificar-tentativas',
          prompt: 'Associe cada tentativa ao resultado esperado.',
          buckets: ['Aplicada', 'Repetida', 'Conflito'],
          items: [
            { text: 'Primeiro uso da chave com dados válidos', bucket: 0 },
            { text: 'Chave confirmada com os mesmos dados normalizados', bucket: 1 },
            { text: 'Chave confirmada com título diferente', bucket: 2 },
          ],
          explanation:
            'A chave identifica uma operação. O conteúdo confirma se a nova tentativa é a mesma operação.',
        },
      ],
    },
    {
      id: 'reservar-e-confirmar',
      title: 'Grave a chave junto com o efeito da operação',
      blocks: [
        {
          type: 'text',
          text: 'Use `cargo add sqlx@0.8 --no-default-features --features runtime-tokio,sqlite` e `cargo add tokio@1 --features macros,rt-multi-thread`. Primeiro tente inserir a chave, protegida pelo banco. `rows_affected` indica se ela já existia. Uma falha ao escrever a aula reverte também a reserva da chave.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Repita uma operação, tente um conflito e provoque uma falha',
          code: `use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};

#[derive(Debug)]
enum Entrega { Aplicada, Repetida, Conflito }

async fn aplicar(
    pool: &SqlitePool, chave: &str, id: i64, titulo: &str,
) -> sqlx::Result<Entrega> {
    let mut tx = pool.begin().await?;
    let titulo = titulo.trim();
    let novas = sqlx::query(
        "INSERT INTO entregas (chave, id, titulo) VALUES (?, ?, ?)
         ON CONFLICT(chave) DO NOTHING",
    ).bind(chave).bind(id).bind(titulo).execute(&mut *tx).await?.rows_affected();

    if novas == 0 {
        let anterior: (i64, String) = sqlx::query_as(
            "SELECT id, titulo FROM entregas WHERE chave = ?",
        ).bind(chave).fetch_one(&mut *tx).await?;
        tx.commit().await?;
        return Ok(if anterior.0 == id && anterior.1 == titulo {
            Entrega::Repetida
        } else {
            Entrega::Conflito
        });
    }

    let escrita = sqlx::query(
        "INSERT INTO aulas (id, titulo) VALUES (?, ?)
         ON CONFLICT(id) DO UPDATE SET titulo = excluded.titulo",
    ).bind(id).bind(titulo).execute(&mut *tx).await;
    if let Err(erro) = escrita {
        tx.rollback().await?;
        return Err(erro);
    }
    tx.commit().await?;
    Ok(Entrega::Aplicada)
}

#[tokio::main]
async fn main() -> sqlx::Result<()> {
    let db = SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await?;
    sqlx::query("CREATE TABLE aulas (id INTEGER PRIMARY KEY CHECK(id > 0), titulo TEXT NOT NULL)")
        .execute(&db).await?;
    sqlx::query("CREATE TABLE entregas (
        chave TEXT PRIMARY KEY NOT NULL, id INTEGER NOT NULL, titulo TEXT NOT NULL
    )")
        .execute(&db).await?;

    println!("{:?}", aplicar(&db, "req-1", 7, "Cargo").await?);
    println!("{:?}", aplicar(&db, "req-1", 7, " Cargo ").await?);
    println!("{:?}", aplicar(&db, "req-1", 7, "Outro título").await?);
    assert!(aplicar(&db, "req-2", 0, "Falha").await.is_err());
    let reservas: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM entregas").fetch_one(&db).await?;
    let titulo: String = sqlx::query_scalar("SELECT titulo FROM aulas WHERE id = 7")
        .fetch_one(&db).await?;
    println!("Chaves confirmadas: {reservas}; título: {titulo}");
    Ok(())
}`,
          output: 'Aplicada\nRepetida\nConflito\nChaves confirmadas: 1; título: Cargo',
        },
        {
          type: 'fill',
          activityId: 'reservar-uma-unica-vez',
          language: 'sql',
          prompt: 'Complete a cláusula que mantém a reserva anterior quando a chave já existe.',
          template:
            'INSERT INTO entregas (chave, id, titulo) VALUES (?, ?, ?) ON CONFLICT(chave) DO [[NOTHING]];',
          explanation:
            'A operação deixa a entrada original disponível para comparar os dados da nova tentativa.',
        },
      ],
    },
    {
      id: 'reprocessar-com-evidencia',
      title: 'Verifique o estado depois de uma falha aparente',
      blocks: [
        {
          type: 'text',
          text: 'Um timeout do cliente deixa o resultado desconhecido. A repetição com a mesma chave permite conferir o efeito já registrado. Em produção, defina as regras de retenção, concorrência e resposta da API. Para a entrega da missão, mostre a primeira aplicação, a repetição e um conflito, além da ausência de uma chave quando a escrita foi revertida.',
        },
        {
          type: 'quiz',
          activityId: 'chave-apos-rollback',
          question: 'Por que a chave req-2 não aparece na contagem final?',
          options: [
            {
              text: 'A reserva foi escrita dentro da transação que também reverteu a aula inválida.',
              correct: true,
              feedback: 'O rollback desfaz as operações da mesma transação, inclusive a reserva.',
            },
            {
              text: 'A chave foi confirmada e excluída por um temporizador.',
              feedback: 'O exemplo não usa expiração. A ausência é consequência do rollback.',
            },
          ],
        },
        {
          type: 'order',
          activityId: 'confirmar-efeito-e-reserva',
          prompt: 'Ordene as operações da primeira tentativa válida.',
          items: [
            'Abrir a transação e reservar a chave',
            'Gravar a alteração pedida',
            'Confirmar a transação e devolver o resultado',
          ],
          explanation:
            'Confirmar apenas depois de registrar ambos os efeitos mantém a chave e a aula consistentes.',
        },
      ],
    },
  ],
  recap: [
    'Represento repetições e conflitos com resultados distintos.',
    'Confirmo a chave e a alteração na mesma transação.',
    'Demonstro o estado do banco depois de uma repetição e de uma falha.',
  ],
  cards: [
    {
      id: 'repeticao',
      front: 'O que torna uma tentativa uma repetição?',
      back: 'Usar a chave já confirmada com os mesmos dados normalizados.',
    },
    {
      id: 'conflito',
      front: 'O que indica a mesma chave com outro título?',
      back: 'Conflito de operação.',
    },
    {
      id: 'atomicidade',
      front: 'Por que gravar chave e aula na mesma transação?',
      back: 'Para confirmar ou desfazer os dois efeitos juntos.',
    },
    {
      id: 'timeout',
      front: 'O que um timeout do cliente prova sobre o commit?',
      back: 'Que o cliente ficou sem resposta no prazo. O estado da operação precisa ser conferido.',
    },
  ],
  mission: {
    title: 'Prove a repetição segura de uma importação',
    text: 'Escolha uma entrada válida, uma repetição e um conflito de chave.',
    steps: [
      'Mostre o resultado de cada tentativa e confirme que título e quantidade permanecem corretos.',
      'Force a falha da segunda escrita da transação e consulte a contagem de chaves para demonstrar o rollback.',
    ],
  },
  sources: [
    { title: 'SQLx — transações', url: 'https://docs.rs/sqlx/0.8.6/sqlx/struct.Transaction.html' },
    { title: 'SQLite — conflitos em UPSERT', url: 'https://www.sqlite.org/lang_upsert.html' },
  ],
};
