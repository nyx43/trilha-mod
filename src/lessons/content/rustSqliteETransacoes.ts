import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O último item de um lote pode falhar depois que uma linha já foi gravada. Use uma transação para proteger o catálogo inteiro e confirme que uma atualização de título preserva o progresso que o aluno já tem.',
  sections: [
    {
      id: 'restricoes-e-atualizacao',
      title: 'Transcreva os critérios para regras da tabela',
      blocks: [
        {
          type: 'text',
          text: 'O ID é a chave primária. O título precisa ter conteúdo. O progresso começa desmarcado quando a aula é inserida. Em caso de conflito pelo ID, a cláusula `DO UPDATE` muda somente o título. Em um projeto usado ao longo do tempo, guarde a criação da tabela e as mudanças futuras em migrações numeradas para aplicar as mesmas regras em cada ambiente.',
        },
        {
          type: 'quiz',
          activityId: 'preservar-a-coluna-certa',
          question: 'Qual cláusula mantém o progresso quando já existe uma aula com o mesmo ID?',
          options: [
            {
              text: '`DO UPDATE SET titulo = excluded.titulo`',
              correct: true,
              feedback:
                'O UPDATE nomeia apenas o campo de título. A coluna de progresso conserva o valor existente.',
            },
            {
              text: '`DO UPDATE SET estudada = 0`',
              feedback: 'Essa cláusula reinicia o progresso e deixa o título anterior.',
            },
          ],
        },
      ],
    },
    {
      id: 'transacao-do-lote',
      title: 'Confirme o lote inteiro quando todas as linhas passarem',
      blocks: [
        {
          type: 'text',
          text: 'Em um projeto novo, rode `cargo add sqlx@0.8 --no-default-features --features runtime-tokio,sqlite` e `cargo add tokio@1 --features macros,rt-multi-thread`. O exemplo usa um banco em memória com uma conexão. `bind` fornece os valores para os parâmetros SQL. A função grava todos os itens na mesma transação e reverte as mudanças quando uma escrita falha.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Importador SQLx com um lote válido e outro que deve reverter',
          code: `use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};

async fn importar(pool: &SqlitePool, lote: &[(i64, &str)]) -> sqlx::Result<()> {
    let mut tx = pool.begin().await?;
    for &(id, titulo) in lote {
        let escrita = sqlx::query(
            "INSERT INTO aulas (id, titulo) VALUES (?, ?)
             ON CONFLICT(id) DO UPDATE SET titulo = excluded.titulo",
        )
        .bind(id)
        .bind(titulo.trim())
        .execute(&mut *tx).await;

        if let Err(erro) = escrita {
            tx.rollback().await?;
            return Err(erro);
        }
    }
    tx.commit().await
}

#[tokio::main]
async fn main() -> sqlx::Result<()> {
    let pool = SqlitePoolOptions::new().max_connections(1)
        .connect("sqlite::memory:").await?;
    sqlx::query(
        "CREATE TABLE aulas (
            id INTEGER PRIMARY KEY CHECK (id > 0),
            titulo TEXT NOT NULL CHECK (length(trim(titulo)) > 0),
            estudada INTEGER NOT NULL DEFAULT 0 CHECK (estudada IN (0, 1))
         )",
    ).execute(&pool).await?;
    sqlx::query("INSERT INTO aulas VALUES (7, 'Rust básico', 1)")
        .execute(&pool).await?;

    let valido = [(7, "Fundamentos"), (8, "Cargo")];
    importar(&pool, &valido).await?;
    importar(&pool, &valido).await?;
    let invalido = [(9, "Testes"), (10, " ")];
    assert!(importar(&pool, &invalido).await.is_err());

    let aulas: Vec<(i64, String, i64)> = sqlx::query_as(
        "SELECT id, titulo, estudada FROM aulas ORDER BY id",
    ).fetch_all(&pool).await?;
    for (id, titulo, estudada) in aulas {
        println!("{id}: {titulo} | estudada: {}", estudada == 1);
    }
    Ok(())
}`,
          output: '7: Fundamentos | estudada: true\n8: Cargo | estudada: false',
        },
        {
          type: 'fill',
          activityId: 'manter-o-lote-atomico',
          language: 'rust',
          prompt: 'Complete o método que desfaz a primeira linha quando a segunda viola a regra.',
          template: 'tx.[[rollback]]().await?;',
          explanation:
            'A primeira escrita também pertence à transação. O rollback desfaz as mudanças daquela transação.',
        },
        {
          type: 'order',
          activityId: 'ordem-do-lote',
          prompt: 'Ordene o caminho de um lote que pode ser confirmado.',
          items: [
            'Abrir a transação',
            'Aplicar todas as escritas na mesma transação',
            'Confirmar e verificar os dados gravados',
          ],
          explanation: 'O commit só acontece depois de concluir o último item com sucesso.',
        },
      ],
    },
    {
      id: 'demonstrar-a-atomicidade',
      title: 'Ligue a resposta da API ao estado do banco',
      blocks: [
        {
          type: 'text',
          text: 'Na missão, ligue o handler de importação a uma função como `importar`. Confirme o alvo da unicidade, a preservação do progresso e a reação à falha. Para demonstrar a atomicidade, compare o banco antes e depois do lote inválido. Se o contrato exigir que o lote possa ser repetido, importe duas vezes e confira campos, ordem de consulta e quantidade final.',
        },
        {
          type: 'text',
          text: 'No Axum, disponibilize o pool com `with_state(pool)` e extraia `State(pool): State<SqlitePool>` antes de `Json(lote)` no handler. Valide os itens e transforme cada entrada em `(i64::from(aula.id), aula.titulo.as_str())`. Passe essa coleção a `importar` e responda com sucesso só depois de o commit terminar. Escolha uma resposta de validação para dados inválidos e uma falha de servidor para problemas de acesso ao banco.',
        },
        {
          type: 'quiz',
          activityId: 'provar-rollback-na-aplicacao',
          question: 'Que observação prova que a primeira linha do lote inválido foi revertida?',
          options: [
            {
              text: 'O ID 9 está ausente na consulta feita depois do erro.',
              correct: true,
              feedback:
                'O ID 9 era válido e vinha antes do erro. Sua ausência mostra que a escrita anterior não foi confirmada.',
            },
            {
              text: 'A API mostrou uma mensagem de erro para o ID 10.',
              feedback:
                'A mensagem confirma o erro, mas é compatível com uma gravação parcial. Consulte o estado para verificar o rollback.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Uso a chave primária e as restrições para proteger dados.',
    'Atualizo somente os campos autorizados e gravo o lote numa transação.',
    'Demonstro sucesso, repetição e reversão consultando o banco.',
  ],
  cards: [
    {
      id: 'chave',
      front: 'O que identifica uma aula duplicada neste contrato?',
      back: 'O mesmo ID, protegido pela chave primária.',
    },
    {
      id: 'parametros',
      front: 'Para que servem os parâmetros ? e bind no exemplo?',
      back: 'Para enviar os valores ao SQLite separados do texto SQL.',
    },
    {
      id: 'commit',
      front: 'Quando chamar commit?',
      back: 'Depois que todas as escritas do lote forem concluídas com sucesso.',
    },
    {
      id: 'prova',
      front: 'Como demonstrar rollback além de receber um erro?',
      back: 'Consulte o banco e confirme que nenhuma linha daquele lote ficou gravada.',
    },
  ],
  mission: {
    title: 'Demonstre o aceite do importador ao cliente',
    text: 'Vá ao módulo API, banco e critérios de aceite e abra a missão Transforme o pedido em um contrato.',
    steps: [
      'Importe um lote válido duas vezes e mostre o título atualizado, o progresso preservado e a quantidade de aulas.',
      'Envie um lote com erro no segundo item e registre a resposta HTTP e os dados encontrados depois.',
    ],
  },
  sources: [
    {
      title: 'Axum 0.8 — estado compartilhado com State',
      url: 'https://docs.rs/axum/0.8.9/axum/extract/struct.State.html',
    },
    {
      title: 'SQLx 0.8 — transações',
      url: 'https://docs.rs/sqlx/0.8.6/sqlx/struct.Transaction.html',
    },
    { title: 'SQLite — UPSERT', url: 'https://www.sqlite.org/lang_upsert.html' },
  ],
};
